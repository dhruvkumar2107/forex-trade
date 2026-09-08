import { Prisma, AuditLog } from '@prisma/client';
import { prisma } from './prisma';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface AuditLogParams {
  entityType: string;
  entityId?: string;
  clientId?: string;
  action: string;
  performedBy: string;
  role?: string;
  details?: string | Record<string, unknown>;
  previousValue?: string | Record<string, unknown>;
  newValue?: string | Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  sessionId?: string;
}

export interface ClientAuditParams extends AuditLogParams {
  clientId: string;
}

export interface TradeAuditParams extends AuditLogParams {
  clientId: string;
  tradeId?: string;
  symbol?: string;
  side?: string;
  quantity?: number;
  price?: number;
  pnl?: number;
}

export interface SecurityAuditParams {
  action: string;
  performedBy: string;
  ipAddress?: string;
  userAgent?: string;
  details?: string | Record<string, unknown>;
  severity?: 'INFO' | 'WARNING' | 'CRITICAL';
  requestId?: string;
  sessionId?: string;
}

export interface ConfigChangeParams {
  entityType: string;
  entityId: string;
  clientId?: string;
  field: string;
  oldValue: unknown;
  newValue: unknown;
  changedBy: string;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  sessionId?: string;
}

export interface AuditTrailFilters {
  entityType?: string;
  clientId?: string;
  action?: string;
  performedBy?: string;
  from?: Date;
  to?: Date;
  limit?: number;
  offset?: number;
}

export type AuditLogEntry = AuditLog;

// ── Helpers ────────────────────────────────────────────────────────────────────

const SENSITIVE_KEYS = new Set([
  'password', 'passwordConfirm', 'token', 'accessToken', 'refreshToken',
  'secret', 'apiKey', 'apiSecret', 'secretKey', 'privateKey',
  'authorization', 'cookie', 'sessionToken', 'otp', 'mfaCode',
  'creditCard', 'cvv', 'ssn', 'bankAccount', 'routingNumber',
]);

function redactSensitive(value: unknown): unknown {
  if (value === null || value === undefined) return value;

  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(redactSensitive);
  }

  if (typeof value === 'object') {
    const redacted: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      if (SENSITIVE_KEYS.has(key.toLowerCase())) {
        redacted[key] = '[REDACTED]';
      } else {
        redacted[key] = redactSensitive(val);
      }
    }
    return redacted;
  }

  return value;
}

function serializeValue(value: unknown): string | Prisma.InputJsonValue | undefined {
  if (value === null || value === undefined) return undefined;

  const sanitized = redactSensitive(value);

  if (typeof sanitized === 'string') return sanitized;

  return sanitized as Prisma.InputJsonValue;
}

// ── AuditLogger ────────────────────────────────────────────────────────────────

class AuditLogger {
  private static instance: AuditLogger;

  private constructor() {}

