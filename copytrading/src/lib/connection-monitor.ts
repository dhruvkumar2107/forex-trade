import { Prisma } from '@prisma/client';
import { prisma } from './prisma';
import { auditLog } from './audit';
import { metaApiService, MetaApiConnectionStatus } from './metaapi';

export type ConnectionState =
  | 'connected'
  | 'degraded'
  | 'disconnected'
  | 'auth_failed'
  | 'stale'
  | 'reconnecting'
  | 'error'
  | 'unknown';

export interface ConnectionReport {
  timestamp: Date;
  totalClients: number;
  healthy: number;
  degraded: number;
  disconnected: number;
  errors: number;
  results: ClientHealthResult[];
}

export interface ClientHealthResult {
  clientId: string;
  clientRef: string;
  mt5AccountNumber: string;
  state: ConnectionState;
  healthScore: number;
  latencyMs: number | null;
  lastHeartbeat: Date | null;
  lastSuccessfulCommand: Date | null;
  lastTradeSyncAt: Date | null;
  reconnectCount: number;
  lastError: string | null;
  staleDurationMs: number | null;
}

export interface ClientHealthDetails extends ClientHealthResult {
  connectionState: string;
  previousState: string | null;
  statusChangedAt: Date | null;
  healthCheckAt: Date | null;
  metaApiAccountId: string | null;
  metaApiConnectionId: string | null;
}

interface HealthScoreFactors {
  connectionStateScore: number;
  heartbeatScore: number;
  latencyScore: number;
  errorScore: number;
  total: number;
}

const DEFAULT_STALE_THRESHOLD_MS = 60_000;
const CONCURRENT_CHECK_LIMIT = 5;
const RECONNECT_THRESHOLD_SCORE = 30;

const CLIENT_SELECT = {
  id: true,
  clientRef: true,
  mt5AccountNumber: true,
  metaApiAccountId: true,
  metaApiConnectionId: true,
  connectionHealth: true,
  lastHeartbeat: true,
  lastSuccessfulCommand: true,
  lastTradeSyncAt: true,
  lastHealthCheckAt: true,
  reconnectCount: true,
  lastError: true,
  healthScore: true,
  latencyMs: true,
  status: true,
  previousStatus: true,
  statusChangedAt: true,
} as const;

type ClientRecord = Prisma.CopyTradingClientGetPayload<{ select: typeof CLIENT_SELECT }>;

const ACTIVE_STATUSES = ['connecting', 'connected', 'healthy', 'copying', 'degraded'] as const;

class ConnectionMonitorClass {
  private static instance: ConnectionMonitorClass;
  private checkInterval: ReturnType<typeof setInterval> | null = null;
  private isRunning = false;
  private lastReport: ConnectionReport | null = null;

  private constructor() {}

  static getInstance(): ConnectionMonitorClass {
    if (!ConnectionMonitorClass.instance) {
      ConnectionMonitorClass.instance = new ConnectionMonitorClass();
    }
    return ConnectionMonitorClass.instance;
  }

  private log(
    level: 'info' | 'warn' | 'error' | 'debug',
    message: string,
    context?: Record<string, unknown>,
  ): void {
    const timestamp = new Date().toISOString();
    const entry = { timestamp, level, module: 'ConnectionMonitor', message, ...context };
    if (level === 'error') {
      console.error(JSON.stringify(entry));
    } else if (level === 'warn') {
      console.warn(JSON.stringify(entry));
    } else if (level === 'debug') {
      if (process.env.NODE_ENV === 'development') {
        console.log(JSON.stringify(entry));
      }
    } else {
      console.log(JSON.stringify(entry));
    }
  }

  // ── Health score calculation ──────────────────────────────────────────────

  private calculateHeartbeatScore(lastHeartbeat: Date | null): number {
    if (!lastHeartbeat) return 0;
    const age = Date.now() - lastHeartbeat.getTime();
    if (age <= 30_000) return 30;
    if (age <= 60_000) return 20;
    if (age <= 120_000) return 10;
    return 0;
  }

  private calculateLatencyScore(latencyMs: number | null): number {
    if (latencyMs == null) return 0;
    if (latencyMs < 500) return 20;
    if (latencyMs < 1_000) return 15;
    if (latencyMs < 2_000) return 10;
    if (latencyMs < 5_000) return 5;
    return 0;
  }

  private countErrorPatterns(message: string): number {
    const patterns = [
      'timeout',
      'rate limit',
      'connection refused',
      'authentication',
      'invalid credentials',
    ];
    const lower = message.toLowerCase();
    return patterns.filter((p) => lower.includes(p)).length;
  }

