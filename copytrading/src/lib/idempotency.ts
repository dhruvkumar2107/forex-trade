import { prisma } from './prisma';
import { TradeState, type CopyExecution } from '@prisma/client';

/**
 * Idempotency module for the copy trading system.
 *
 * Strategy:
 * - Each master trade event is identified by a deterministic key:
 *   `{clientId}:{masterTradeId}:{timestamp}` where `timestamp` is the
 *   signal time in ISO-8601 (seconds precision) or an optional override.
 * - Before executing a trade, `acquireLock` attempts to create or transition
 *   a `CopyExecution` row into `detected` state.  Concurrent callers race on
 *   the unique `idempotencyKey` constraint; only the winner proceeds.
 * - The row is then moved through `detected → executing → verified/failed`
 *   while `stateChangedAt` tracks transitions.
 * - Stale rows stuck in `detected` for longer than `STALE_TIMEOUT_MS`
 *   (default 5 min) are reclaimed by `cleanupStale` so the event can be
 *   retried.
 */

const DEFAULT_STALE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

/** Processing states that indicate the event is actively being handled. */
const ACTIVE_STATES: TradeState[] = [
  TradeState.detected,
  TradeState.validating,
  TradeState.risk_check,
  TradeState.queued,
  TradeState.executing,
  TradeState.broker_acknowledged,
  TradeState.retrying,
];

/** States that indicate terminal success. */
const SUCCESS_STATES: TradeState[] = [
  TradeState.verified,
  TradeState.reconciled,
];

/** States that indicate terminal failure. */
const FAILED_STATES: TradeState[] = [
  TradeState.rejected,
  TradeState.risk_blocked,
  TradeState.broker_error,
  TradeState.timeout,
  TradeState.failed,
];

export class Idempotency {
  /**
   * Generate a deterministic idempotency key from the components of a
   * master trade event.  The key is scoped per client so the same master
   * trade copied to different clients produces distinct keys.
   *
   * @param clientId       Unique client identifier (CopyTradingClient.id)
   * @param masterTradeId  Unique master trade identifier (e.g. MetaApi position id)
   * @param timestamp      Optional ISO-8601 timestamp; defaults to now (seconds precision)
   */
  generateKey(clientId: string, masterTradeId: string, timestamp?: string): string {
    const ts = timestamp ?? new Date().toISOString();
    // Truncate to second precision to avoid sub-second duplicates
    const secondTs = ts.replace(/\.\d{3}Z$/, '.000Z');
    return `${clientId}:${masterTradeId}:${secondTs}`;
  }

  /**
   * Attempt to acquire a processing lock for a given idempotency key.
   *
   * Race-condition handling:
   *  1. Try to find an existing row by the unique key.
   *  2. If none exists, INSERT a new row in `detected` state — the unique
   *     constraint guarantees only one insert succeeds per key.
   *  3. If one already exists and is in an active state, return it as-is
   *     (the caller did NOT acquire the lock — another process owns it).
   *  4. If it exists in a terminal state (success or failed), return the
   *     existing row so the caller can inspect the outcome.
   *
   * @returns `{ acquired: true }` when this process should proceed, or
   *          `{ acquired: false, existingExecution }` when the event was
   *          already handled or is being handled.
   */
  async acquireLock(
    key: string,
    clientId: string,
    masterTradeId: string,
    symbol: string,
    direction: string,
    volume: number,
    masterEntryPrice: number,
  ): Promise<{ acquired: boolean; existingExecution?: CopyExecution }> {
    // Fast path — check for an existing row first to avoid unnecessary inserts.
    const existing = await prisma.copyExecution.findUnique({ where: { idempotencyKey: key } });

    if (existing) {
      // Already completed or failed — return the terminal state.
      if (SUCCESS_STATES.includes(existing.state) || FAILED_STATES.includes(existing.state)) {
        return { acquired: false, existingExecution: existing };
      }
      // Still actively being processed by another process.
      if (ACTIVE_STATES.includes(existing.state)) {
        return { acquired: false, existingExecution: existing };
      }
      // State is in an unexpected transitional state (e.g. partial, mismatch).
      // Treat as non-acquirable; the caller should not overwrite.
      return { acquired: false, existingExecution: existing };
    }

    // No existing row — attempt insert with `detected` state.
    // If two processes race, the unique constraint on `idempotencyKey`
    // ensures exactly one succeeds and the other gets a P2002 error.
    try {
      const created = await prisma.copyExecution.create({
        data: {
          idempotencyKey: key,
          clientId,
          masterAccountId: null,
          masterPositionId: null,
          symbol,
          direction,
          requestedVolume: volume,
          masterEntryPrice,
          state: TradeState.detected,
          signalTime: new Date(),
          stateChangedAt: new Date(),
        },
      });
      return { acquired: true, existingExecution: created };
    } catch (error: unknown) {
      // P2002 = unique constraint violation — another process inserted first.
      if (isPrismaUniqueViolation(error)) {
        const concurrent = await prisma.copyExecution.findUnique({ where: { idempotencyKey: key } });
        return { acquired: false, existingExecution: concurrent ?? undefined };
      }
      throw error;
    }
  }

