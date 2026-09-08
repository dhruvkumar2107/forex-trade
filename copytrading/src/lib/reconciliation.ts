import { prisma } from './prisma';
import { metaApiService, type MetaApiPosition } from './metaapi';
import { auditLog } from './audit';

// ── Configuration ───────────────────────────────────────────────────────────

const SCHEDULE_INTERVAL_MS = parseInt(process.env.RECONCILIATION_INTERVAL_MS || '300000', 10);
const PRICE_TOLERANCE_PERCENT = parseFloat(process.env.RECONCILIATION_PRICE_TOLERANCE || '0.02');
const VOLUME_TOLERANCE = parseFloat(process.env.RECONCILIATION_VOLUME_TOLERANCE || '0.005');
const SL_TP_TOLERANCE = parseFloat(process.env.RECONCILIATION_SL_TP_TOLERANCE || '0.01');
const MAX_CONCURRENT_CLIENTS = parseInt(process.env.RECONCILIATION_MAX_CONCURRENT || '5', 10);

// ── Enum types (mirrors schema.prisma) ─────────────────────────────────────
// These mirror the Prisma enums defined in schema.prisma.
// After running `prisma generate`, import them directly from '@prisma/client'.

export type ReconciliationStatus =
  | 'matched'
  | 'missing'
  | 'extra'
  | 'volume_mismatch'
  | 'price_mismatch'
  | 'sl_mismatch'
  | 'tp_mismatch'
  | 'status_mismatch'
  | 'unknown'
  | 'manual_review';

export type ReconciliationResolution =
  | 'pending'
  | 'auto_resolved'
  | 'manually_resolved'
  | 'escalated'
  | 'ignored';

export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

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

// ── Types ───────────────────────────────────────────────────────────────────

export interface PositionComparison {
  clientPositionId: string;
  metaApiPositionId: string | null;
  symbol: string;
  expectedDirection: string | null;
  actualDirection: string | null;
  expectedVolume: number | null;
  actualVolume: number | null;
  expectedOpenPrice: number | null;
  actualOpenPrice: number | null;
  expectedSl: number | null;
  actualSl: number | null;
  expectedTp: number | null;
  actualTp: number | null;
  expectedStatus: string | null;
  actualStatus: string | null;
  status: ReconciliationStatus;
  details: string;
}

export interface ClientReconciliationResult {
  clientId: string;
  clientRef: string;
  positionsChecked: number;
  matched: number;
  mismatches: number;
  details: PositionComparison[];
  healthScore: number;
  brokerApiAvailable: boolean;
  error?: string;
}

export interface ReconciliationReport {
  timestamp: string;
  durationMs: number;
  clientsChecked: number;
  totalPositions: number;
  matched: number;
  mismatches: number;
  results: ClientReconciliationResult[];
}

interface NormalizedBrokerPosition {
  metaApiPositionId: string;
  symbol: string;
  direction: string;
  volume: number;
  openPrice: number;
  sl: number | null;
  tp: number | null;
  status: string;
}