  private calculateErrorScore(lastError: string | null): number {
    if (!lastError) return 10;
    const count = this.countErrorPatterns(lastError);
    if (count === 0) return 10;
    if (count <= 2) return 5;
    return 0;
  }

  private calculateConnectionStateScore(state: ConnectionState): number {
    const scores: Record<ConnectionState, number> = {
      connected: 40,
      degraded: 20,
      disconnected: 0,
      auth_failed: 0,
      error: 0,
      stale: 5,
      reconnecting: 10,
      unknown: 5,
    };
    return scores[state] ?? 0;
  }

  private calculateHealthScore(
    state: ConnectionState,
    lastHeartbeat: Date | null,
    latencyMs: number | null,
    lastError: string | null,
  ): HealthScoreFactors {
    const connectionStateScore = this.calculateConnectionStateScore(state);
    const heartbeatScore = this.calculateHeartbeatScore(lastHeartbeat);
    const latencyScore = this.calculateLatencyScore(latencyMs);
    const errorScore = this.calculateErrorScore(lastError);

    return {
      connectionStateScore,
      heartbeatScore,
      latencyScore,
      errorScore,
      total: Math.min(100, Math.max(0, connectionStateScore + heartbeatScore + latencyScore + errorScore)),
    };
  }

  // ── State determination ───────────────────────────────────────────────────

  private determineConnectionState(
    metaApiState: string,
    lastHeartbeat: Date | null,
    staleThresholdMs: number,
  ): ConnectionState {
    const normalised = metaApiState.toLowerCase().replace(/_/g, '-');

    if (normalised === 'connected' || normalised === 'established') {
      if (lastHeartbeat) {
        const age = Date.now() - lastHeartbeat.getTime();
        if (age > staleThresholdMs) return 'stale';
      }
      return 'connected';
    }
    if (normalised === 'disconnected') return 'disconnected';
    if (normalised === 'auth-failed' || normalised === 'authentication-failed') return 'auth_failed';
    if (normalised === 'degraded') return 'degraded';
    if (normalised === 'error') return 'error';
    if (normalised === 'reconnecting') return 'reconnecting';
    return 'unknown';
  }

  // ── Persistence helpers ───────────────────────────────────────────────────

  private async updateClientHealth(
    clientId: string,
    state: ConnectionState,
    healthScore: number,
    latencyMs: number | null,
    heartbeat: Date | null,
    error: string | null,
  ): Promise<void> {
    const data: Prisma.CopyTradingClientUpdateInput = {
      connectionHealth: state as any,
      healthScore,
      latencyMs,
      lastHealthCheckAt: new Date(),
    };

    if (heartbeat) data.lastHeartbeat = heartbeat;
    if (error !== undefined && error !== null) data.lastError = error;

    await prisma.copyTradingClient.update({ where: { id: clientId }, data });
  }

  private async createAlert(
    clientId: string,
    type: string,
    severity: 'critical' | 'high' | 'medium' | 'low' | 'info',
    message: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    try {
      const data: Prisma.CopyTradeAlertUncheckedCreateInput = {
        clientId,
        type,
        severity: severity as any,
        message,
        metadata: metadata ? JSON.stringify(metadata) : undefined,
      };
      await prisma.copyTradeAlert.create({ data });
      this.log('info', `Alert created for client ${clientId}: ${type}`, { clientId, severity });
    } catch (err) {
      this.log('error', `Failed to create alert for client ${clientId}`, {
        clientId,
        error: (err as Error).message,
      });
    }
  }

  // ── Alert processing ──────────────────────────────────────────────────────

