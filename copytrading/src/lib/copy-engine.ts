import { prisma } from './prisma';
import { metaApiService, type MetaApiPosition } from './metaapi';
import { riskEngine } from './risk-engine';
import { symbolMapper } from './symbol-mapper';
import { idempotency } from './idempotency';
import { killSwitch } from './kill-switch';
import { auditLog } from './audit';
import { encrypt } from './encryption';
import {
  TradeState,
  MasterPositionState,
  ConnectionHealth,
  CopyMode,
  AlertSeverity,
  type CopyTradingClient,
  type MasterPosition,
  type CopyExecution,
} from '@prisma/client';

// ── Configuration ───────────────────────────────────────────────────────────

const MASTER_ACCOUNT_ID = process.env.METAAPI_MASTER_ACCOUNT_ID;
const POLL_INTERVAL_MS = parseInt(process.env.COPY_POLL_INTERVAL_MS || '5000', 10);
const STALE_EXECUTION_TIMEOUT_MS = 5 * 60 * 1000;
const MAX_RETRIES = 3;
const RETRY_DELAYS_MS = [5000, 15000, 45000];

// ── Integer math helpers ────────────────────────────────────────────────────

function mul(a: number, b: number): number {
  return Math.round(a * b * 10000) / 10000;
}

function roundLots(lots: number, step: number): number {
  if (step <= 0) return Math.round(lots * 100) / 100;
  return Math.round(lots / step) * step;
}

// ── Structured logger ───────────────────────────────────────────────────────