  static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }

  /**
   * Generic audit log entry.
   */
  async log(params: AuditLogParams): Promise<void> {
    try {
      const detailsValue = params.details != null
        ? (typeof params.details === 'string' ? params.details : JSON.stringify(params.details))
        : null;
      const previousValue = params.previousValue != null
        ? (typeof params.previousValue === 'string' ? params.previousValue : JSON.stringify(params.previousValue))
        : null;
      const newValue = params.newValue != null
        ? (typeof params.newValue === 'string' ? params.newValue : JSON.stringify(params.newValue))
        : null;

      await prisma.auditLog.create({
        data: {
          entityType: params.entityType,
          entityId: params.entityId ?? null,
          clientId: params.clientId ?? null,
          action: params.action,
          performedBy: params.performedBy,
          role: params.role ?? null,
          details: detailsValue,
          previousValue: previousValue,
          newValue: newValue,
          ipAddress: params.ipAddress ?? null,
          userAgent: params.userAgent ?? null,
          requestId: params.requestId ?? null,
          sessionId: params.sessionId ?? null,
        },
      });
    } catch (error) {
      console.error('[AUDIT] Failed to write audit log:', error);
    }
  }

  /**
   * Client lifecycle actions: created, approved, activated, paused, resumed,
   * credentials changed, broker changed, copy mode changed, risk changed, symbol changed.
   */
  async logClientAction(params: ClientAuditParams): Promise<void> {
    await this.log({
      ...params,
      entityType: params.entityType || 'CLIENT',
    });
  }

  /**
   * Trade lifecycle actions: copied, rejected, failed.
   */
  async logTradeAction(params: TradeAuditParams): Promise<void> {
    const tradeDetails: Record<string, unknown> = {
      ...(typeof params.details === 'object' && params.details !== null ? params.details : {}),
    };

    if (params.tradeId) tradeDetails.tradeId = params.tradeId;
    if (params.symbol) tradeDetails.symbol = params.symbol;
    if (params.side) tradeDetails.side = params.side;
    if (params.quantity !== undefined) tradeDetails.quantity = params.quantity;
    if (params.price !== undefined) tradeDetails.price = params.price;
    if (params.pnl !== undefined) tradeDetails.pnl = params.pnl;

    await this.log({
      entityType: 'TRADE',
      entityId: params.entityId ?? params.tradeId,
      clientId: params.clientId,
      action: params.action,
      performedBy: params.performedBy,
      role: params.role,
      details: tradeDetails,
      previousValue: params.previousValue,
      newValue: params.newValue,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      requestId: params.requestId,
      sessionId: params.sessionId,
    });
  }

  /**
   * Security events: kill switch, unauthorized access, credential rotation,
   * IP block, session invalidation, etc.
   */
  async logSecurityEvent(params: SecurityAuditParams): Promise<void> {
    const details: Record<string, unknown> = {
      ...(typeof params.details === 'object' && params.details !== null ? params.details : {}),
      severity: params.severity ?? 'INFO',
      eventType: 'SECURITY',
    };

    await this.log({
      entityType: 'SECURITY',
      action: params.action,
      performedBy: params.performedBy,
      details,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      requestId: params.requestId,
      sessionId: params.sessionId,
    });
  }

  /**
   * Config / settings changes with before/after values.
   */
  async logConfigChange(params: ConfigChangeParams): Promise<void> {
    await this.log({
      entityType: params.entityType,
      entityId: params.entityId,
      clientId: params.clientId,
      action: 'CONFIG_CHANGED',
      performedBy: params.changedBy,
      details: {
        field: params.field,
        reason: params.reason,
      },
      previousValue: { [params.field]: params.oldValue },
      newValue: { [params.field]: params.newValue },
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      requestId: params.requestId,
      sessionId: params.sessionId,
    });
  }

  /**
   * Structured audit trail retrieval with filters.
   */
  async getAuditTrail(filters: AuditTrailFilters): Promise<AuditLogEntry[]> {
    const where: Prisma.AuditLogWhereInput = {};

    if (filters.entityType) {
      where.entityType = filters.entityType;
    }
    if (filters.clientId) {
      where.clientId = filters.clientId;
    }
    if (filters.action) {
      where.action = filters.action;
    }
    if (filters.performedBy) {
      where.performedBy = filters.performedBy;
    }
    if (filters.from || filters.to) {
      where.createdAt = {};
      if (filters.from) {
        where.createdAt.gte = filters.from;
      }
      if (filters.to) {
        where.createdAt.lte = filters.to;
      }
    }

    const limit = filters.limit ?? 50;
    const offset = filters.offset ?? 0;

    return prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 500),
      skip: offset,
    });
  }

  /**
   * Full audit trail for a specific entity.
   */
  async getEntityAuditTrail(
    entityType: string,
    entityId: string,
  ): Promise<AuditLogEntry[]> {
    return prisma.auditLog.findMany({
      where: {
        entityType,
        entityId,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

// ── Singleton export ───────────────────────────────────────────────────────────

export const auditLog = AuditLogger.getInstance();
export { AuditLogger };
