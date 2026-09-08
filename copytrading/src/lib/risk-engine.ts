import { prisma } from './prisma';

// ── Types ──────────────────────────────────────────────────────────────────

export interface RiskDecisionResult {
  decision: 'approved' | 'rejected';
  rule: string;
  threshold: string;
  currentValue: string;
  message: string;
}

interface MasterTradeInfo {
  id: string;
  symbol: string;
  volume: number;
  type: string;
  openPrice: number;
  sl?: number | null;
  tp?: number | null;
  leverage?: number | null;
}

interface ClientSnapshot {
  id: string;
  clientRef: string;
  status: string;
  maxDrawdownPercent: number;
  maxDailyLossPercent: number;
  maxAccountLossPercent: number;
  maxExposurePercent: number;
  maxOpenPositions: number;
  maxSymbolExposurePercent: number;
  maxLeverage: number;
  maxSlippagePoints: number;
  minEquity: number;
  equityAtStart: number | null;
  currentEquity: number | null;
  currentBalance: number | null;
  currentMargin: number | null;
  freeMargin: number | null;
  totalPnL: number;
  dailyPnL: number;
  drawdownLevel: string;
  currentDrawdownPercent: number;
  peakEquity: number | null;
  connectionHealth: string;
  allowedSymbols: string[];
  minLot: number;
  maxLot: number;
  lotStep: number;
}

interface ExecutionSnapshot {
  id: string;
  symbol: string;
  direction: string;
  requestedVolume: number;
  requestedPrice: number | null;
  masterEntryPrice: number | null;
  signalTime: Date;
}

// ── Integer math helpers (avoids floating-point for financials) ─────────────

function toFixed(value: number, decimals: number): string {
  return value.toFixed(decimals);
}

function mul(a: number, b: number): number {
  return Math.round(a * b * 10000) / 10000;
}

function pctOf(part: number, whole: number): number {
  if (whole === 0) return 0;
  return Math.round((part / whole) * 10000) / 100; // basis points * 100 -> percent with 2dp
}

// ── Risk Engine ────────────────────────────────────────────────────────────

export class RiskEngine {
  private static instance: RiskEngine;

  static getInstance(): RiskEngine {
    if (!RiskEngine.instance) {
      RiskEngine.instance = new RiskEngine();
    }
    return RiskEngine.instance;
  }

  // ── Main evaluation ────────────────────────────────────────────────────

  async evaluate(
    client: ClientSnapshot,
    execution: ExecutionSnapshot,
    masterTrade: MasterTradeInfo
  ): Promise<RiskDecisionResult> {
    const checks: (() => RiskDecisionResult | null)[] = [
      () => this.checkClientPaused(client),
      () => this.checkClientDisabled(client),
      () => this.checkConnectionHealth(client),
      () => this.checkDrawdown(client),
      () => this.checkDailyLoss(client),
      () => this.checkAccountLoss(client),
      () => this.checkMinEquity(client),
      () => this.checkSymbolAllowed(client, execution),
      () => this.checkMaxLot(client, execution),
      () => this.checkLeverage(client, execution, masterTrade),
      () => this.checkSlippage(client, execution),
      () => this.checkMarginRequirement(client, execution),
    ];

    let result: RiskDecisionResult = {
      decision: 'approved',
      rule: 'all_passed',
      threshold: 'N/A',
      currentValue: 'N/A',
      message: 'All risk checks passed',
    };

    for (const check of checks) {
      const r = check();
      if (r && r.decision === 'rejected') {
        result = r;
        break;
      }
    }

    await this.logDecision(client, execution, masterTrade, result);
    return result;
  }

  // ── Individual risk rules ──────────────────────────────────────────────

  private checkClientPaused(client: ClientSnapshot): RiskDecisionResult | null {
    if (client.status === 'paused' || client.status === 'risk_paused') {
      return {
        decision: 'rejected',
        rule: 'client_paused',
        threshold: 'status != paused',
        currentValue: client.status,
        message: `Client ${client.clientRef} is paused (${client.status})`,
      };
    }
    return null;
  }

  private checkClientDisabled(client: ClientSnapshot): RiskDecisionResult | null {
    if (client.status === 'disabled' || client.status === 'suspended' || client.status === 'closed') {
      return {
        decision: 'rejected',
        rule: 'client_disabled',
        threshold: 'status in (disabled, suspended, closed)',
        currentValue: client.status,
        message: `Client ${client.clientRef} is not active (status: ${client.status})`,
      };
    }
    return null;
  }