function log(
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG',
  component: string,
  message: string,
  ctx?: Record<string, unknown>,
) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    component,
    message,
    ...ctx,
  };
  if (level === 'ERROR') {
    console.error(JSON.stringify(entry));
  } else if (level === 'WARN') {
    console.warn(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}

// ── Change detection types ──────────────────────────────────────────────────

interface PositionSnapshot {
  metaApiPositionId: string;
  symbol: string;
  direction: string;
  volume: number;
  openPrice: number;
  sl: number | null;
  tp: number | null;
  profit: number | null;
  openTime: Date | null;
}

type PositionChangeKind = 'new' | 'modified' | 'closed';

interface PositionChange {
  kind: PositionChangeKind;
  masterPosition: PositionSnapshot;
  existingDbRecord?: MasterPosition;
  closedPositions: MasterPosition[];
}

// ── Engine status ───────────────────────────────────────────────────────────

export interface EngineStatus {
  isRunning: boolean;
  pollIntervalMs: number;
  masterAccountId: string | null;
  lastPollAt: string | null;
  lastPollDurationMs: number | null;
  totalPolls: number;
  totalPositionChanges: number;
  totalClientExecutions: number;
  totalErrors: number;
  activeClients: number;
  currentCycleId: string | null;
}

// ── CopyEngine ──────────────────────────────────────────────────────────────

export class CopyEngine {
  private static instance: CopyEngine;

  private isRunning = false;
  private pollTimer: ReturnType<typeof setTimeout> | null = null;
  private abortController: AbortController | null = null;

  private lastPollAt: Date | null = null;
  private lastPollDurationMs: number | null = null;
  private totalPolls = 0;
  private totalPositionChanges = 0;
  private totalClientExecutions = 0;
  private totalErrors = 0;
  private currentCycleId: string | null = null;

  private constructor() {}

  static getInstance(): CopyEngine {
    if (!CopyEngine.instance) {
      CopyEngine.instance = new CopyEngine();
    }
    return CopyEngine.instance;
  }

  // ── Lifecycle ───────────────────────────────────────────────────────────

  async start(): Promise<void> {
    if (this.isRunning) {
      log('WARN', 'CopyEngine', 'Engine already running');
      return;
    }

    if (!MASTER_ACCOUNT_ID) {
      log('ERROR', 'CopyEngine', 'METAAPI_MASTER_ACCOUNT_ID not set — engine cannot start');
      return;
    }

    this.isRunning = true;
    this.abortController = new AbortController();

    await auditLog.log({
      entityType: 'system',
      action: 'engine_started',
      performedBy: 'system',
      details: JSON.stringify({ masterAccountId: MASTER_ACCOUNT_ID, pollIntervalMs: POLL_INTERVAL_MS }),
    });

    log('INFO', 'CopyEngine', 'Engine started', {
      masterAccountId: MASTER_ACCOUNT_ID,
      pollIntervalMs: POLL_INTERVAL_MS,
    });

    this.scheduleNextPoll();
  }

  stop(): void {
    if (!this.isRunning) {
      log('WARN', 'CopyEngine', 'Engine not running');
      return;
    }

    this.isRunning = false;

    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }

    log('INFO', 'CopyEngine', 'Engine stopped');
  }

  async getStatus(): Promise<EngineStatus> {
    let activeClients = 0;
    try {
      activeClients = (await this.getActiveClients()).length;
    } catch (error) {
      log('WARN', 'CopyEngine', 'Failed to compute active clients for status', {
        error: (error as Error).message,
      });
    }

    return {
      isRunning: this.isRunning,
      pollIntervalMs: POLL_INTERVAL_MS,
      masterAccountId: MASTER_ACCOUNT_ID ?? null,
      lastPollAt: this.lastPollAt?.toISOString() ?? null,
      lastPollDurationMs: this.lastPollDurationMs,
      totalPolls: this.totalPolls,
      totalPositionChanges: this.totalPositionChanges,
      totalClientExecutions: this.totalClientExecutions,
      totalErrors: this.totalErrors,
      activeClients,
      currentCycleId: this.currentCycleId,
    };
  }

  // ── Polling loop ────────────────────────────────────────────────────────

  private scheduleNextPoll(): void {
    if (!this.isRunning) return;

    this.pollTimer = setTimeout(async () => {
      if (!this.isRunning) return;

      const cycleId = `cycle_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      this.currentCycleId = cycleId;

      const cycleStart = Date.now();

      try {
        await this.processMasterPositionsInternal(cycleId);
      } catch (error) {
        this.totalErrors++;
        log('ERROR', 'CopyEngine', 'Unhandled cycle error', {
          cycleId,
          error: (error as Error).message,
        });
      } finally {
        this.lastPollDurationMs = Date.now() - cycleStart;
        this.currentCycleId = null;
        this.scheduleNextPoll();
      }
    }, POLL_INTERVAL_MS);
  }

  // ── Public: manual trigger for testing ──────────────────────────────────

  async processMasterPositions(): Promise<void> {
    const cycleId = `manual_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await this.processMasterPositionsInternal(cycleId);
  }

  // ── Core: detect changes and dispatch to clients ────────────────────────

  private async processMasterPositionsInternal(cycleId: string): Promise<void> {
    const pollStart = Date.now();
    this.totalPolls++;

    if (!MASTER_ACCOUNT_ID) return;

    // 1. Fetch current master positions
    const masterPositions = await metaApiService.getOpenPositions(MASTER_ACCOUNT_ID);
    if (!masterPositions) {
      log('WARN', 'CopyEngine', 'Failed to fetch master positions', { cycleId });
      return;
    }

    const masterInfo = await metaApiService.getAccountInfo(MASTER_ACCOUNT_ID);
    if (!masterInfo) {
      log('WARN', 'CopyEngine', 'Failed to fetch master account info', { cycleId });
      return;
    }

    this.lastPollAt = new Date();

    // 2. Upsert master positions in DB and detect changes
    const changes = await this.detectChanges(cycleId, masterPositions, masterInfo.equity);

    if (changes.length === 0) {
      log('DEBUG', 'CopyEngine', 'No position changes detected', {
        cycleId,
        durationMs: Date.now() - pollStart,
      });
      return;
    }

    this.totalPositionChanges += changes.length;

    log('INFO', 'CopyEngine', `Detected ${changes.length} position changes`, {
      cycleId,
      changes: changes.map((c) => ({
        kind: c.kind,
        symbol: c.masterPosition.symbol,
        volume: c.masterPosition.volume,
      })),
    });

    // 3. Fetch all active clients
    const clients = await this.getActiveClients();

    if (clients.length === 0) {
      log('INFO', 'CopyEngine', 'No active clients to process', { cycleId });
      return;
    }

    // 4. Process each change against each client — independently
    for (const change of changes) {
      for (const client of clients) {
        try {
          await this.processClientForChange(cycleId, change, client, masterInfo.equity);
        } catch (error) {
          this.totalErrors++;
          log('ERROR', 'CopyEngine', 'Client processing failed (non-blocking)', {
            cycleId,
            clientId: client.clientRef,
            changeKind: change.kind,
            symbol: change.masterPosition.symbol,
            error: (error as Error).message,
          });
        }
      }
    }
  }

  // ── Detect new / modified / closed positions ────────────────────────────

  private async detectChanges(
    cycleId: string,
    livePositions: MetaApiPosition[],
    masterEquity: number,
  ): Promise<PositionChange[]> {
    if (!MASTER_ACCOUNT_ID) return [];

    const changes: PositionChange[] = [];

    // Ensure master account exists in DB
    const masterAccount = await this.ensureMasterAccount(MASTER_ACCOUNT_ID);
    if (!masterAccount) return [];

    // Get stored open positions
    const storedPositions = await prisma.masterPosition.findMany({
      where: {
        masterAccountId: masterAccount.id,
        state: { in: [MasterPositionState.open, MasterPositionState.modified] },
      },
    });

    const storedByMetaId = new Map<string, MasterPosition>();
    for (const sp of storedPositions) {
      storedByMetaId.set(sp.metaApiPositionId, sp);
    }

    const liveMetaIds = new Set(livePositions.map((p) => p.id));

    // Detect NEW positions (in live but not in DB)
    for (const live of livePositions) {
      if (!storedByMetaId.has(live.id)) {
        const dbPosition = await prisma.masterPosition.create({
          data: {
            masterAccountId: masterAccount.id,
            metaApiPositionId: live.id,
            symbol: live.symbol,
            direction: live.type === 'POSITION_TYPE_BUY' ? 'BUY' : 'SELL',
            volume: live.volume,
            openPrice: live.openPrice,
            currentPrice: live.currentPrice,
            sl: live.sl,
            tp: live.tp,
            profit: live.profit,
            openTime: new Date(live.openTime),
            state: MasterPositionState.open,
          },
        });

        changes.push({
          kind: 'new',
          masterPosition: this.apiTradeToSnapshot(live),
          existingDbRecord: dbPosition,
          closedPositions: [],
        });
      }
    }

    // Detect MODIFIED positions (SL/TP changed) and update DB
    for (const live of livePositions) {
      const stored = storedByMetaId.get(live.id);
      if (!stored) continue;

      const slChanged = this.numbersDiffer(stored.sl, live.sl);
      const tpChanged = this.numbersDiffer(stored.tp, live.tp);

      if (slChanged || tpChanged) {
        await prisma.masterPosition.update({
          where: { id: stored.id },
          data: {
            sl: live.sl,
            tp: live.tp,
            currentPrice: live.currentPrice,
            profit: live.profit,
            state: MasterPositionState.modified,
            lastDetectedAt: new Date(),
          },
        });

        changes.push({
          kind: 'modified',
          masterPosition: this.apiTradeToSnapshot(live),
          existingDbRecord: stored,
          closedPositions: [],
        });
      }
    }

    // Detect CLOSED positions (in DB but not in live)
    for (const stored of storedPositions) {
      if (!liveMetaIds.has(stored.metaApiPositionId)) {
        await prisma.masterPosition.update({
          where: { id: stored.id },
          data: {
            state: MasterPositionState.closed,
            lastDetectedAt: new Date(),
          },
        });

        changes.push({
          kind: 'closed',
          masterPosition: {
            metaApiPositionId: stored.metaApiPositionId,
            symbol: stored.symbol,
            direction: stored.direction,
            volume: stored.volume,
            openPrice: stored.openPrice,
            sl: stored.sl,
            tp: stored.tp,
            profit: stored.profit,
            openTime: stored.openTime,
          },
          existingDbRecord: stored,
          closedPositions: [],
        });
      }
    }

    return changes;
  }

  // ── Per-client processing for a single position change ──────────────────

  private async processClientForChange(
    cycleId: string,
    change: PositionChange,
    client: CopyTradingClient,
    masterEquity: number,
  ): Promise<void> {
    const { kind, masterPosition } = change;
    const correlationId = `${cycleId}_${client.clientRef}_${masterPosition.metaApiPositionId}`;

    // 1. Kill switch check
    const tradingAllowed = await killSwitch.isTradingAllowed(client.id, masterPosition.symbol);
    if (!tradingAllowed) {
      log('DEBUG', 'CopyEngine', 'Trade blocked by kill switch', {
        correlationId,
        clientId: client.clientRef,
        symbol: masterPosition.symbol,
      });
      return;
    }

    // 2. Client status check
    if (!this.isClientEligible(client)) {
      log('DEBUG', 'CopyEngine', 'Client not eligible for copy', {
        correlationId,
        clientId: client.clientRef,
        status: client.status,
        connectionHealth: client.connectionHealth,
      });
      return;
    }

    // 3. Symbol whitelist check
    if (!this.isSymbolAllowed(masterPosition.symbol, client.allowedSymbols)) {
      log('DEBUG', 'CopyEngine', 'Symbol not in client whitelist', {
        correlationId,
        clientId: client.clientRef,
        symbol: masterPosition.symbol,
        allowedSymbols: client.allowedSymbols,
      });
      return;
    }

    // 4. Fetch client account info for volume calculation
    const clientAccountInfo = client.metaApiAccountId
      ? await metaApiService.getAccountInfo(client.metaApiAccountId)
      : null;

    if (client.metaApiAccountId && !clientAccountInfo) {
      log('WARN', 'CopyEngine', 'Failed to fetch client account info', {
        correlationId,
        clientId: client.clientRef,
      });
      return;
    }

    const clientEquity = clientAccountInfo?.equity ?? client.currentEquity ?? 0;

    // 5. Calculate position size
    const direction = masterPosition.direction === 'BUY' ? 'ORDER_TYPE_BUY' : 'ORDER_TYPE_SELL';
    const volume = this.calculateVolume(
      masterPosition.volume,
      masterEquity,
      clientEquity,
      client.copyMode,
      client.lotRatio,
      client.fixedLotSize,
    );

    if (volume <= 0) {
      log('WARN', 'CopyEngine', 'Calculated volume is zero or negative', {
        correlationId,
        clientId: client.clientRef,
        masterVolume: masterPosition.volume,
      });
      return;
    }

    // 6. Map symbol
    const mappedSymbol = await symbolMapper.mapSymbol(
      masterPosition.symbol,
      client.brokerServer,
    );

    if (!mappedSymbol) {
      log('WARN', 'CopyEngine', 'Symbol mapping failed', {
        correlationId,
        clientId: client.clientRef,
        masterSymbol: masterPosition.symbol,
        brokerServer: client.brokerServer,
      });
      return;
    }

    // 7. Handle by change kind
    switch (kind) {
      case 'new':
        await this.handleNewPosition(cycleId, correlationId, change, client, volume, mappedSymbol, direction, clientEquity);
        break;
      case 'modified':
        await this.handleModifiedPosition(cycleId, correlationId, change, client);
        break;
      case 'closed':
        await this.handleClosedPosition(cycleId, correlationId, change, client);
        break;
    }
  }

  // ── Handle new position: full copy pipeline ─────────────────────────────

  private async handleNewPosition(
    cycleId: string,
    correlationId: string,
    change: PositionChange,
    client: CopyTradingClient,
    volume: number,
    mappedSymbol: string,
    direction: string,
    clientEquity: number,
  ): Promise<void> {
    const { masterPosition, existingDbRecord } = change;

    // Ensure master position is in DB
    const masterAccountId = existingDbRecord?.masterAccountId ?? (await this.ensureMasterAccount(MASTER_ACCOUNT_ID!))?.id;
    if (!masterAccountId || !existingDbRecord) {
      log('ERROR', 'CopyEngine', 'Master position not found in DB', { correlationId });
      return;
    }

    // 1. Acquire idempotency lock
    const lockResult = await idempotency.tryAcquire(client.id, masterPosition.metaApiPositionId, {
      symbol: mappedSymbol,
      direction,
      volume,
      masterEntryPrice: masterPosition.openPrice,
      timestamp: masterPosition.openTime?.toISOString(),
    });

    if (!lockResult.acquired) {
      log('DEBUG', 'CopyEngine', 'Idempotency lock not acquired', {
        correlationId,
        clientId: client.clientRef,
        existingState: lockResult.existingExecution?.state,
      });
      return;
    }

    // 2. Transition to validating
    await idempotency.markProcessing(lockResult.key);

    // 3. Run risk engine
    const execution = lockResult.existingExecution!;
    const riskResult = await riskEngine.evaluateWithCounts(
      {
        id: client.id,
        clientRef: client.clientRef,
        status: client.status,
        maxDrawdownPercent: client.maxDrawdownPercent,
        maxDailyLossPercent: client.maxDailyLossPercent,
        maxAccountLossPercent: client.maxAccountLossPercent,
        maxExposurePercent: client.maxExposurePercent,
        maxOpenPositions: client.maxOpenPositions,
        maxSymbolExposurePercent: client.maxSymbolExposurePercent,
        maxLeverage: client.maxLeverage,
        maxSlippagePoints: client.maxSlippagePoints,
        minEquity: client.minEquity,
        equityAtStart: client.equityAtStart,
        currentEquity: client.currentEquity,
        currentBalance: client.currentBalance,
        currentMargin: client.currentMargin,
        freeMargin: client.freeMargin,
        totalPnL: client.totalPnL,
        dailyPnL: client.dailyPnL,
        drawdownLevel: client.drawdownLevel,
        currentDrawdownPercent: client.currentDrawdownPercent,
        peakEquity: client.peakEquity,
        connectionHealth: client.connectionHealth,
        allowedSymbols: client.allowedSymbols,
        minLot: client.minLot,
        maxLot: client.maxLot,
        lotStep: client.lotStep,
      },
      {
        id: execution.id,
        symbol: mappedSymbol,
        direction,
        requestedVolume: volume,
        requestedPrice: null,
        masterEntryPrice: masterPosition.openPrice,
        signalTime: new Date(),
      },
      {
        id: masterPosition.metaApiPositionId,
        symbol: masterPosition.symbol,
        volume: masterPosition.volume,
        type: masterPosition.direction === 'BUY' ? 'POSITION_TYPE_BUY' : 'POSITION_TYPE_SELL',
        openPrice: masterPosition.openPrice,
        sl: masterPosition.sl,
        tp: masterPosition.tp,
      },
    );

    if (riskResult.decision === 'rejected') {
      await idempotency.markFailed(lockResult.key, `Risk blocked: ${riskResult.rule} — ${riskResult.message}`);
      await this.createAlert(client.id, 'risk_blocked', 'medium',
        `Trade blocked: ${riskResult.message} (symbol: ${mappedSymbol})`);
      log('WARN', 'CopyEngine', 'Risk engine rejected trade', {
        correlationId,
        clientId: client.clientRef,
        rule: riskResult.rule,
        message: riskResult.message,
      });
      return;
    }

    // 4. Execute trade on client broker
    if (!client.metaApiAccountId) {
      await idempotency.markFailed(lockResult.key, 'Client has no MetaApi account ID');
      log('ERROR', 'CopyEngine', 'No MetaApi account for client', { correlationId, clientId: client.clientRef });
      return;
    }

    const execStart = Date.now();

    const result = await this.executeWithRetry(
      correlationId,
      client.metaApiAccountId,
      {
        symbol: mappedSymbol,
        action: direction as 'ORDER_TYPE_BUY' | 'ORDER_TYPE_SELL',
        volume,
        stopLoss: masterPosition.sl ?? undefined,
        takeProfit: masterPosition.tp ?? undefined,
        comment: `PW Copy ${correlationId.slice(0, 12)}`,
      },
      lockResult.key,
    );

    const brokerLatencyMs = Date.now() - execStart;

    if (!result.success) {
      this.totalErrors++;
      await this.createAlert(client.id, 'execution_failure', 'high',
        `Failed to copy ${mappedSymbol}: ${result.error} (retries: ${result.retryCount})`);
      log('ERROR', 'CopyEngine', 'Trade execution failed', {
        correlationId,
        clientId: client.clientRef,
        symbol: mappedSymbol,
        error: result.error,
        retries: result.retryCount,
      });
      return;
    }

    // 5. Store client position mapping
    const clientPosition = await prisma.clientPosition.create({
      data: {
        clientId: client.id,
        masterPositionId: existingDbRecord.id,
        copyExecutionId: execution.id,
        metaApiPositionId: result.tradeId ?? null,
        symbol: mappedSymbol,
        direction: masterPosition.direction,
        volume,
        openPrice: masterPosition.openPrice,
        sl: masterPosition.sl,
        tp: masterPosition.tp,
        status: 'open',
      },
    });

    // 6. Update execution record
    await prisma.copyExecution.update({
      where: { id: execution.id },
      data: {
        masterAccountId,
        masterPositionId: existingDbRecord.id,
        masterSymbol: masterPosition.symbol,
        brokerLatencyMs,
        totalLatencyMs: Date.now() - new Date(execution.signalTime).getTime(),
        actualVolume: volume,
        actualEntryPrice: null,
        actualSl: masterPosition.sl,
        actualTp: masterPosition.tp,
        brokerRequestId: result.tradeId ?? null,
      },
    });

    // 7. Update client counters
    await prisma.copyTradingClient.update({
      where: { id: client.id },
      data: {
        tradesCopied: { increment: 1 },
        lastTradeSyncAt: new Date(),
      },
    });

    // 8. Audit log
    await auditLog.logTradeAction({
      entityType: 'TRADE',
      clientId: client.id,
      tradeId: clientPosition.id,
      action: 'trade_copied',
      performedBy: 'copy_engine',
      symbol: mappedSymbol,
      side: masterPosition.direction.toLowerCase(),
      quantity: volume,
      price: masterPosition.openPrice,
      details: {
        correlationId,
        masterPositionId: existingDbRecord.metaApiPositionId,
        brokerLatencyMs,
        mappedSymbol,
      },
    });

    this.totalClientExecutions++;

    log('INFO', 'CopyEngine', 'Trade copied successfully', {
      correlationId,
      clientId: client.clientRef,
      symbol: mappedSymbol,
      direction: masterPosition.direction,
      volume,
      brokerLatencyMs,
    });
  }

  // ── Handle modified position (SL/TP update) ────────────────────────────

  private async handleModifiedPosition(
    cycleId: string,
    correlationId: string,
    change: PositionChange,
    client: CopyTradingClient,
  ): Promise<void> {
    const { masterPosition, existingDbRecord } = change;
    if (!client.metaApiAccountId || !existingDbRecord) return;

    // Find client position mapped to this master position
    const clientPosition = await prisma.clientPosition.findFirst({
      where: {
        clientId: client.id,
        masterPositionId: existingDbRecord.id,
        status: 'open',
      },
    });

    if (!clientPosition) {
      log('DEBUG', 'CopyEngine', 'No client position found for modification', { correlationId });
      return;
    }

    if (!clientPosition.metaApiPositionId) {
      log('WARN', 'CopyEngine', 'Client position has no MetaApi trade ID', { correlationId });
      return;
    }

    const slChanged = this.numbersDiffer(clientPosition.sl, masterPosition.sl);
    const tpChanged = this.numbersDiffer(clientPosition.tp, masterPosition.tp);

    if (!slChanged && !tpChanged) return;

    const result = await metaApiService.modifyPosition(
      client.metaApiAccountId,
      clientPosition.metaApiPositionId,
      {
        stopLoss: masterPosition.sl ?? undefined,
        takeProfit: masterPosition.tp ?? undefined,
      },
    );

    if (!result.success) {
      this.totalErrors++;
      log('ERROR', 'CopyEngine', 'SL/TP modification failed', {
        correlationId,
        clientId: client.clientRef,
        symbol: clientPosition.symbol,
        error: result.error,
      });
      await this.createAlert(client.id, 'modification_failure', 'medium',
        `Failed to modify ${clientPosition.symbol}: ${result.error}`);
      return;
    }

    // Update client position record
    await prisma.clientPosition.update({
      where: { id: clientPosition.id },
      data: {
        sl: masterPosition.sl,
        tp: masterPosition.tp,
      },
    });

    await auditLog.logTradeAction({
      entityType: 'TRADE',
      clientId: client.id,
      tradeId: clientPosition.id,
      action: 'trade_modified',
      performedBy: 'copy_engine',
      symbol: clientPosition.symbol,
      details: {
        correlationId,
        slChanged,
        tpChanged,
        newSl: masterPosition.sl,
        newTp: masterPosition.tp,
      },
    });

    log('INFO', 'CopyEngine', 'SL/TP modification copied', {
      correlationId,
      clientId: client.clientRef,
      symbol: clientPosition.symbol,
      slChanged,
      tpChanged,
    });
  }

  // ── Handle closed position ──────────────────────────────────────────────

  private async handleClosedPosition(
    cycleId: string,
    correlationId: string,
    change: PositionChange,
    client: CopyTradingClient,
  ): Promise<void> {
    const { existingDbRecord } = change;
    if (!client.metaApiAccountId || !existingDbRecord) return;

    // Find all open client positions mapped to this master position
    const clientPositions = await prisma.clientPosition.findMany({
      where: {
        clientId: client.id,
        masterPositionId: existingDbRecord.id,
        status: 'open',
      },
    });

    for (const cp of clientPositions) {
      if (!cp.metaApiPositionId) {
        log('WARN', 'CopyEngine', 'Client position missing MetaApi ID, marking closed', { correlationId });
        await prisma.clientPosition.update({
          where: { id: cp.id },
          data: { status: 'closed' },
        });
        continue;
      }

      const result = await metaApiService.closePosition(client.metaApiAccountId, cp.metaApiPositionId);

      if (!result.success) {
        this.totalErrors++;
        log('ERROR', 'CopyEngine', 'Trade close failed', {
          correlationId,
          clientId: client.clientRef,
          symbol: cp.symbol,
          metaApiPositionId: cp.metaApiPositionId,
        });
        await this.createAlert(client.id, 'close_failure', 'high',
          `Failed to close ${cp.symbol} position`);
        continue;
      }

      await prisma.clientPosition.update({
        where: { id: cp.id },
        data: { status: 'closed' },
      });

      await auditLog.logTradeAction({
        entityType: 'TRADE',
        clientId: client.id,
        tradeId: cp.id,
        action: 'trade_closed',
        performedBy: 'copy_engine',
        symbol: cp.symbol,
        side: cp.direction.toLowerCase(),
        quantity: cp.volume,
        details: { correlationId, masterClosed: true },
      });

      log('INFO', 'CopyEngine', 'Client position closed', {
        correlationId,
        clientId: client.clientRef,
        symbol: cp.symbol,
        volume: cp.volume,
      });
    }
  }

  // ── Retry logic with exponential backoff ────────────────────────────────

  private async executeWithRetry(
    correlationId: string,
    accountId: string,
    trade: { symbol: string; action: 'ORDER_TYPE_BUY' | 'ORDER_TYPE_SELL'; volume: number; stopLoss?: number; takeProfit?: number; comment?: string },
    idempotencyKey: string,
  ): Promise<{ success: boolean; tradeId?: string; error?: string; retryCount: number }> {
    let lastError: string = '';

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      if (attempt > 0) {
        const delayMs = RETRY_DELAYS_MS[Math.min(attempt - 1, RETRY_DELAYS_MS.length - 1)];
        log('INFO', 'CopyEngine', `Retry attempt ${attempt}/${MAX_RETRIES}`, {
          correlationId,
          delayMs,
          nextRetryAt: new Date(Date.now() + delayMs).toISOString(),
        });

        await prisma.copyExecution.updateMany({
          where: { idempotencyKey },
          data: {
            state: TradeState.retrying,
            retryCount: attempt,
            lastRetryAt: new Date(),
            nextRetryAt: new Date(Date.now() + delayMs),
          },
        });

        await this.sleep(delayMs);
      }

      const execResult = await metaApiService.executeTrade(accountId, trade);

      if (execResult.success) {
        return { success: true, tradeId: execResult.tradeId, retryCount: attempt };
      }

      lastError = execResult.error ?? 'Unknown broker error';

      // Do NOT retry on risk or rejected errors — only on broker errors and timeouts
      if (lastError.includes('risk') || lastError.includes('rejected') || lastError.includes('insufficient')) {
        await idempotency.markFailed(idempotencyKey, `Broker rejected: ${lastError}`);
        return { success: false, error: lastError, retryCount: attempt };
      }

      log('WARN', 'CopyEngine', 'Broker execution failed', {
        correlationId,
        attempt,
        error: lastError,
      });
    }

    // All retries exhausted
    await idempotency.markFailed(idempotencyKey, `Failed after ${MAX_RETRIES} retries: ${lastError}`);
    return { success: false, error: lastError, retryCount: MAX_RETRIES };
  }

  // ── Client management ───────────────────────────────────────────────────

  async addClient(payload: {
    clientRef: string;
    mt5AccountNumber: string;
    brokerServer: string;
    mt5InvestorPassword: string;
    startingEquity: number;
    fullName: string;
    copyMode?: CopyMode;
    lotRatio?: number;
  }) {
    const { encrypted, iv } = encrypt(payload.mt5InvestorPassword);

    const client = await prisma.copyTradingClient.create({
      data: {
        clientRef: payload.clientRef,
        mt5AccountNumber: payload.mt5AccountNumber,
        brokerServer: payload.brokerServer,
        mt5InvestorPasswordEnc: encrypted,
        mt5InvestorPasswordIv: iv,
        equityAtStart: payload.startingEquity,
        currentEquity: payload.startingEquity,
        fullName: payload.fullName,
        copyMode: payload.copyMode ?? 'equity_proportional',
        lotRatio: payload.lotRatio ?? 1.0,
        status: 'pending',
        connectionHealth: 'unknown',
      },
    });

    await auditLog.logClientAction({
      entityType: 'CLIENT',
      clientId: client.id,
      action: 'client_added',
      performedBy: 'system',
      details: {
        clientRef: payload.clientRef,
        mt5AccountNumber: payload.mt5AccountNumber,
        brokerServer: payload.brokerServer,
        fullName: payload.fullName,
        startingEquity: payload.startingEquity,
      },
    });

    log('INFO', 'CopyEngine', 'Client added', {
      clientId: client.clientRef,
      fullName: payload.fullName,
    });

    return client;
  }

  async removeClient(clientId: string): Promise<void> {
    const client = await prisma.copyTradingClient.findUnique({ where: { id: clientId } });
    if (!client) {
      throw new Error(`Client ${clientId} not found`);
    }

    await prisma.copyTradingClient.update({
      where: { id: clientId },
      data: {
        status: 'closed',
        previousStatus: client.status,
        statusChangedAt: new Date(),
        statusChangeReason: 'Soft-removed by admin',
      },
    });

    // Close all open client positions
    const openPositions = await prisma.clientPosition.findMany({
      where: { clientId, status: 'open' },
    });

    for (const pos of openPositions) {
      if (pos.metaApiPositionId && client.metaApiAccountId) {
        await metaApiService.closePosition(client.metaApiAccountId, pos.metaApiPositionId);
      }
      await prisma.clientPosition.update({
        where: { id: pos.id },
        data: { status: 'closed' },
      });
    }

    await auditLog.logClientAction({
      entityType: 'CLIENT',
      clientId,
      action: 'client_removed',
      performedBy: 'system',
      details: {
        clientRef: client.clientRef,
        closedPositions: openPositions.length,
      },
    });

    log('INFO', 'CopyEngine', 'Client removed', {
      clientId: client.clientRef,
      closedPositions: openPositions.length,
    });
  }

  async pauseClient(clientId: string, reason: string, pausedBy: string): Promise<void> {
    const client = await prisma.copyTradingClient.findUnique({ where: { id: clientId } });
    if (!client) {
      throw new Error(`Client ${clientId} not found`);
    }

    const previousStatus = client.status;

    await prisma.copyTradingClient.update({
      where: { id: clientId },
      data: {
        status: 'paused',
        previousStatus,
        statusChangedAt: new Date(),
        statusChangeReason: reason,
        statusChangedBy: pausedBy,
      },
    });

    await this.createAlert(clientId, 'client_paused', 'medium', reason);

    await auditLog.logClientAction({
      entityType: 'CLIENT',
      clientId,
      action: 'client_paused',
      performedBy: pausedBy,
      details: { clientRef: client.clientRef, reason, previousStatus },
    });

    log('INFO', 'CopyEngine', 'Client paused', {
      clientId: client.clientRef,
      reason,
      pausedBy,
    });
  }

  async resumeClient(clientId: string, resumedBy: string): Promise<void> {
    const client = await prisma.copyTradingClient.findUnique({ where: { id: clientId } });
    if (!client) {
      throw new Error(`Client ${clientId} not found`);
    }

    if (client.status !== 'paused' && client.status !== 'risk_paused') {
      throw new Error(`Client ${clientId} is not paused (status: ${client.status})`);
    }

    await prisma.copyTradingClient.update({
      where: { id: clientId },
      data: {
        status: 'copying',
        previousStatus: client.status,
        statusChangedAt: new Date(),
        statusChangeReason: `Resumed by ${resumedBy}`,
        statusChangedBy: resumedBy,
      },
    });

    await auditLog.logClientAction({
      entityType: 'CLIENT',
      clientId,
      action: 'client_resumed',
      performedBy: resumedBy,
      details: { clientRef: client.clientRef, previousStatus: client.status },
    });

    log('INFO', 'CopyEngine', 'Client resumed', {
      clientId: client.clientRef,
      resumedBy,
    });
  }

  // ── Helpers ─────────────────────────────────────────────────────────────

  private async getActiveClients(): Promise<CopyTradingClient[]> {
    return prisma.copyTradingClient.findMany({
      where: {
        status: { in: ['copying', 'healthy', 'connected'] },
        connectionHealth: { in: ['connected', 'degraded'] },
      },
    });
  }

  private isClientEligible(client: CopyTradingClient): boolean {
    const eligibleStatuses = new Set(['copying', 'healthy', 'connected']);
    if (!eligibleStatuses.has(client.status)) return false;
    const eligibleHealth = new Set(['connected', 'degraded']);
    if (!eligibleHealth.has(client.connectionHealth)) return false;
    return true;
  }

  private isSymbolAllowed(symbol: string, allowedSymbols: string[]): boolean {
    if (allowedSymbols.length === 0) return true;
    const normalized = symbol.toUpperCase();
    return allowedSymbols.some((s) => s.toUpperCase() === normalized);
  }

  private calculateVolume(
    masterVolume: number,
    masterEquity: number,
    clientEquity: number,
    copyMode: string,
    lotRatio: number,
    fixedLotSize: number | null,
  ): number {
    let raw: number;

    switch (copyMode) {
      case 'fixed_ratio':
        raw = mul(masterVolume, lotRatio);
        break;
      case 'equity_proportional':
        if (masterEquity <= 0) return 0;
        raw = mul(masterVolume, clientEquity / masterEquity);
        break;
      case 'fixed_lot':
        raw = fixedLotSize ?? lotRatio;
        break;
      default:
        raw = masterVolume;
    }

    return Math.round(raw * 100) / 100;
  }

  private async ensureMasterAccount(metaApiAccountId: string) {
    let account = await prisma.masterAccount.findUnique({
      where: { metaApiAccountId },
    });

    if (!account) {
      const info = await metaApiService.getAccountInfo(metaApiAccountId);
      account = await prisma.masterAccount.create({
        data: {
          metaApiAccountId,
          accountName: info?.name ?? `Master ${metaApiAccountId}`,
          brokerName: info?.server ?? null,
          serverName: info?.server ?? null,
          currentEquity: info?.equity ?? null,
          currentBalance: info?.balance ?? null,
          leverage: info?.leverage ?? null,
          connectionHealth: 'unknown',
        },
      });
    }

    return account;
  }

  private apiTradeToSnapshot(trade: MetaApiPosition): PositionSnapshot {
    return {
      metaApiPositionId: trade.id,
      symbol: trade.symbol,
      direction: trade.type === 'POSITION_TYPE_BUY' ? 'BUY' : 'SELL',
      volume: trade.volume,
      openPrice: trade.openPrice,
      sl: trade.sl,
      tp: trade.tp,
      profit: trade.profit,
      openTime: trade.openTime ? new Date(trade.openTime) : null,
    };
  }

  private numbersDiffer(a: number | null | undefined, b: number | null | undefined): boolean {
    const hasA = a != null && a !== 0;
    const hasB = b != null && b !== 0;
    if (!hasA && !hasB) return false;
    if (!hasA || !hasB) return true;
    return Math.abs(a! - b!) > 0.00001;
  }

  private async createAlert(clientId: string, type: string, severity: AlertSeverity, message: string) {
    await prisma.copyTradeAlert.create({
      data: { clientId, type, severity, message },
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ── Singleton export ────────────────────────────────────────────────────────

export const copyEngine = CopyEngine.getInstance();