  /**
   * Transition a row from `detected` → `executing`.  This is a second
   * gate: even if `acquireLock` succeeded, the process may have been
   * preempted before this call.  The conditional update ensures only
   * the current owner can advance the state.
   */
  async markProcessing(key: string): Promise<void> {
    const now = new Date();
    const result = await prisma.copyExecution.updateMany({
      where: {
        idempotencyKey: key,
        state: TradeState.detected,
      },
      data: {
        state: TradeState.executing,
        previousState: TradeState.detected,
        stateChangedAt: now,
        executionStartTime: now,
      },
    });

    if (result.count === 0) {
      throw new IdempotencyError(
        `Cannot transition to executing: row not in detected state (key=${key})`,
      );
    }
  }

  /**
   * Transition to `verified` — the trade was successfully placed and
   * confirmed by the broker.
   */
  async markCompleted(key: string): Promise<void> {
    const now = new Date();
    const result = await prisma.copyExecution.updateMany({
      where: {
        idempotencyKey: key,
        state: TradeState.executing,
      },
      data: {
        state: TradeState.verified,
        previousState: TradeState.executing,
        stateChangedAt: now,
        completionTime: now,
      },
    });

    if (result.count === 0) {
      throw new IdempotencyError(
        `Cannot mark completed: row not in executing state (key=${key})`,
      );
    }
  }

  /**
   * Transition to `failed` with an error message.  Does not require
   * the row to be in any specific source state so it can be called
   * as a catch-all cleanup from any processing stage.
   */
  async markFailed(key: string, error: string): Promise<void> {
    const now = new Date();
    await prisma.copyExecution.updateMany({
      where: { idempotencyKey: key },
      data: {
        state: TradeState.failed,
        previousState: undefined,
        stateChangedAt: now,
        completionTime: now,
        error,
        errorMessage: error,
      },
    });
  }

  /**
   * Check whether an event has already been processed and return its
   * current state.  Useful for pre-flight checks before queuing work.
   */
  async checkExisting(
    key: string,
  ): Promise<{ exists: boolean; state?: TradeState; execution?: CopyExecution }> {
    const execution = await prisma.copyExecution.findUnique({ where: { idempotencyKey: key } });
    if (!execution) {
      return { exists: false };
    }
    return { exists: true, state: execution.state, execution };
  }

  /**
   * Reclaim rows that are stuck in an active state for longer than
   * `maxAgeMs`.  Stale rows typically indicate a process crashed or
   * lost connectivity mid-execution.
   *
   * Strategy:
   *  - Find all rows in active states whose `stateChangedAt` is older
   *    than `now - maxAgeMs`.
   *  - Transition them to `timeout` so they can be retried by a fresh
   *    processing cycle.
   *
   * @returns The number of stale rows reclaimed.
   */
  async cleanupStale(maxAgeMs: number = DEFAULT_STALE_TIMEOUT_MS): Promise<number> {
    const cutoff = new Date(Date.now() - maxAgeMs);

    const result = await prisma.copyExecution.updateMany({
      where: {
        state: { in: ACTIVE_STATES },
        stateChangedAt: { lt: cutoff },
      },
      data: {
        state: TradeState.timeout,
        previousState: undefined,
        stateChangedAt: new Date(),
        error: `Stale processing state cleaned up after ${maxAgeMs}ms`,
        errorMessage: 'PROCESSING_TIMEOUT',
      },
    });

    return result.count;
  }

  /**
   * Convenience: generate a key and acquire the lock in one call.
   * Returns the key alongside the lock result so the caller doesn't
   * need to manage key generation separately.
   */
  async tryAcquire(
    clientId: string,
    masterTradeId: string,
    params: {
      symbol: string;
      direction: string;
      volume: number;
      masterEntryPrice: number;
      timestamp?: string;
    },
  ): Promise<{
    key: string;
    acquired: boolean;
    existingExecution?: CopyExecution;
  }> {
    const key = this.generateKey(clientId, masterTradeId, params.timestamp);
    const result = await this.acquireLock(
      key,
      clientId,
      masterTradeId,
      params.symbol,
      params.direction,
      params.volume,
      params.masterEntryPrice,
    );
    return { key, ...result };
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

class IdempotencyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IdempotencyError';
  }
}

function isPrismaUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: string }).code === 'P2002'
  );
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

export const idempotency = new Idempotency();