  private checkConnectionHealth(client: ClientSnapshot): RiskDecisionResult | null {
    if (client.connectionHealth === 'disconnected' || client.connectionHealth === 'auth_failed' || client.connectionHealth === 'error') {
      return {
        decision: 'rejected',
        rule: 'connection_health',
        threshold: 'connectionHealth not in (disconnected, auth_failed, error)',
        currentValue: client.connectionHealth,
        message: `Client connection unhealthy (${client.connectionHealth})`,
      };
    }
    return null;
  }

  private checkDrawdown(client: ClientSnapshot): RiskDecisionResult | null {
    if (client.drawdownLevel === 'paused' || client.drawdownLevel === 'emergency') {
      return {
        decision: 'rejected',
        rule: 'drawdown_level',
        threshold: `drawdownLevel not in (paused, emergency)`,
        currentValue: client.drawdownLevel,
        message: `Client drawdown level is ${client.drawdownLevel} — trading halted`,
      };
    }

    if (client.drawdownLevel === 'high_risk') {
      return {
        decision: 'rejected',
        rule: 'drawdown_high_risk',
        threshold: `drawdownLevel != high_risk`,
        currentValue: `high_risk (${toFixed(client.currentDrawdownPercent, 2)}%)`,
        message: `Client drawdown at high-risk level (${toFixed(client.currentDrawdownPercent, 2)}%)`,
      };
    }

    if (client.equityAtStart && client.currentEquity) {
      const drawdownPct = pctOf(client.equityAtStart - client.currentEquity, client.equityAtStart);
      if (drawdownPct >= client.maxDrawdownPercent) {
        return {
          decision: 'rejected',
          rule: 'max_drawdown',
          threshold: `${toFixed(client.maxDrawdownPercent, 2)}%`,
          currentValue: `${toFixed(drawdownPct, 2)}%`,
          message: `Drawdown ${toFixed(drawdownPct, 2)}% exceeds max ${toFixed(client.maxDrawdownPercent, 2)}%`,
        };
      }
    }

    return null;
  }

  private checkDailyLoss(client: ClientSnapshot): RiskDecisionResult | null {
    if (client.currentEquity === null) return null;

    const dailyLossPct = pctOf(Math.abs(Math.min(client.dailyPnL, 0)), client.currentEquity);
    if (dailyLossPct >= client.maxDailyLossPercent) {
      return {
        decision: 'rejected',
        rule: 'max_daily_loss',
        threshold: `${toFixed(client.maxDailyLossPercent, 2)}%`,
        currentValue: `${toFixed(dailyLossPct, 2)}%`,
        message: `Daily loss ${toFixed(dailyLossPct, 2)}% exceeds max ${toFixed(client.maxDailyLossPercent, 2)}%`,
      };
    }
    return null;
  }

  private checkAccountLoss(client: ClientSnapshot): RiskDecisionResult | null {
    if (!client.equityAtStart || !client.currentEquity) return null;

    const totalLossPct = pctOf(
      Math.abs(Math.min(client.totalPnL, 0)),
      client.equityAtStart
    );
    if (totalLossPct >= client.maxAccountLossPercent) {
      return {
        decision: 'rejected',
        rule: 'max_account_loss',
        threshold: `${toFixed(client.maxAccountLossPercent, 2)}%`,
        currentValue: `${toFixed(totalLossPct, 2)}%`,
        message: `Account loss ${toFixed(totalLossPct, 2)}% exceeds max ${toFixed(client.maxAccountLossPercent, 2)}%`,
      };
    }
    return null;
  }

  private checkMinEquity(client: ClientSnapshot): RiskDecisionResult | null {
    if (client.currentEquity === null) return null;

    if (client.currentEquity < client.minEquity) {
      return {
        decision: 'rejected',
        rule: 'min_equity',
        threshold: `${toFixed(client.minEquity, 2)}`,
        currentValue: `${toFixed(client.currentEquity, 2)}`,
        message: `Equity ${toFixed(client.currentEquity, 2)} below minimum ${toFixed(client.minEquity, 2)}`,
      };
    }
    return null;
  }

  private checkSymbolAllowed(
    client: ClientSnapshot,
    execution: ExecutionSnapshot
  ): RiskDecisionResult | null {
    if (client.allowedSymbols && client.allowedSymbols.length > 0) {
      if (!client.allowedSymbols.includes(execution.symbol)) {
        return {
          decision: 'rejected',
          rule: 'symbol_whitelist',
          threshold: `symbol in [${client.allowedSymbols.join(', ')}]`,
          currentValue: execution.symbol,
          message: `Symbol ${execution.symbol} is not in client's allowed list`,
        };
      }
    }
    return null;
  }