  private async processAlerts(
    client: Pick<ClientRecord, 'id' | 'clientRef' | 'connectionHealth' | 'healthScore' | 'reconnectCount'>,
    state: ConnectionState,
    healthScore: number,
    lastError: string | null,
  ): Promise<void> {
    const prev = String(client.connectionHealth);

    if (state === 'auth_failed' && prev !== 'auth_failed') {
      await this.createAlert(
        client.id,
        'connection_auth_failed',
        'critical',
        `Client ${client.clientRef} authentication failed. Re-authentication required.`,
        { previousState: prev, currentState: state, healthScore },
      );
    }

    if (state === 'disconnected' && prev !== 'disconnected') {
      await this.createAlert(
        client.id,
        'connection_disconnected',
        'high',
        `Client ${client.clientRef} lost MetaApi connection.`,
        { previousState: prev, currentState: state, healthScore, reconnectCount: client.reconnectCount },
      );
    }

    if (state === 'stale' && prev !== 'stale') {
      await this.createAlert(
        client.id,
        'connection_stale',
        'medium',
        `Client ${client.clientRef} heartbeat stale — no heartbeat for extended period.`,
        { previousState: prev, currentState: state, healthScore },
      );
    }

    if (state === 'error' && prev !== 'error') {
      await this.createAlert(
        client.id,
        'connection_error',
        'high',
        `Client ${client.clientRef} connection error: ${lastError || 'Unknown'}`,
        { previousState: prev, currentState: state, healthScore, lastError },
      );
    }

    if (state === 'degraded' && prev !== 'degraded') {
      await this.createAlert(
        client.id,
        'connection_degraded',
        'medium',
        `Client ${client.clientRef} connection degraded but functional.`,
        { previousState: prev, currentState: state, healthScore },
      );
    }

    if (
      state === 'connected' &&
      (prev === 'disconnected' || prev === 'error' || prev === 'stale')
    ) {
      await this.createAlert(
        client.id,
        'connection_recovered',
        'info',
        `Client ${client.clientRef} connection recovered.`,
        { previousState: prev, currentState: state, healthScore },
      );
    }

    if (healthScore < RECONNECT_THRESHOLD_SCORE && client.reconnectCount < 5) {
      await this.createAlert(
        client.id,
        'connection_low_score',
        'medium',
        `Client ${client.clientRef} health score low (${healthScore}).`,
        { healthScore, currentState: state, reconnectCount: client.reconnectCount },
      );
    }
  }

  // ── MetaApi check ─────────────────────────────────────────────────────────

  private async checkMetaApiConnection(
    metaApiAccountId: string,
  ): Promise<{ status: MetaApiConnectionStatus | null; error: string | null }> {
    try {
      const status = await metaApiService.getConnectionStatus(metaApiAccountId);
      return { status, error: null };
    } catch (err) {
      return { status: null, error: err instanceof Error ? err.message : 'Unknown MetaApi error' };
    }
  }

  // ── Public API ────────────────────────────────────────────────────────────

  async checkClient(clientId: string): Promise<ClientHealthResult> {
    const client = await prisma.copyTradingClient.findUnique({
      where: { id: clientId },
      select: CLIENT_SELECT,
    });

    if (!client) throw new Error(`Client not found: ${clientId}`);

    const fallback: ClientHealthResult = {
      clientId: client.id,
      clientRef: client.clientRef,
      mt5AccountNumber: client.mt5AccountNumber,
      state: 'unknown',
      healthScore: 0,
      latencyMs: null,
      lastHeartbeat: client.lastHeartbeat,
      lastSuccessfulCommand: client.lastSuccessfulCommand,
      lastTradeSyncAt: client.lastTradeSyncAt,
      reconnectCount: client.reconnectCount,
      lastError: client.lastError ?? 'No MetaApi account configured',
      staleDurationMs: null,
    };

    if (!client.metaApiAccountId) return fallback;

    const { status: metaApiStatus, error: metaApiError } = await this.checkMetaApiConnection(
      client.metaApiAccountId,
    );

    let state: ConnectionState;
    let latencyMs: number | null = null;
    const lastHeartbeat = client.lastHeartbeat;
    let lastError = client.lastError;

    if (metaApiError) {
      state = 'error';
      lastError = metaApiError;
    } else if (metaApiStatus) {
      state = this.determineConnectionState(metaApiStatus.state, client.lastHeartbeat, DEFAULT_STALE_THRESHOLD_MS);
      latencyMs = metaApiStatus.latencyMs;
    } else {
      state = 'unknown';
    }

    const { total: healthScore } = this.calculateHealthScore(state, lastHeartbeat, latencyMs, lastError);

    await this.updateClientHealth(client.id, state, healthScore, latencyMs, lastHeartbeat, lastError);

    await this.processAlerts(client, state, healthScore, lastError);

    const staleDurationMs = state === 'stale' && lastHeartbeat ? Date.now() - lastHeartbeat.getTime() : null;

    const result: ClientHealthResult = {
      clientId: client.id,
      clientRef: client.clientRef,
      mt5AccountNumber: client.mt5AccountNumber,
      state,
      healthScore,
      latencyMs,
      lastHeartbeat,
      lastSuccessfulCommand: client.lastSuccessfulCommand,
      lastTradeSyncAt: client.lastTradeSyncAt,
      reconnectCount: client.reconnectCount,
      lastError,
      staleDurationMs,
    };

    this.log('debug', `Health check completed: ${client.clientRef}`, {
      clientId: client.id,
      state,
      healthScore,
      latencyMs,
    });

    return result;
  }

