import { prisma } from './prisma';
import { metaApiService, type MetaApiTrade } from './metaapi';
import { encrypt, decrypt } from './encryption';

const MASTER_ACCOUNT_ID = process.env.METAAPI_MASTER_ACCOUNT_ID;

export class CopyEngine {
  private static instance: CopyEngine;
  private isRunning = false;
  private lastMasterSync: Date | null = null;

  static getInstance(): CopyEngine {
    if (!CopyEngine.instance) {
      CopyEngine.instance = new CopyEngine();
    }
    return CopyEngine.instance;
  }

  async startMasterListener() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log('[CopyEngine] Master listener started');

    // Poll master account for new trades every 5 seconds
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

    // Get all active, non-paused clients
    const clients = await prisma.copyTradingClient.findMany({
      where: { isActive: true, isPaused: false },
    });

    for (const client of clients) {
      try {
        await this.mirrorTradesForClient(client, openTrades, masterInfo.equity);
      } catch (error) {
        console.error(`[CopyEngine] Failed for client ${client.clientRef}:`, error);
        await this.createAlert(client.id, 'execution_failure', 'critical', 
          `Trade mirroring failed: ${(error as Error).message}`);
      }
    }

    this.lastMasterSync = new Date();
  }

  private async mirrorTradesForClient(
    client: { id: string; metaApiAccountId: string | null; copyMode: string; lotRatio: number; maxDrawdownPercent: number; symbolWhitelist: string[] },
    masterTrades: MetaApiTrade[],
    masterEquity: number
  ) {
    if (!client.metaApiAccountId) return;

    // Check drawdown limit
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

    // Get existing open trades for this client
    const existingTrades = await prisma.tradeEvent.findMany({
      where: { clientId: client.id, status: 'open' },
    });

    const existingMasterIds = new Set(existingTrades.map((t) => t.masterTradeId));

    // Mirror new trades
    for (const masterTrade of masterTrades) {
      if (existingMasterIds.has(masterTrade.id)) continue;

      // Check symbol whitelist
      if (!metaApiService.isSymbolWhitelisted(masterTrade.symbol, client.symbolWhitelist)) {
        continue;
      }

      const volume = metaApiService.calculateVolume(
        masterTrade.volume,
        masterEquity,
        clientInfo?.equity || 0,
        client.copyMode as 'fixed_ratio' | 'equity_proportional' | 'fixed_lot',
        client.lotRatio
      );

      const startTime = Date.now();
      const result = await metaApiService.copyTrade(client.metaApiAccountId, {
        symbol: masterTrade.type === 'POSITION_TYPE_BUY' ? 'buy' : 'sell',
        action: masterTrade.type === 'POSITION_TYPE_BUY' ? 'ORDER_TYPE_BUY' : 'ORDER_TYPE_SELL',
        volume,
        stopLoss: masterTrade.sl || undefined,
        takeProfit: masterTrade.tp || undefined,
        comment: 'PT Copy',
      });
      const latency = Date.now() - startTime;

      await prisma.tradeEvent.create({
        data: {
          clientId: client.id,
          masterTradeId: masterTrade.id,
          symbol: masterTrade.symbol,
          type: masterTrade.type === 'POSITION_TYPE_BUY' ? 'buy' : 'sell',
          volume,
          openPrice: masterTrade.openPrice,
          sl: masterTrade.sl,
          tp: masterTrade.tp,
          status: result.success ? 'open' : 'error',
          executionLatencyMs: latency,
          error: result.error || null,
          metaApiTradeId: result.tradeId || null,
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

    // Detect SL/TP modifications on existing trades
    for (const existingTrade of existingTrades) {
      const masterTrade = masterTrades.find((t) => t.id === existingTrade.masterTradeId);
      if (!masterTrade) continue;

      const slChanged = masterTrade.sl !== existingTrade.sl;
      const tpChanged = masterTrade.tp !== existingTrade.tp;

      if ((slChanged || tpChanged) && existingTrade.metaApiTradeId && client.metaApiAccountId) {
        await metaApiService.modifyTrade(client.metaApiAccountId, existingTrade.metaApiTradeId, {
          stopLoss: masterTrade.sl || undefined,
          takeProfit: masterTrade.tp || undefined,
        });

        await prisma.tradeEvent.update({
          where: { id: existingTrade.id },
          data: {
            sl: masterTrade.sl,
            tp: masterTrade.tp,
          },
        });
      }
    }

    // Check for closed master trades and close corresponding client trades
    const openClientTradeIds = existingTrades.map((t) => t.masterTradeId);
    const closedMasterIds = openClientTradeIds.filter(
      (id) => !masterTrades.some((t) => t.id === id)
    );

    for (const closedId of closedMasterIds) {
      const trade = existingTrades.find((t) => t.masterTradeId === closedId);
      if (trade?.metaApiTradeId && client.metaApiAccountId) {
        await metaApiService.closeTrade(client.metaApiAccountId, trade.metaApiTradeId);
        await prisma.tradeEvent.update({
          where: { id: trade.id },
          data: { status: 'closed' },
        });
      }
    }
  }

  private async pauseClient(clientId: string, reason: string) {
    await prisma.copyTradingClient.update({
      where: { id: clientId },
      data: { isPaused: true },
    });
    await this.createAlert(clientId, 'drawdown_breach', 'critical', reason);
    console.log(`[CopyEngine] Client ${clientId} paused: ${reason}`);
  }

  private async createAlert(clientId: string, type: string, severity: string, message: string) {
    await prisma.copyTradeAlert.create({
      data: { clientId, type, severity, message },
    });
  }

  async addClient(payload: {
    clientRef: string;
    mt5AccountNumber: string;
    brokerServer: string;
    mt5InvestorPassword: string;
    startingEquity: number;
    fullName: string;
  }) {
    // Encrypt the password
    const { encrypted, iv } = encrypt(payload.mt5InvestorPassword);

    // Create client in copy trading system
    const client = await prisma.copyTradingClient.create({
      data: {
        clientRef: payload.clientRef,
        mt5AccountNumber: payload.mt5AccountNumber,
        brokerServer: payload.brokerServer,
        mt5InvestorPasswordEnc: encrypted,
        mt5InvestorPasswordIv: iv,
        equityAtStart: payload.startingEquity,
        currentEquity: payload.startingEquity,
        isActive: true,
        connectionHealth: 'disconnected',
      },
    });

    // In production: register with MetaApi and establish connection
    // const metaApiAccount = await metaApiService.registerAccount({...});
    // await prisma.copyTradingClient.update({
    //   where: { id: client.id },
    //   data: { metaApiAccountId: metaApiAccount.id, connectionHealth: 'healthy' },
    // });

    return client;
  }
}

export const copyEngine = CopyEngine.getInstance();