/** Shape returned by the clientPosition.findMany select query. */
interface DbPositionRow {
  id: string;
  metaApiPositionId: string | null;
  symbol: string;
  direction: string;
  volume: number;
  openPrice: number;
  sl: number | null;
  tp: number | null;
  status: string;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function normalizeDirection(type: string): string {
  if (type === 'POSITION_TYPE_BUY') return 'BUY';
  if (type === 'POSITION_TYPE_SELL') return 'SELL';
  return type.toUpperCase();
}

function normalizeSymbol(symbol: string): string {
  return symbol.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function normalizeBrokerPosition(pos: MetaApiPosition): NormalizedBrokerPosition {
  return {
    metaApiPositionId: pos.id,
    symbol: normalizeSymbol(pos.symbol),
    direction: normalizeDirection(pos.type),
    volume: Math.round(pos.volume * 100) / 100,
    openPrice: pos.openPrice,
    sl: pos.sl || null,
    tp: pos.tp || null,
    status: 'open',
  };
}

function areClose(a: number | null, b: number | null, tolerance: number): boolean {
  if (a === null && b === null) return true;
  if (a === null || b === null) return false;
  if (a === 0 && b === 0) return true;
  const base = Math.max(Math.abs(a), Math.abs(b), 1);
  return Math.abs(a - b) / base <= tolerance;
}

function computeHealthScore(matched: number, total: number): number {
  if (total === 0) return 100;
  return Math.round((matched / total) * 100);
}

function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

const VALID_RESOLUTIONS: readonly ReconciliationResolution[] = [
  'pending',
  'auto_resolved',
  'manually_resolved',
  'escalated',
  'ignored',
];

// ── Reconciliation class ────────────────────────────────────────────────────

export class Reconciliation {
  private static instance: Reconciliation;
  private scheduleTimer: ReturnType<typeof setTimeout> | null = null;
  private isRunning = false;

  private constructor() {}

  static getInstance(): Reconciliation {
    if (!Reconciliation.instance) {
      Reconciliation.instance = new Reconciliation();
    }
    return Reconciliation.instance;
  }

  // ── Public API ───────────────────────────────────────────────────────────

  /**
   * Run full reconciliation across every active client that has a MetaApi account.
   * Can be invoked by cron or on-demand.
   */
  async runFullReconciliation(): Promise<ReconciliationReport> {
    const startTime = Date.now();
    log('INFO', 'RECONCILIATION', 'Starting full reconciliation');

    const activeClients = await prisma.copyTradingClient.findMany({
      where: {
        status: {
          in: ['connected', 'copying', 'healthy'] as any,
        },
        metaApiAccountId: { not: null },
      } as any,
      select: {
        id: true,
        clientRef: true,
        metaApiAccountId: true,
      },
    });

    log('INFO', 'RECONCILIATION', `Found ${activeClients.length} active clients`);

    const results: ClientReconciliationResult[] = [];
    const clientChunks = chunk(activeClients, MAX_CONCURRENT_CLIENTS);

    for (const clientChunk of clientChunks) {
      const chunkResults = await Promise.allSettled(
        clientChunk.map((client) => this.runClientReconciliation(client.id)),
      );

      for (const result of chunkResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          log('ERROR', 'RECONCILIATION', 'Client reconciliation failed unexpectedly', {
            error: result.reason?.message ?? String(result.reason),
          });
        }
      }
    }

    const totalPositions = results.reduce((sum, r) => sum + r.positionsChecked, 0);
    const matched = results.reduce((sum, r) => sum + r.matched, 0);
    const mismatches = results.reduce((sum, r) => sum + r.mismatches, 0);

    const report: ReconciliationReport = {
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      clientsChecked: results.length,
      totalPositions,
      matched,
      mismatches,
      results,
    };

    log('INFO', 'RECONCILIATION', 'Full reconciliation complete', {
      clientsChecked: report.clientsChecked,
      totalPositions: report.totalPositions,
      matched: report.matched,
      mismatches: report.mismatches,
      durationMs: report.durationMs,
    });

    await auditLog.log({
      entityType: 'SYSTEM',
      action: 'RECONCILIATION_FULL',
      performedBy: 'SYSTEM',
      details: {
        clientsChecked: report.clientsChecked,
        totalPositions: report.totalPositions,
        matched: report.matched,
        mismatches: report.mismatches,
        durationMs: report.durationMs,
      },
    });

    return report;
  }

  /**
   * Reconcile a single client's expected DB positions against actual broker positions.
   */
  async runClientReconciliation(clientId: string): Promise<ClientReconciliationResult> {
    const client = await prisma.copyTradingClient.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        clientRef: true,
        metaApiAccountId: true,
      },
    });

    if (!client) {
      throw new Error(`Client ${clientId} not found`);
    }

    const result: ClientReconciliationResult = {
      clientId: client.id,
      clientRef: client.clientRef,
      positionsChecked: 0,
      matched: 0,
      mismatches: 0,
      details: [],
      healthScore: 100,
      brokerApiAvailable: true,
    };

    if (!client.metaApiAccountId) {
      result.brokerApiAvailable = false;
      result.error = 'No MetaApi account linked';
      result.healthScore = 0;
      return result;
    }

    // ── Fetch DB positions (expected) ────────────────────────────────────
    // Cast to any: clientPosition model exists in schema.prisma but the
    // generated client is stale until `prisma generate` is re-run.
    const dbPositions = (await (prisma as any).clientPosition.findMany({
      where: {
        clientId,
        status: 'open',
      },
      select: {
        id: true,
        metaApiPositionId: true,
        symbol: true,
        direction: true,
        volume: true,
        openPrice: true,
        sl: true,
        tp: true,
        status: true,
      },
    })) as unknown as DbPositionRow[];

    // ── Fetch broker positions (actual) ──────────────────────────────────
    let brokerPositions: NormalizedBrokerPosition[] = [];
    try {
      const rawPositions = await metaApiService.getOpenPositions(client.metaApiAccountId);
      brokerPositions = rawPositions.map(normalizeBrokerPosition);
    } catch (err) {
      result.brokerApiAvailable = false;
      result.error = err instanceof Error ? err.message : 'Broker API unavailable';
      result.healthScore = 0;

      log('ERROR', 'RECONCILIATION', 'Failed to fetch broker positions', {
        clientId,
        clientRef: client.clientRef,
        error: result.error,
      });

      await this.createAlert(clientId, 'reconciliation_broker_api_failure', 'high', {
        title: 'Broker API Failure During Reconciliation',
        message: `Failed to fetch positions for client ${client.clientRef}: ${result.error}`,
      });

      return result;
    }

    // ── Build lookup maps ────────────────────────────────────────────────
    const brokerByMetaApiId = new Map<string, NormalizedBrokerPosition>();
    for (const bp of brokerPositions) {
      brokerByMetaApiId.set(bp.metaApiPositionId, bp);
    }

    const brokerBySymbolDir = new Map<string, NormalizedBrokerPosition>();
    for (const bp of brokerPositions) {
      const key = `${bp.symbol}_${bp.direction}`;
      brokerBySymbolDir.set(key, bp);
    }

    const matchedBrokerIds = new Set<string>();

    // ── Phase 1: DB → Broker (missing, matched, mismatched) ──────────────
    for (const dbPos of dbPositions) {
      result.positionsChecked++;

      let brokerPos: NormalizedBrokerPosition | undefined;

      // Strongest match: unique MetaApi position ID
      if (dbPos.metaApiPositionId) {
        brokerPos = brokerByMetaApiId.get(dbPos.metaApiPositionId);
      }

      // Fallback: symbol + direction (handles position id drift)
      if (!brokerPos) {
        const key = `${normalizeSymbol(dbPos.symbol)}_${dbPos.direction}`;
        brokerPos = brokerBySymbolDir.get(key);
      }

      if (!brokerPos) {
        const comparison = this.createMissingComparison(dbPos);
        result.details.push(comparison);
        result.mismatches++;

        await this.logReconciliationResult(clientId, comparison);
        await this.createAlert(clientId, 'reconciliation_missing_position', 'high', {
          title: 'Position Missing on Broker',
          message: `Position ${dbPos.symbol} (${dbPos.direction}) exists in DB for client ${client.clientRef} but not on broker`,
        });

        continue;
      }

      matchedBrokerIds.add(brokerPos.metaApiPositionId);

      const comparison = this.comparePositions(dbPos, brokerPos);
      result.details.push(comparison);

      if (comparison.status === 'matched') {
        result.matched++;
      } else {
        result.mismatches++;

        await this.logReconciliationResult(clientId, comparison);

        const severity = this.getAlertSeverity(comparison.status);
        await this.createAlert(clientId, 'reconciliation_mismatch', severity, {
          title: `Position Mismatch: ${comparison.status}`,
          message: `${client.clientRef}: ${comparison.details} (${comparison.symbol})`,
        });
      }
    }

    // ── Phase 2: Broker → DB (extra positions) ───────────────────────────
    for (const brokerPos of brokerPositions) {
      if (!matchedBrokerIds.has(brokerPos.metaApiPositionId)) {
        result.positionsChecked++;
        const comparison = this.createExtraComparison(brokerPos);
        result.details.push(comparison);
        result.mismatches++;

        await this.logReconciliationResult(clientId, comparison);
        await this.createAlert(clientId, 'reconciliation_extra_position', 'medium', {
          title: 'Extra Position on Broker',
          message: `Position ${brokerPos.symbol} (${brokerPos.direction}) exists on broker for client ${client.clientRef} but not in DB`,
        });
      }
    }

    result.healthScore = computeHealthScore(result.matched, result.positionsChecked);

    log('INFO', 'RECONCILIATION', 'Client reconciliation complete', {
      clientId,
      clientRef: client.clientRef,
      positionsChecked: result.positionsChecked,
      matched: result.matched,
      mismatches: result.mismatches,
      healthScore: result.healthScore,
    });

    return result;
  }

  /**
   * Resolve a pending reconciliation mismatch.
   * Validates the resolution value and writes the audit trail.
   */
  async resolve(
    logId: string,
    resolution: string,
    notes: string,
    resolvedBy: string,
  ): Promise<void> {
    if (!(VALID_RESOLUTIONS as readonly string[]).includes(resolution)) {
      throw new Error(
        `Invalid resolution: ${resolution}. Must be one of: ${VALID_RESOLUTIONS.join(', ')}`,
      );
    }

    const reconciliationLog = await prisma.reconciliationLog.findUnique({
      where: { id: logId },
    });

    if (!reconciliationLog) {
      throw new Error(`Reconciliation log ${logId} not found`);
    }

    const existingResolution = (reconciliationLog as any).resolution ?? 'pending';
    if (existingResolution !== 'pending') {
      throw new Error(
        `Reconciliation log ${logId} is already resolved as ${existingResolution}`,
      );
    }

    await prisma.reconciliationLog.update({
      where: { id: logId },
      data: {
        resolution: resolution as any,
        resolutionNotes: notes,
        resolvedBy,
        resolvedAt: new Date(),
      } as any,
    });

    await auditLog.log({
      entityType: 'RECONCILIATION',
      entityId: logId,
      clientId: reconciliationLog.clientId,
      action: 'RECONCILIATION_RESOLVED',
      performedBy: resolvedBy,
      details: {
        resolution,
        notes,
        symbol: (reconciliationLog as any).symbol,
        status: (reconciliationLog as any).status,
      },
    });

    log('INFO', 'RECONCILIATION', 'Mismatch resolved', {
      logId,
      clientId: reconciliationLog.clientId,
      resolution,
      resolvedBy,
    });
  }

  /**
   * Retrieve all unresolved reconciliation mismatches.
   * Optionally filter to a single client.
   */
  async getUnresolved(clientId?: string): Promise<any[]> {
    const where: any = {
      resolution: 'pending',
    };

    if (clientId) {
      where.clientId = clientId;
    }

    return prisma.reconciliationLog.findMany({
      where,
      orderBy: { checkedAt: 'desc' },
      include: {
        client: {
          select: {
            id: true,
            clientRef: true,
            mt5AccountNumber: true,
          },
        },
      },
    } as any);
  }

  /**
   * Calculate reconciliation health score for a client (0–100).
   * Score is based on matched vs total checks in the last 24h, with a
   * penalty for each unresolved mismatch (capped at −50).
   */
  async getHealthScore(clientId: string): Promise<number> {
    const client = await prisma.copyTradingClient.findUnique({
      where: { id: clientId },
      select: { id: true },
    });

    if (!client) {
      throw new Error(`Client ${clientId} not found`);
    }

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const unresolvedCount = await prisma.reconciliationLog.count({
      where: {
        clientId,
        resolution: 'pending',
        checkedAt: { gte: oneDayAgo },
      } as any,
    });

    const totalChecks = await prisma.reconciliationLog.count({
      where: {
        clientId,
        checkedAt: { gte: oneDayAgo },
      } as any,
    });

    if (totalChecks === 0) return 100;

    const matchedCount = await prisma.reconciliationLog.count({
      where: {
        clientId,
        status: 'matched',
        checkedAt: { gte: oneDayAgo },
      } as any,
    });

    const baseHealth = computeHealthScore(matchedCount, totalChecks);
    const penalty = Math.min(unresolvedCount * 5, 50);

    return Math.max(0, baseHealth - penalty);
  }

  // ── Scheduling ───────────────────────────────────────────────────────────

  /** Start periodic reconciliation on a timer. */
  startSchedule(): void {
    if (this.scheduleTimer) return;

    log('INFO', 'RECONCILIATION', 'Starting scheduled reconciliation', {
      intervalMs: SCHEDULE_INTERVAL_MS,
    });

    const run = async () => {
      if (this.isRunning) {
        log('WARN', 'RECONCILIATION', 'Previous reconciliation still running, skipping');
        return;
      }

      this.isRunning = true;
      try {
        await this.runFullReconciliation();
      } catch (err) {
        log('ERROR', 'RECONCILIATION', 'Scheduled reconciliation failed', {
          error: err instanceof Error ? err.message : String(err),
        });
      } finally {
        this.isRunning = false;
        this.scheduleTimer = setTimeout(run, SCHEDULE_INTERVAL_MS);
      }
    };

    this.scheduleTimer = setTimeout(run, SCHEDULE_INTERVAL_MS);
  }

  /** Stop the periodic reconciliation timer. */
  stopSchedule(): void {
    if (this.scheduleTimer) {
      clearTimeout(this.scheduleTimer);
      this.scheduleTimer = null;
      log('INFO', 'RECONCILIATION', 'Stopped scheduled reconciliation');
    }
  }

  // ── Private: comparison & alerting ────────────────────────────────────────

  private getAlertSeverity(status: ReconciliationStatus): AlertSeverity {
    switch (status) {
      case 'volume_mismatch':
        return 'critical';
      case 'manual_review':
      case 'extra':
      case 'missing':
        return 'high';
      case 'price_mismatch':
      case 'sl_mismatch':
      case 'tp_mismatch':
        return 'medium';
      case 'status_mismatch':
        return 'low';
      default:
        return 'info';
    }
  }

  private comparePositions(
    dbPos: DbPositionRow,
    brokerPos: NormalizedBrokerPosition,
  ): PositionComparison {
    const mismatches: string[] = [];
    let primaryStatus: ReconciliationStatus = 'matched';

    // Symbol
    if (normalizeSymbol(dbPos.symbol) !== brokerPos.symbol) {
      mismatches.push(`Symbol: expected ${dbPos.symbol}, got ${brokerPos.symbol}`);
      primaryStatus = 'manual_review';
    }

    // Direction
    if (dbPos.direction !== brokerPos.direction) {
      mismatches.push(`Direction: expected ${dbPos.direction}, got ${brokerPos.direction}`);
      primaryStatus = 'manual_review';
    }

    // Volume
    if (!areClose(dbPos.volume, brokerPos.volume, VOLUME_TOLERANCE)) {
      mismatches.push(`Volume: expected ${dbPos.volume}, got ${brokerPos.volume}`);
      if (primaryStatus === 'matched') primaryStatus = 'volume_mismatch';
    }

    // Entry price
    if (!areClose(dbPos.openPrice, brokerPos.openPrice, PRICE_TOLERANCE_PERCENT)) {
      mismatches.push(`Entry price: expected ${dbPos.openPrice}, got ${brokerPos.openPrice}`);
      if (primaryStatus === 'matched') primaryStatus = 'price_mismatch';
    }

    // Stop loss
    if (!areClose(dbPos.sl, brokerPos.sl, SL_TP_TOLERANCE)) {
      mismatches.push(`Stop loss: expected ${dbPos.sl ?? 'none'}, got ${brokerPos.sl ?? 'none'}`);
      if (primaryStatus === 'matched') primaryStatus = 'sl_mismatch';
    }

    // Take profit
    if (!areClose(dbPos.tp, brokerPos.tp, SL_TP_TOLERANCE)) {
      mismatches.push(`Take profit: expected ${dbPos.tp ?? 'none'}, got ${brokerPos.tp ?? 'none'}`);
      if (primaryStatus === 'matched') primaryStatus = 'tp_mismatch';
    }

    const status: ReconciliationStatus =
      mismatches.length === 0 ? 'matched' : primaryStatus;

    const details = mismatches.length > 0 ? mismatches.join('; ') : 'Position matches';

    return {
      clientPositionId: dbPos.id,
      metaApiPositionId: brokerPos.metaApiPositionId,
      symbol: dbPos.symbol,
      expectedDirection: dbPos.direction,
      actualDirection: brokerPos.direction,
      expectedVolume: dbPos.volume,
      actualVolume: brokerPos.volume,
      expectedOpenPrice: dbPos.openPrice,
      actualOpenPrice: brokerPos.openPrice,
      expectedSl: dbPos.sl,
      actualSl: brokerPos.sl,
      expectedTp: dbPos.tp,
      actualTp: brokerPos.tp,
      expectedStatus: dbPos.status,
      actualStatus: brokerPos.status,
      status,
      details,
    };
  }

  private createMissingComparison(dbPos: DbPositionRow): PositionComparison {
    return {
      clientPositionId: dbPos.id,
      metaApiPositionId: dbPos.metaApiPositionId,
      symbol: dbPos.symbol,
      expectedDirection: dbPos.direction,
      actualDirection: null,
      expectedVolume: dbPos.volume,
      actualVolume: null,
      expectedOpenPrice: dbPos.openPrice,
      actualOpenPrice: null,
      expectedSl: dbPos.sl,
      actualSl: null,
      expectedTp: dbPos.tp,
      actualTp: null,
      expectedStatus: dbPos.status,
      actualStatus: null,
      status: 'missing',
      details: 'Position exists in DB but not found on broker',
    };
  }

  private createExtraComparison(brokerPos: NormalizedBrokerPosition): PositionComparison {
    return {
      clientPositionId: '',
      metaApiPositionId: brokerPos.metaApiPositionId,
      symbol: brokerPos.symbol,
      expectedDirection: null,
      actualDirection: brokerPos.direction,
      expectedVolume: null,
      actualVolume: brokerPos.volume,
      expectedOpenPrice: null,
      actualOpenPrice: brokerPos.openPrice,
      expectedSl: null,
      actualSl: brokerPos.sl,
      expectedTp: null,
      actualTp: brokerPos.tp,
      expectedStatus: null,
      actualStatus: brokerPos.status,
      status: 'extra',
      details: 'Position exists on broker but not in DB',
    };
  }

  private async createAlert(
    clientId: string,
    type: string,
    severity: AlertSeverity,
    data: { title: string; message: string },
  ): Promise<void> {
    try {
      await prisma.copyTradeAlert.create({
        data: {
          clientId,
          type,
          severity,
          message: data.message,
          metadata: JSON.stringify({
            source: 'reconciliation',
            title: data.title,
            timestamp: new Date().toISOString(),
          }),
        } as any,
      });
    } catch (err) {
      log('ERROR', 'RECONCILIATION', 'Failed to create alert', {
        clientId,
        type,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  private async logReconciliationResult(
    clientId: string,
    comparison: PositionComparison,
  ): Promise<void> {
    try {
      await prisma.reconciliationLog.create({
        data: {
          clientId,
          symbol: comparison.symbol,
          status: comparison.status,
          details: comparison.details,
        },
      });
    } catch (err) {
      log('ERROR', 'RECONCILIATION', 'Failed to log reconciliation result', {
        clientId,
        symbol: comparison.symbol,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
}

// ── Singleton export ────────────────────────────────────────────────────────

export const reconciliation = Reconciliation.getInstance();
