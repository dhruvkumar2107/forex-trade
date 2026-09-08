const META_API_BASE_URL = "https://api-mt.agiliumtrade.ai";
const DEFAULT_TIMEOUT_MS = 30_000;
const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 1_000;
const RATE_LIMIT_BUFFER_MS = 200;

type CopyMode = "fixed_ratio" | "equity_proportional" | "fixed_lot";

interface MetaApiAccount {
  id: string;
  name: string;
  state: string;
  login: string;
  server: string;
  platform: string;
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  leverage: number;
  marginLevel: number;
}

interface MetaApiPosition {
  id: string;
  type: "POSITION_TYPE_BUY" | "POSITION_TYPE_SELL";
  symbol: string;
  volume: number;
  openPrice: number;
  currentPrice: number;
  profit: number;
  sl: number;
  tp: number;
  openTime: string;
  swap: number;
  commission: number;
  comment: string;
}

interface MetaApiTradeResult {
  success: boolean;
  orderId?: string;
  tradeId?: string;
  error?: string;
  errorCode?: number;
}

interface MetaApiConnectionStatus {
  state: string;
  healthScore: number;
  latencyMs: number;
}

interface TradeParams {
  symbol: string;
  action: "ORDER_TYPE_BUY" | "ORDER_TYPE_SELL";
  volume: number;
  stopLoss?: number;
  takeProfit?: number;
  comment?: string;
}

interface VolumeCalculation {
  masterVolume: number;
  masterEquity: number;
  clientEquity: number;
  copyMode: CopyMode;
  lotRatio: number;
  fixedLotSize?: number;
  minLot?: number;
  maxLot?: number;
  lotStep?: number;
}

interface MetaApiErrorResponse {
  message?: string;
  code?: number;
}

class MetaApiError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: number | undefined;
  public readonly endpoint: string;

  constructor(message: string, statusCode: number, errorCode: number | undefined, endpoint: string) {
    super(message);
    this.name = "MetaApiError";
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.endpoint = endpoint;
  }
}

class MetaApiService {
  private readonly token: string;
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly maxRetries: number;
  private lastRateLimitTime: number = 0;

  constructor() {
    this.token = process.env.METAAPI_TOKEN || "";
    this.baseUrl = META_API_BASE_URL;
    this.timeout = DEFAULT_TIMEOUT_MS;
    this.maxRetries = MAX_RETRIES;

    if (!this.token) {
      this.log("warn", "METAAPI_TOKEN environment variable is not set");
    }
  }