  async checkAllClients(): Promise<ConnectionReport> {
    if (this.isRunning) {
      this.log('warn', 'Health check already in progress, skipping');
      return (
        this.lastReport ?? {
          timestamp: new Date(),
          totalClients: 0,
          healthy: 0,
          degraded: 0,
          disconnected: 0,
          errors: 0,
          results: [],
        }
      );
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      this.log('info', 'Starting health check for all active clients');

      const clients = await prisma.copyTradingClient.findMany({
        where: { status: { in: ACTIVE_STATUSES as any } },
        select: { id: true, clientRef: true },
        orderBy: { clientRef: 'asc' },
      });

      this.log('info', `Found ${clients.length} active clients to check`);

      const results: ClientHealthResult[] = [];

      for (let i = 0; i < clients.length; i += CONCURRENT_CHECK_LIMIT) {
        const batch = clients.slice(i, i + CONCURRENT_CHECK_LIMIT);
        const batchResults = await Promise.allSettled(batch.map((c) => this.checkClient(c.id)));
        for (const r of batchResults) {
          if (r.status === 'fulfilled') results.push(r.value);
          else this.log('error', `Client check failed: ${r.reason}`);
        }
      }

      let healthy = 0;
      let degraded = 0;
      let disconnected = 0;
      let errors = 0;

      for (const r of results) {
        switch (r.state) {
          case 'connected':
            healthy++;
            break;
          case 'degraded':
          case 'stale':
            degraded++;
            break;
          case 'disconnected':
          case 'auth_failed':
            disconnected++;
            break;
          default:
            errors++;
            break;
        }
      }

      const report: ConnectionReport = {
        timestamp: new Date(),
        totalClients: results.length,
        healthy,
        degraded,
        disconnected,
        errors,
        results,
      };

      this.lastReport = report;

      const duration = Date.now() - startTime;
      this.log('info', `Health check completed in ${duration}ms`, {
        totalClients: report.totalClients,
        healthy: report.healthy,
        degraded: report.degraded,
        disconnected: report.disconnected,
        errors: report.errors,
      });

      await auditLog.log({
        entityType: 'connection_monitor',
        action: 'health_check_completed',
        performedBy: 'system',
        details: JSON.stringify({
          duration,
          totalClients: report.totalClients,
          healthy: report.healthy,
          degraded: report.degraded,
          disconnected: report.disconnected,
          errors: report.errors,
        }),
      });

      return report;
    } catch (error) {
      this.log('error', 'Health check failed', { error: (error as Error).message });
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  async getHealthScore(clientId: string): Promise<number> {
    const result = await this.checkClient(clientId);
    return result.healthScore;
  }

  async getClientHealth(clientId: string): Promise<ClientHealthDetails> {
    const healthResult = await this.checkClient(clientId);

    const client = await prisma.copyTradingClient.findUnique({
      where: { id: clientId },
      select: {
        connectionHealth: true,
        previousStatus: true,
        statusChangedAt: true,
        lastHealthCheckAt: true,
        metaApiAccountId: true,
        metaApiConnectionId: true,
      },
    });

    if (!client) throw new Error(`Client not found: ${clientId}`);

    return {
      ...healthResult,
      connectionState: String(client.connectionHealth),
      previousState: client.previousStatus != null ? String(client.previousStatus) : null,
      statusChangedAt: client.statusChangedAt,
      healthCheckAt: client.lastHealthCheckAt,
      metaApiAccountId: client.metaApiAccountId,
      metaApiConnectionId: client.metaApiConnectionId,
    };
  }

  async getStaleClients(thresholdMs: number = DEFAULT_STALE_THRESHOLD_MS): Promise<string[]> {
    const threshold = new Date(Date.now() - thresholdMs);

    const rows = await prisma.copyTradingClient.findMany({
      where: {
        status: { in: ACTIVE_STATUSES as any },
        lastHeartbeat: { lt: threshold },
        connectionHealth: { not: 'disconnected' as any },
      },
      select: { id: true, clientRef: true },
    });

    this.log('info', `Found ${rows.length} stale clients (threshold ${thresholdMs}ms)`, {
      staleClients: rows.map((c) => c.clientRef),
    });

    return rows.map((c) => c.id);
  }

  async getDisconnectedClients(): Promise<string[]> {
    const rows = await prisma.copyTradingClient.findMany({
      where: {
        connectionHealth: { in: ['disconnected', 'auth_failed', 'error'] as any[] },
      },
      select: { id: true, clientRef: true },
    });

    this.log('info', `Found ${rows.length} disconnected clients`, {
      disconnectedClients: rows.map((c) => c.clientRef),
    });

    return rows.map((c) => c.id);
  }

  async getReconnectingClients(): Promise<string[]> {
    const rows = await prisma.copyTradingClient.findMany({
      where: { connectionHealth: 'reconnecting' as any },
      select: { id: true },
    });
    return rows.map((c) => c.id);
  }

  async incrementReconnectCount(clientId: string): Promise<void> {
    await prisma.copyTradingClient.update({
      where: { id: clientId },
      data: { reconnectCount: { increment: 1 } },
    });
    this.log('info', `Reconnect count incremented for ${clientId}`);
  }

  async resetReconnectCount(clientId: string): Promise<void> {
    await prisma.copyTradingClient.update({
      where: { id: clientId },
      data: { reconnectCount: 0 },
    });
    this.log('info', `Reconnect count reset for ${clientId}`);
  }

  async updateClientConnectionHealth(
    clientId: string,
    state: ConnectionState,
    error?: string,
  ): Promise<void> {
    const client = await prisma.copyTradingClient.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        clientRef: true,
        connectionHealth: true,
        healthScore: true,
        reconnectCount: true,
        lastError: true,
        lastHeartbeat: true,
        latencyMs: true,
      },
    });

