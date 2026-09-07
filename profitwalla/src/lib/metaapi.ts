import type { CopyMode } from './ct-types';

const METAAPI_TOKEN = process.env.METAAPI_TOKEN;

export interface MetaApiAccount {
  id: string;
  name: string;
  state: string;
  login: string;
  server: string;
  platform: number;
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  leverage: number;
  marginLevel: number;
}

export interface MetaApiTrade {
  id: string;
  type: string;
  symbol: string;
  volume: number;
  openPrice: number;
  currentPrice: number;
  profit: number;
  sl: number | null;
  tp: number | null;
  openTime: string;
}

export interface CopyTradeRequest {
  symbol: string;
  action: 'ORDER_TYPE_BUY' | 'ORDER_TYPE_SELL';
  volume: number;
  stopLoss?: number;
  takeProfit?: number;
  comment?: string;
}

class MetaApiService {
  private baseUrl = 'https://api-mt.agiliumtrade.ai';

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      'auth-token': METAAPI_TOKEN || '',
    };
  }

  async getAccountInfo(accountId: string): Promise<MetaApiAccount | null> {
    try {
      const res = await fetch(`${this.baseUrl}/users/current/accounts/${accountId}`, {
        headers: this.getHeaders(),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  async getOpenTrades(accountId: string): Promise<MetaApiTrade[]> {
    try {
      const res = await fetch(`${this.baseUrl}/users/current/accounts/${accountId}/positions`, {
        headers: this.getHeaders(),
      });
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  }

  async copyTrade(
    subscriberAccountId: string,
    trade: CopyTradeRequest
  ): Promise<{ success: boolean; tradeId?: string; error?: string }> {
    try {
      const res = await fetch(
        `${this.baseUrl}/users/current/accounts/${subscriberAccountId}/trade`,
        {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({
            action: trade.action,
            symbol: trade.symbol,
            volume: trade.volume,
            stopLoss: trade.stopLoss,
            takeProfit: trade.takeProfit,
            comment: trade.comment || 'CopyTrade',
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.message || 'Trade execution failed' };
      return { success: true, tradeId: data.orderId };
    } catch {
      return { success: false, error: 'Network error' };
    }
  }

  async closeTrade(accountId: string, tradeId: string): Promise<boolean> {
    try {
      const res = await fetch(
        `${this.baseUrl}/users/current/accounts/${accountId}/positions/${tradeId}`,
        { method: 'DELETE', headers: this.getHeaders() }
      );
      return res.ok;
    } catch {
      return false;
    }
  }

  async modifyTrade(
    accountId: string,
    tradeId: string,
    modifications: { stopLoss?: number; takeProfit?: number }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(
        `${this.baseUrl}/users/current/accounts/${accountId}/positions/${tradeId}`,
        {
          method: 'PATCH',
          headers: this.getHeaders(),
          body: JSON.stringify({
            stopLoss: modifications.stopLoss,
            takeProfit: modifications.takeProfit,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.message || 'Trade modification failed' };
      return { success: true };
    } catch {
      return { success: false, error: 'Network error' };
    }
  }

  calculateVolume(
    masterVolume: number,
    masterEquity: number,
    clientEquity: number,
    copyMode: CopyMode,
    lotRatio: number
  ): number {
    switch (copyMode) {
      case 'fixed_ratio':
        return Math.round(masterVolume * lotRatio * 100) / 100;
      case 'equity_proportional':
        return Math.round((masterVolume * clientEquity / masterEquity) * 100) / 100;
      case 'fixed_lot':
        return lotRatio;
      default:
        return masterVolume;
    }
  }

  isSymbolWhitelisted(symbol: string, whitelist: string[]): boolean {
    if (whitelist.length === 0) return true;
    return whitelist.some((s) => symbol.toUpperCase() === s.toUpperCase());
  }
}

export const metaApiService = new MetaApiService();
