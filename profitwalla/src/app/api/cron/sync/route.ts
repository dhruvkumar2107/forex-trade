import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { metaApiService } from '@/lib/metaapi';
import { apiSuccess, apiInternalError } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return apiError('Unauthorized', 401);
    }

    const MASTER_ACCOUNT_ID = process.env.METAAPI_MASTER_ACCOUNT_ID;
    if (!MASTER_ACCOUNT_ID) {
      return apiSuccess({ synced: 0, message: 'No master account configured' });
    }

    const masterTrades = await metaApiService.getOpenTrades(MASTER_ACCOUNT_ID);
    const masterInfo = await metaApiService.getAccountInfo(MASTER_ACCOUNT_ID);
    if (!masterInfo) {
      return apiSuccess({ synced: 0, message: 'Master account unreachable' });
    }

    const clients = await prisma.copyTradingClient.findMany({
      where: { isActive: true, isPaused: false, metaApiAccountId: { not: null } },
    });

    let syncedCount = 0;
    const errors: string[] = [];

    for (const client of clients) {
      try {
        await syncClient(client, masterTrades, masterInfo.equity);
        syncedCount++;
      } catch (error) {
        const msg = `Client ${client.clientRef}: ${(error as Error).message}`;
        errors.push(msg);
        await prisma.copyTradeAlert.create({
          data: {
            clientId: client.id,
            type: 'execution_failure',
            severity: 'critical',
            message: msg,
          },
        });
      }
    }

    return apiSuccess({ synced: syncedCount, errors, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('[Cron Sync Error]', error);
    return apiInternalError();
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function apiError(message: string, status = 400) {
  return Response.json({ success: false, error: message }, { status });
}

async function syncClient(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any,
  masterTrades: Array<{
    id: string;
    type: string;
    symbol: string;
    volume: number;
    openPrice: number;
    sl: number | null;
    tp: number | null;
    currentPrice: number;
    profit: number;
    openTime: string;
  }>,
  masterEquity: number
) {
  if (!client.metaApiAccountId) return;

  const clientInfo = await metaApiService.getAccountInfo(client.metaApiAccountId);
  if (clientInfo && client.equityAtStart) {
    const drawdown = ((client.equityAtStart - clientInfo.equity) / client.equityAtStart) * 100;
    if (drawdown >= client.maxDrawdownPercent) {
      await prisma.copyTradingClient.update({
        where: { id: client.id },
        data: { isPaused: true },
      });
      await prisma.copyTradeAlert.create({
        data: {
          clientId: client.id,
          type: 'drawdown_breach',
          severity: 'critical',
          message: `Drawdown limit breached: ${drawdown.toFixed(1)}%`,
        },
      });
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
  const existingMasterIds = new Set(existingTrades.map((t) => t.masterTradeId));

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
      await prisma.copyTradeAlert.create({
        data: {
          clientId: client.id,
          type: 'execution_failure',
          severity: 'warning',
          message: `Failed to copy ${masterTrade.symbol}: ${result.error}`,
        },
      });
    }

    await prisma.copyTradingClient.update({
      where: { id: client.id },
      data: { tradesCopied: { increment: 1 }, lastTradeSyncAt: new Date() },
    });
  }

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
        data: { sl: masterTrade.sl, tp: masterTrade.tp },
      });
    }
  }

  const openMasterIds = existingTrades.map((t) => t.masterTradeId);
  const closedMasterIds = openMasterIds.filter((id) => !masterTrades.some((t) => t.id === id));
  for (const closedId of closedMasterIds) {
    const trade = existingTrades.find((t) => t.masterTradeId === closedId);
    if (trade?.metaApiTradeId && client.metaApiAccountId) {
      await metaApiService.closeTrade(client.metaApiAccountId, trade.metaApiTradeId);
      await prisma.tradeEvent.update({ where: { id: trade.id }, data: { status: 'closed' } });
    }
  }
}