    if (!client) throw new Error(`Client not found: ${clientId}`);

    const lastError = error ?? client.lastError;
    const { total: healthScore } = this.calculateHealthScore(
      state,
      client.lastHeartbeat,
      client.latencyMs,
      lastError,
    );

    await this.updateClientHealth(clientId, state, healthScore, client.latencyMs, client.lastHeartbeat, lastError);

    await this.processAlerts(
      { ...client, connectionHealth: String(client.connectionHealth) } as any,
      state,
      healthScore,
      lastError,
    );
  }

  async getSystemHealthSummary(): Promise<{
    totalClients: number;
    healthyClients: number;
    unhealthyClients: number;
    averageHealthScore: number;
    oldestHeartbeat: Date | null;
    recentAlerts: number;
  }> {
    const clients = await prisma.copyTradingClient.findMany({
      where: { status: { in: ACTIVE_STATUSES as any } },
      select: { connectionHealth: true, healthScore: true, lastHeartbeat: true },
    });

    const totalClients = clients.length;
    const healthyClients = clients.filter(
      (c) => String(c.connectionHealth) === 'connected' || String(c.connectionHealth) === 'healthy',
    ).length;

    const averageHealthScore =
      totalClients > 0
        ? Math.round((clients.reduce((s, c) => s + c.healthScore, 0) / totalClients) * 100) / 100
        : 0;

    const timestamps = clients.filter((c) => c.lastHeartbeat).map((c) => c.lastHeartbeat!.getTime());
    const oldestHeartbeat = timestamps.length > 0 ? new Date(Math.min(...timestamps)) : null;

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentAlerts = await prisma.copyTradeAlert.count({
      where: { type: { startsWith: 'connection_' }, createdAt: { gte: oneDayAgo } },
    });

    return {
      totalClients,
      healthyClients,
      unhealthyClients: totalClients - healthyClients,
      averageHealthScore,
      oldestHeartbeat,
      recentAlerts,
    };
  }

  // ── Periodic checks ───────────────────────────────────────────────────────

  startPeriodicChecks(intervalMs: number = 60_000): void {
    if (this.checkInterval) {
      this.log('warn', 'Periodic checks already running — restarting');
      this.stopPeriodicChecks();
    }

    this.log('info', `Starting periodic health checks every ${intervalMs}ms`);

    this.checkInterval = setInterval(() => {
      this.checkAllClients().catch((err) => {
        this.log('error', 'Periodic health check failed', { error: (err as Error).message });
      });
    }, intervalMs);

    this.checkAllClients().catch((err) => {
      this.log('error', 'Initial health check failed', { error: (err as Error).message });
    });
  }

  stopPeriodicChecks(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      this.log('info', 'Periodic health checks stopped');
    }
  }

  getLastReport(): ConnectionReport | null {
    return this.lastReport;
  }

  isCheckRunning(): boolean {
    return this.isRunning;
  }
}

export const connectionMonitor = ConnectionMonitorClass.getInstance();
export { ConnectionMonitorClass };