  private log(level: "info" | "warn" | "error" | "debug", message: string, context?: Record<string, unknown>): void {
    const timestamp = new Date().toISOString();
    const entry = { timestamp, level, message, ...context };
    if (level === "error") {
      console.error(JSON.stringify(entry));
    } else if (level === "warn") {
      console.warn(JSON.stringify(entry));
    } else {
      console.log(JSON.stringify(entry));
    }
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async respectRateLimit(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRateLimitTime;
    if (elapsed < RATE_LIMIT_BUFFER_MS) {
      await this.sleep(RATE_LIMIT_BUFFER_MS - elapsed);
    }
    this.lastRateLimitTime = Date.now();
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const startTime = Date.now();
    const url = `${this.baseUrl}${endpoint}`;
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      if (attempt > 0) {
        const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1);
        this.log("info", `Retry attempt ${attempt}/${this.maxRetries} after ${delay}ms`, { endpoint });
        await this.sleep(delay);
      }

      await this.respectRateLimit();

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
            "auth-token": this.token,
            ...options.headers,
          },
        });

        clearTimeout(timeoutId);
        const latencyMs = Date.now() - startTime;

        if (response.status === 429) {
          const retryAfter = parseInt(response.headers.get("Retry-After") || "30", 10);
          this.log("warn", "Rate limited", { endpoint, retryAfter, latencyMs });
          await this.sleep(retryAfter * 1000);
          lastError = new MetaApiError("Rate limited", 429, undefined, endpoint);
          continue;
        }

        if (response.status >= 500) {
          const body = await response.text().catch(() => "");
          this.log("warn", "Server error, will retry", { endpoint, status: response.status, latencyMs, body });
          lastError = new MetaApiError(
            `Server error: ${response.status}`,
            response.status,
            undefined,
            endpoint
          );
          continue;
        }

        if (!response.ok) {
          let errorBody: MetaApiErrorResponse = {};
          try {
            errorBody = await response.json();
          } catch {
            errorBody = { message: await response.text().catch(() => "Unknown error") };
          }
          const message = errorBody.message || `HTTP ${response.status}`;
          this.log("error", "API error", { endpoint, status: response.status, message, errorCode: errorBody.code, latencyMs });
          throw new MetaApiError(message, response.status, errorBody.code, endpoint);
        }

        const data = await response.json() as T;
        this.log("debug", "Request successful", { endpoint, latencyMs });
        return data;
      } catch (err: unknown) {
        clearTimeout(timeoutId);

        if (err instanceof MetaApiError) {
          throw err;
        }

        if (err instanceof DOMException && err.name === "AbortError") {
          lastError = new MetaApiError(`Request timed out after ${this.timeout}ms`, 408, undefined, endpoint);
          this.log("warn", "Request timeout", { endpoint, timeout: this.timeout, attempt });
          continue;
        }

        lastError = err instanceof Error ? err : new Error(String(err));
        this.log("warn", "Request failed", { endpoint, error: lastError.message, attempt });
      }
    }

    const latencyMs = Date.now() - startTime;
    this.log("error", "All retries exhausted", { endpoint, error: lastError?.message, latencyMs });
    throw lastError || new MetaApiError("Request failed after all retries", 500, undefined, endpoint);
  }

  async getAccountInfo(accountId: string): Promise<MetaApiAccount | null> {
    try {
      const data = await this.request<any>(`/users/current/accounts/${accountId}`);
      const info: MetaApiAccount = {
        id: data._id || accountId,
        name: data.name || "",
        state: data.state || "",
        login: String(data.login || ""),
        server: data.server || "",
        platform: data.platform || "",
        balance: Number(data.balance) || 0,
        equity: Number(data.equity) || 0,
        margin: Number(data.margin) || 0,
        freeMargin: Number(data.freeMargin) || 0,
        leverage: Number(data.leverage) || 1,
        marginLevel: Number(data.marginLevel) || 0,
      };
      return info;
    } catch (err) {
      if (err instanceof MetaApiError && err.statusCode === 404) {
        return null;
      }
      throw err;
    }
  }

  async getOpenPositions(accountId: string): Promise<MetaApiPosition[]> {
    const positions = await this.request<any[]>(`/users/current/accounts/${accountId}/positions`);
    return positions.map((p) => ({
      id: p._id || "",
      type: p.type || "POSITION_TYPE_BUY",
      symbol: p.symbol || "",
      volume: Number(p.volume) || 0,
      openPrice: Number(p.openPrice) || 0,
      currentPrice: Number(p.currentPrice) || 0,
      profit: Number(p.profit) || 0,
      sl: Number(p.stopLoss) || 0,
      tp: Number(p.takeProfit) || 0,
      openTime: p.time || "",
      swap: Number(p.swap) || 0,
      commission: Number(p.commission) || 0,
      comment: p.comment || "",
    }));
  }

  async getTradeHistory(accountId: string, startTime?: Date): Promise<any[]> {
    const from = startTime ? encodeURIComponent(startTime.toISOString()) : "";
    const query = from ? `?startTime=${from}` : "";
    return this.request<any[]>(`/users/current/accounts/${accountId}/history${query}`);
  }

  async executeTrade(accountId: string, params: TradeParams): Promise<MetaApiTradeResult> {
    const body: Record<string, unknown> = {
      action: params.action,
      symbol: params.symbol,
      volume: params.volume,
    };
    if (params.stopLoss !== undefined) body.stopLoss = params.stopLoss;
    if (params.takeProfit !== undefined) body.takeProfit = params.takeProfit;
    if (params.comment) body.comment = params.comment;

    try {
      const data = await this.request<any>(`/users/current/accounts/${accountId}/trade`, {
        method: "POST",
        body: JSON.stringify(body),
      });

      return {
        success: true,
        orderId: data.orderId,
        tradeId: data.tradeId,
      };
    } catch (err) {
      if (err instanceof MetaApiError) {
        return {
          success: false,
          error: err.message,
          errorCode: err.errorCode,
        };
      }
      return {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  }

  async closePosition(accountId: string, positionId: string): Promise<MetaApiTradeResult> {
    try {
      const data = await this.request<any>(`/users/current/accounts/${accountId}/positions/${positionId}`, {
        method: "DELETE",
      });

      return {
        success: true,
        orderId: data.orderId,
        tradeId: data.tradeId,
      };
    } catch (err) {
      if (err instanceof MetaApiError) {
        return {
          success: false,
          error: err.message,
          errorCode: err.errorCode,
        };
      }
      return {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  }

  async modifyPosition(
    accountId: string,
    positionId: string,
    params: { stopLoss?: number; takeProfit?: number }
  ): Promise<MetaApiTradeResult> {
    const body: Record<string, unknown> = {};
    if (params.stopLoss !== undefined) body.stopLoss = params.stopLoss;
    if (params.takeProfit !== undefined) body.takeProfit = params.takeProfit;

    try {
      const data = await this.request<any>(
        `/users/current/accounts/${accountId}/positions/${positionId}`,
        {
          method: "PUT",
          body: JSON.stringify(body),
        }
      );

      return {
        success: true,
        orderId: data.orderId,
        tradeId: data.tradeId,
      };
    } catch (err) {
      if (err instanceof MetaApiError) {
        return {
          success: false,
          error: err.message,
          errorCode: err.errorCode,
        };
      }
      return {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  }

  async getConnectionStatus(accountId: string): Promise<MetaApiConnectionStatus> {
    const startTime = Date.now();
    const data = await this.request<any>(`/users/current/accounts/${accountId}/connection`);
    const latencyMs = Date.now() - startTime;

    return {
      state: data.state || "unknown",
      healthScore: Number(data.healthScore) || 0,
      latencyMs,
    };
  }

  calculateVolume(params: VolumeCalculation): number {
    const {
      masterVolume,
      masterEquity,
      clientEquity,
      copyMode,
      lotRatio,
      fixedLotSize,
      minLot = 0.01,
      maxLot = 100,
      lotStep = 0.01,
    } = params;

    let volume: number;

    switch (copyMode) {
      case "fixed_ratio":
        volume = masterVolume * lotRatio;
        break;
      case "equity_proportional": {
        if (masterEquity <= 0) {
          this.log("warn", "Master equity is zero or negative, falling back to fixed_ratio", { masterEquity });
          volume = masterVolume * lotRatio;
          break;
        }
        volume = masterVolume * (clientEquity / masterEquity) * lotRatio;
        break;
      }
      case "fixed_lot":
        volume = fixedLotSize ?? 0.01;
        break;
      default:
        this.log("warn", "Unknown copy mode, using fixed_ratio", { copyMode });
        volume = masterVolume * lotRatio;
        break;
    }

    volume = Math.max(volume, minLot);
    volume = Math.min(volume, maxLot);

    if (lotStep > 0) {
      const steps = Math.round(volume / lotStep);
      volume = parseFloat((steps * lotStep).toFixed(2));
    }

    if (volume <= 0 || isNaN(volume)) {
      this.log("warn", "Calculated volume is zero or negative, clamping to minLot", { volume, minLot });
      volume = minLot;
    }

    return volume;
  }

  isSymbolWhitelisted(symbol: string, whitelist: string[]): boolean {
    if (!whitelist || whitelist.length === 0) {
      return false;
    }
    const normalized = symbol.toUpperCase().trim();
    return whitelist.some(
      (s) => s.toUpperCase().trim() === normalized
    );
  }
}

const metaApiService = new MetaApiService();

export {
  metaApiService,
  MetaApiService,
};
export type {
  MetaApiAccount,
  MetaApiPosition,
  MetaApiTradeResult,
  MetaApiConnectionStatus,
  MetaApiError,
  TradeParams,
  VolumeCalculation,
  CopyMode,
};
