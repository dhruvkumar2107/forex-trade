import { prisma } from './prisma';

export interface SymbolConfig {
  clientSymbol: string;
  pipSize: number;
  pipValue: number;
  contractSize: number;
  lotStep: number;
  minLot: number;
  maxLot: number;
  spreadPoints: number;
}

interface SymbolMappingRow {
  masterSymbol: string;
  clientSymbol: string;
  brokerPattern: string | null;
  pipSize: number | null;
  pipValue: number | null;
  contractSize: number | null;
  lotStep: number | null;
  minLot: number | null;
  maxLot: number | null;
  spreadPoints: number | null;
  isActive: boolean;
}

const COMMON_SUFFIXES = [".m", ".a", ".pro", ".raw", ".ecn", "m"] as const;

const EXNESS_FALLBACK: Record<string, string> = {
  XAUUSD: "XAUUSDm",
  EURUSD: "EURUSDm",
  BTCUSD: "BTCUSDm",
  GBPUSD: "GBPUSDm",
  AUDUSD: "AUDUSDm",
};

function matchesBrokerPattern(server: string, pattern: string): boolean {
  try {
    return new RegExp(pattern, "i").test(server);
  } catch {
    return false;
  }
}

function stripSuffix(symbol: string): string {
  for (const suffix of COMMON_SUFFIXES) {
    if (symbol.endsWith(suffix) && symbol.length > suffix.length) {
      return symbol.slice(0, -suffix.length);
    }
  }
  return symbol;
}

class SymbolMapper {
  private static instance: SymbolMapper;
  private constructor() {}

  static getInstance(): SymbolMapper {
    if (!SymbolMapper.instance) {
      SymbolMapper.instance = new SymbolMapper();
    }
    return SymbolMapper.instance;
  }

  normalizeSymbol(symbol: string): string {
    return stripSuffix(symbol).toUpperCase();
  }

  validateSymbol(symbol: string, allowedSymbols: string[]): boolean {
    const normalized = this.normalizeSymbol(symbol);
    return allowedSymbols.some(
      (s) => this.normalizeSymbol(s) === normalized
    );
  }

  async mapSymbol(
    masterSymbol: string,
    brokerServer: string
  ): Promise<string | null> {
    const config = await this.getSymbolConfig(masterSymbol, brokerServer);
    return config?.clientSymbol ?? null;
  }

  async getSymbolConfig(
    masterSymbol: string,
    brokerServer: string
  ): Promise<SymbolConfig | null> {
    const normalizedMaster = this.normalizeSymbol(masterSymbol);

    const rows = await prisma.symbolMapping.findMany({
      where: {
        isActive: true,
        masterSymbol: normalizedMaster,
      },
      orderBy: { updatedAt: "desc" },
    });

    for (const row of rows) {
      if (
        row.brokerPattern &&
        matchesBrokerPattern(brokerServer, row.brokerPattern)
      ) {
        return this.rowToConfig(row);
      }
    }

    for (const row of rows) {
      if (!row.brokerPattern) {
        return this.rowToConfig(row);
      }
    }

    const exnessFallback = EXNESS_FALLBACK[normalizedMaster];
    if (exnessFallback) {
      return {
        clientSymbol: exnessFallback,
        pipSize: 0.0001,
        pipValue: 10,
        contractSize: 100_000,
        lotStep: 0.01,
        minLot: 0.01,
        maxLot: 200,
        spreadPoints: 15,
      };
    }

    const clientFromSuffix = this.buildClientSymbol(normalizedMaster, brokerServer);
    if (clientFromSuffix) {
      return {
        clientSymbol: clientFromSuffix,
        pipSize: this.inferPipSize(normalizedMaster),
        pipValue: 10,
        contractSize: this.inferContractSize(normalizedMaster),
        lotStep: 0.01,
        minLot: 0.01,
        maxLot: 200,
        spreadPoints: 15,
      };
    }

    return {
      clientSymbol: normalizedMaster,
      pipSize: this.inferPipSize(normalizedMaster),
      pipValue: 10,
      contractSize: this.inferContractSize(normalizedMaster),
      lotStep: 0.01,
      minLot: 0.01,
      maxLot: 200,
      spreadPoints: 15,
    };
  }

  private buildClientSymbol(
    normalizedMaster: string,
    brokerServer: string
  ): string | null {
    const lower = brokerServer.toLowerCase();
    if (lower.includes("exness")) {
      return `${normalizedMaster}m`;
    }
    return null;
  }

  private inferPipSize(symbol: string): number {
    if (symbol.includes("JPY")) return 0.01;
    if (symbol.startsWith("XAU") || symbol.startsWith("XAG")) return 0.1;
    return 0.0001;
  }

  private inferContractSize(symbol: string): number {
    if (symbol.startsWith("XAU")) return 100;
    if (symbol.startsWith("XAG")) return 5_000;
    if (symbol.startsWith("BTC")) return 1;
    return 100_000;
  }

  private rowToConfig(row: SymbolMappingRow): SymbolConfig {
    return {
      clientSymbol: row.clientSymbol,
      pipSize: row.pipSize ?? 0.0001,
      pipValue: row.pipValue ?? 10,
      contractSize: row.contractSize ?? 100_000,
      lotStep: row.lotStep ?? 0.01,
      minLot: row.minLot ?? 0.01,
      maxLot: row.maxLot ?? 200,
      spreadPoints: row.spreadPoints ?? 15,
    };
  }
}

export const symbolMapper = SymbolMapper.getInstance();