  private checkMaxLot(
    client: ClientSnapshot,
    execution: ExecutionSnapshot
  ): RiskDecisionResult | null {
    if (execution.requestedVolume > client.maxLot) {
      return {
        decision: 'rejected',
        rule: 'max_lot',
        threshold: `${toFixed(client.maxLot, 2)} lots`,
        currentValue: `${toFixed(execution.requestedVolume, 2)} lots`,
        message: `Requested volume ${toFixed(execution.requestedVolume, 2)} exceeds max lot ${toFixed(client.maxLot, 2)}`,
      };
    }

    if (execution.requestedVolume < client.minLot) {
      return {
        decision: 'rejected',
        rule: 'min_lot',
        threshold: `${toFixed(client.minLot, 2)} lots`,
        currentValue: `${toFixed(execution.requestedVolume, 2)} lots`,
        message: `Requested volume ${toFixed(execution.requestedVolume, 2)} below min lot ${toFixed(client.minLot, 2)}`,
      };
    }

    return null;
  }

  private checkLeverage(
    client: ClientSnapshot,
    execution: ExecutionSnapshot,
    masterTrade: MasterTradeInfo
  ): RiskDecisionResult | null {
    if (masterTrade.leverage && client.maxLeverage > 0) {
      if (masterTrade.leverage > client.maxLeverage) {
        return {
          decision: 'rejected',
          rule: 'max_leverage',
          threshold: `${toFixed(client.maxLeverage, 0)}:1`,
          currentValue: `${toFixed(masterTrade.leverage, 0)}:1`,
          message: `Master leverage ${toFixed(masterTrade.leverage, 0)}:1 exceeds client max ${toFixed(client.maxLeverage, 0)}:1`,
        };
      }
    }
    return null;
  }

  private checkSlippage(
    client: ClientSnapshot,
    execution: ExecutionSnapshot
  ): RiskDecisionResult | null {
    if (
      execution.requestedPrice &&
      execution.masterEntryPrice &&
      client.maxSlippagePoints > 0
    ) {
      const slippagePoints = Math.abs(execution.requestedPrice - execution.masterEntryPrice);
      if (slippagePoints > client.maxSlippagePoints) {
        return {
          decision: 'rejected',
          rule: 'max_slippage',
          threshold: `${toFixed(client.maxSlippagePoints, 1)} points`,
          currentValue: `${toFixed(slippagePoints, 1)} points`,
          message: `Slippage ${toFixed(slippagePoints, 1)} points exceeds max ${toFixed(client.maxSlippagePoints, 1)} points`,
        };
      }
    }
    return null;
  }

  private checkMarginRequirement(
    client: ClientSnapshot,
    execution: ExecutionSnapshot
  ): RiskDecisionResult | null {
    if (client.currentEquity !== null && client.currentMargin !== null && client.freeMargin !== null) {
      // Simple margin check: client must have enough free margin for the new trade
      // Rough estimate: volume * 100000 * (1 / maxLeverage) per standard lot
      const contractSize = 100000;
      const requiredMargin = mul(
        execution.requestedVolume,
        contractSize / (client.maxLeverage || 100)
      );

      if (client.freeMargin < requiredMargin) {
        return {
          decision: 'rejected',
          rule: 'margin_requirement',
          threshold: `free margin >= ${toFixed(requiredMargin, 2)}`,
          currentValue: `${toFixed(client.freeMargin, 2)}`,
          message: `Insufficient free margin: ${toFixed(client.freeMargin, 2)} < ${toFixed(requiredMargin, 2)} required`,
        };
      }
    }
    return null;
  }

  // ── Async checks that need DB queries ──────────────────────────────────

