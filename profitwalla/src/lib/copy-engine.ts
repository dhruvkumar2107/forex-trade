import { prisma } from './prisma';
import { metaApiService, type MetaApiTrade } from './metaapi';
import { encrypt } from './encryption';

const MASTER_ACCOUNT_ID = process.env.METAAPI_MASTER_ACCOUNT_ID;

interface CopyClient {
  id: string;
  clientRef: string;
  metaApiAccountId: string | null;
  copyMode: string;
  lotRatio: number;
  maxDrawdownPercent: number;
  symbolWhitelist: string[];
  equityAtStart: number | null;
}

export class CopyEngine {
  private static instance: CopyEngine;
  private isRunning = false;

  static getInstance(): CopyEngine {
    if (!CopyEngine.instance) {
      CopyEngine.instance = new CopyEngine();
    }
    return CopyEngine.instance;
  }

  async startMasterListener() {
    if (this.isRunning) return;
    this.isRunning = true;

    setInterval(async () => {
      try {
        await this.syncMasterTrades();
      } catch (error) {
        console.error('[CopyEngine] Sync error:', error);
      }
    }, 5000);
  }

  private async syncMasterTrades() {
    if (!MASTER_ACCOUNT_ID) return;

    const openTrades = await metaApiService.getOpenTrades(MASTER_ACCOUNT_ID);
    const masterInfo = await metaApiService.getAccountInfo(MASTER_ACCOUNT_ID);
    if (!masterInfo) return;

    const clients = await prisma.copyTradingClient.findMany({
      where: { isActive: true, isPaused: false },
    });

    for (const client of clients) {
      try {
        await this.mirrorTradesForClient(client, openTrades, masterInfo.equity);
      } catch (error) {
        await this.createAlert(client.id, 'execution_failure', 'critical',
          `Trade mirroring failed: ${(error as Error).message}`);
      }
    }
  }

  private async mirrorTradesForClient(
    client: CopyClient,
    masterTrades: MetaApiTrade[],
    masterEquity: number
  ) {
    if (!client.metaApiAccountId) return;

    const clientInfo = await metaApiService.getAccountInfo(client.metaApiAccountId);
    if (clientInfo && client.equityAtStart) {
      const drawdown = ((client.equityAtStart - clientInfo.equity) / client.equityAtStart) * 100;
      if (drawdown >= client.maxDrawdownPercent) {
        await this.pauseClient(client.id, `Drawdown limit breached: ${drawdown.toFixed(1)}%`);
        return;
      }
      await prisma.copyTradingClient.update({
        where: { id: client.id },
        data: { currentEquity: clientInfo.equity },
      });
    }

    const existingTrades = await prisma.tradeEvent.findMany({
      where: { clientId: client.id, status: 'open' },
    });

    const existingMasterIds = new Set(existingTrades.map((t: { masterTradeId: string }) => t.masterTradeId));

    for (const masterTrade of masterTrades) {
      if (existingMasterIds.has(masterTrade.id)) continue;
      if (!metaApiService.isSymbolWhitelisted(masterTrade.symbol, client.symbolWhitelist)) continue;

      const volume = metaApiService.calculateVolume(
        masterTrade.volume, masterEquity, clientInfo?.equity || 0,
        client.copyMode as 'fixed_ratio' | 'equity_proportional' | 'fixed_lot',
        client.lotRatio
      );

      const startTime = Date.now();
      const result = await metaApiService.copyTrade(client.metaApiAccountId, {
        symbol: masterTrade.type === 'POSITION_TYPE_BUY' ? 'buy' : 'sell',
        action: masterTrade.type === 'POSITION_TYPE_BUY' ? 'ORDER_TYPE_BUY' : 'ORDER_TYPE_SELL',
        volume, stopLoss: masterTrade.sl || undefined, takeProfit: masterTrade.tp || undefined,
        comment: 'PT Copy',
      });
      const latency = Date.now() - startTime;

      await prisma.tradeEvent.create({
        data: {
          clientId: client.id, masterTradeId: masterTrade.id, symbol: masterTrade.symbol,
          type: masterTrade.type === 'POSITION_TYPE_BUY' ? 'buy' : 'sell',
          volume, openPrice: masterTrade.openPrice, sl: masterTrade.sl, tp: masterTrade.tp,
          status: result.success ? 'open' : 'error', executionLatencyMs: latency,
          error: result.error || null, metaApiTradeId: result.tradeId || null,
        },
      });

      if (!result.success) {
        await this.createAlert(client.id, 'execution_failure', 'warning',
          `Failed to copy ${masterTrade.symbol} trade: ${result.error}`);
      }

      await prisma.copyTradingClient.update({
        where: { id: client.id },
        data: { tradesCopied: { increment: 1 }, lastTradeSyncAt: new Date() },
      });
    }

    for (const existingTrade of existingTrades) {
      const masterTrade = masterTrades.find((t: MetaApiTrade) => t.id === existingTrade.masterTradeId);
      if (!masterTrade) continue;
      const slChanged = masterTrade.sl !== existingTrade.sl;
      const tpChanged = masterTrade.tp !== existingTrade.tp;
      if ((slChanged || tpChanged) && existingTrade.metaApiTradeId && client.metaApiAccountId) {
        await metaApiService.modifyTrade(client.metaApiAccountId, existingTrade.metaApiTradeId, {
          stopLoss: masterTrade.sl || undefined, takeProfit: masterTrade.tp || undefined,
        });
        await prisma.tradeEvent.update({
          where: { id: existingTrade.id },
          data: { sl: masterTrade.sl, tp: masterTrade.tp },
        });
      }
    }

    const openMasterIds = existingTrades.map((t: { masterTradeId: string }) => t.masterTradeId);
    const closedMasterIds = openMasterIds.filter((id: string) => !masterTrades.some((t: MetaApiTrade) => t.id === id));
    for (const closedId of closedMasterIds) {
      const trade = existingTrades.find((t: { masterTradeId: string }) => t.masterTradeId === closedId);
      if (trade?.metaApiTradeId && client.metaApiAccountId) {
        await metaApiService.closeTrade(client.metaApiAccountId, trade.metaApiTradeId);
        await prisma.tradeEvent.update({ where: { id: trade.id }, data: { status: 'closed' } });
      }
    }
  }

  private async pauseClient(clientId: string, reason: string) {
    await prisma.copyTradingClient.update({ where: { id: clientId }, data: { isPaused: true } });
    await this.createAlert(clientId, 'drawdown_breach', 'critical', reason);
  }

  private async createAlert(clientId: string, type: string, severity: string, message: string) {
    await prisma.copyTradeAlert.create({ data: { clientId, type, severity, message } });
  }

  async addClient(payload: {
    clientRef: string; mt5AccountNumber: string; brokerServer: string;
    mt5InvestorPassword: string; startingEquity: number; fullName: string;
  }) {
    const { encrypted, iv } = encrypt(payload.mt5InvestorPassword);
    return prisma.copyTradingClient.create({
      data: {
        clientRef: payload.clientRef, mt5AccountNumber: payload.mt5AccountNumber,
        brokerServer: payload.brokerServer, mt5InvestorPasswordEnc: encrypted,
        mt5InvestorPasswordIv: iv, equityAtStart: payload.startingEquity,
        currentEquity: payload.startingEquity, isActive: true, connectionHealth: 'disconnected',
      },
    });
  }
}

export const copyEngine = CopyEngine.getInstance();