  async evaluateWithCounts(
    client: ClientSnapshot,
    execution: ExecutionSnapshot,
    masterTrade: MasterTradeInfo
  ): Promise<RiskDecisionResult> {
    // Run synchronous checks first
    const syncResult = await this.evaluate(client, execution, masterTrade);
    if (syncResult.decision === 'rejected') {
      return syncResult;
    }

    // Async: open position count
    const openPositionCount = await prisma.clientPosition.count({
      where: { clientId: client.id, status: 'open' },
    });
    if (openPositionCount >= client.maxOpenPositions) {
      const result: RiskDecisionResult = {
        decision: 'rejected',
        rule: 'max_open_positions',
        threshold: `${client.maxOpenPositions}`,
        currentValue: `${openPositionCount}`,
        message: `Open positions ${openPositionCount} >= max ${client.maxOpenPositions}`,
      };
      await this.logDecision(client, execution, masterTrade, result);
      return result;
    }

    // Async: symbol exposure
    const symbolPositions = await prisma.clientPosition.findMany({
      where: { clientId: client.id, status: 'open', symbol: execution.symbol },
    });
    const symbolExposureVolume = symbolPositions.reduce((sum, p) => sum + p.volume, 0);
    const totalOpenVolume = await prisma.clientPosition.aggregate({
      where: { clientId: client.id, status: 'open' },
      _sum: { volume: true },
    });
    const totalVolume = totalOpenVolume._sum.volume || 0;

    if (totalVolume > 0) {
      const symbolExposurePct = pctOf(
        symbolExposureVolume + execution.requestedVolume,
        totalVolume + execution.requestedVolume
      );
      if (symbolExposurePct >= client.maxSymbolExposurePercent) {
        const result: RiskDecisionResult = {
          decision: 'rejected',
          rule: 'max_symbol_exposure',
          threshold: `${toFixed(client.maxSymbolExposurePercent, 2)}%`,
          currentValue: `${toFixed(symbolExposurePct, 2)}%`,
          message: `Symbol exposure ${toFixed(symbolExposurePct, 2)}% exceeds max ${toFixed(client.maxSymbolExposurePercent, 2)}%`,
        };
        await this.logDecision(client, execution, masterTrade, result);
        return result;
      }
    }

    // Re-log approved decision with async context
    await this.logDecision(client, execution, masterTrade, {
      decision: 'approved',
      rule: 'all_passed',
      threshold: 'N/A',
      currentValue: 'N/A',
      message: 'All risk checks passed',
    });

    return { decision: 'approved', rule: 'all_passed', threshold: 'N/A', currentValue: 'N/A', message: 'All risk checks passed' };
  }

  // ── Drawdown level management ──────────────────────────────────────────

  async recalculateDrawdownLevel(client: ClientSnapshot): Promise<string> {
    if (!client.equityAtStart || !client.currentEquity) return client.drawdownLevel;

    const drawdownPct = pctOf(client.equityAtStart - client.currentEquity, client.equityAtStart);

    let level: string;
    if (drawdownPct >= 20) {
      level = 'emergency';
    } else if (drawdownPct >= 15) {
      level = 'paused';
    } else if (drawdownPct >= 10) {
      level = 'high_risk';
    } else if (drawdownPct >= 5) {
      level = 'warning';
    } else {
      level = 'normal';
    }

    if (level !== client.drawdownLevel) {
      await prisma.copyTradingClient.update({
        where: { id: client.id },
        data: {
          drawdownLevel: level as any,
          currentDrawdownPercent: drawdownPct,
        },
      });
    }

    return level;
  }

  // ── Database logging ──────────────────────────────────────────────────

  private async logDecision(
    client: ClientSnapshot,
    execution: ExecutionSnapshot,
    masterTrade: MasterTradeInfo,
    result: RiskDecisionResult
  ): Promise<void> {
    try {
      await prisma.riskDecisionLog.create({
        data: {
          clientId: client.id,
          copyExecutionId: execution.id,
          decision: result.decision as any,
          rule: result.rule,
          threshold: result.threshold,
          currentValue: result.currentValue,
          message: result.message,
          masterTradeId: masterTrade.id,
          symbol: execution.symbol,
          volume: execution.requestedVolume,
        },
      });

      // Update execution record with risk result
      await prisma.copyExecution.update({
        where: { id: execution.id },
        data: {
          riskDecision: result.decision as any,
          riskRule: result.rule,
          riskThreshold: result.threshold,
          riskCurrentValue: result.currentValue,
          riskMessage: result.message,
          state: result.decision === 'approved' ? 'queued' : 'risk_blocked',
        },
      });

      // Update client trade counters
      if (result.decision === 'rejected') {
        await prisma.copyTradingClient.update({
          where: { id: client.id },
          data: { tradesRejected: { increment: 1 } },
        });
      }

      console.log(
        `[RiskEngine] ${result.decision.toUpperCase()} | ` +
        `client=${client.clientRef} | rule=${result.rule} | ` +
        `symbol=${execution.symbol} | vol=${execution.requestedVolume}`
      );
    } catch (error) {
      console.error('[RiskEngine] Failed to log decision:', error);
    }
  }
}

export const riskEngine = RiskEngine.getInstance();
