import { prisma } from './prisma';

export type KillSwitchScope = 'global' | 'per_client' | 'per_symbol' | 'per_strategy';

export interface ActivateParams {
  name: string;
  description?: string;
  scope: KillSwitchScope;
  targetClientId?: string;
  targetSymbol?: string;
  targetStrategy?: string;
  activatedBy: string;
  reason: string;
}

export interface KillSwitchRecord {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  scope: KillSwitchScope;
  targetClientId: string | null;
  targetSymbol: string | null;
  targetStrategy: string | null;
  activatedBy: string | null;
  activatedAt: Date | null;
  deactivatedBy: string | null;
  deactivatedAt: Date | null;
  reason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface KillSwitchStatus {
  engineRunning: boolean;
  globalKillActive: boolean;
  activeSwitches: KillSwitchRecord[];
  blockedClients: string[];
  blockedSymbols: string[];
}

const AUTHORIZED_ROLES = new Set(['super_admin', 'admin', 'risk_manager']);

class KillSwitchClass {
  private static instance: KillSwitchClass;
  private engineStopped = false;

  static getInstance(): KillSwitchClass {
    if (!KillSwitchClass.instance) {
      KillSwitchClass.instance = new KillSwitchClass();
    }
    return KillSwitchClass.instance;
  }

  private validateRole(activatedBy: string, role?: string): void {
    if (!role || !AUTHORIZED_ROLES.has(role)) {
      throw new Error(
        `Unauthorized: user "${activatedBy}" with role "${role || 'unknown'}" cannot manage kill switches. Required: super_admin, admin, or risk_manager.`
      );
    }
  }

  private validateParams(params: ActivateParams): void {
    if (!params.name || params.name.trim().length === 0) {
      throw new Error('Kill switch name is required');
    }
    if (!params.reason || params.reason.trim().length === 0) {
      throw new Error('Reason is required for activating a kill switch');
    }
    if (!params.activatedBy || params.activatedBy.trim().length === 0) {
      throw new Error('activatedBy is required');
    }

    switch (params.scope) {
      case 'per_client':
        if (!params.targetClientId) {
          throw new Error('targetClientId is required for per_client scope');
        }
        break;
      case 'per_symbol':
        if (!params.targetSymbol) {
          throw new Error('targetSymbol is required for per_symbol scope');
        }
        break;
      case 'per_strategy':
        if (!params.targetStrategy) {
          throw new Error('targetStrategy is required for per_strategy scope');
        }
        break;
      case 'global':
        break;
      default:
        throw new Error(`Invalid scope: ${params.scope}`);
    }
  }

  private async writeAuditLog(params: {
    action: string;
    performedBy: string;
    details: string;
    previousValue?: string;
    newValue?: string;
  }): Promise<void> {
    await prisma.auditLog.create({
      data: {
        entityType: 'kill_switch',
        action: params.action,
        performedBy: params.performedBy,
        details: params.details,
        previousValue: params.previousValue,
        newValue: params.newValue,
      },
    });
  }

  async isTradingAllowed(clientId?: string, symbol?: string): Promise<boolean> {
    if (this.engineStopped) {
      return false;
    }

    const activeSwitches = await prisma.killSwitch.findMany({
      where: { isActive: true },
    });

    if (activeSwitches.length === 0) {
      return true;
    }

    for (const sw of activeSwitches) {
      if (sw.scope === 'global') {
        return false;
      }

      if (sw.scope === 'per_client' && clientId && sw.targetClientId === clientId) {
        return false;
      }

      if (sw.scope === 'per_symbol' && symbol && sw.targetSymbol === symbol) {
        return false;
      }
    }

    return true;
  }

  async activate(params: ActivateParams, role?: string): Promise<void> {
    this.validateRole(params.activatedBy, role);
    this.validateParams(params);

    const existing = await prisma.killSwitch.findUnique({
      where: { name: params.name },
    });

    if (existing?.isActive) {
      throw new Error(`Kill switch "${params.name}" is already active`);
    }

    const now = new Date();

    if (existing) {
      await prisma.killSwitch.update({
        where: { name: params.name },
        data: {
          isActive: true,
          scope: params.scope,
          targetClientId: params.targetClientId || null,
          targetSymbol: params.targetSymbol || null,
          targetStrategy: params.targetStrategy || null,
          activatedBy: params.activatedBy,
          activatedAt: now,
          deactivatedBy: null,
          deactivatedAt: null,
          reason: params.reason,
          description: params.description || existing.description,
        },
      });
    } else {
      await prisma.killSwitch.create({
        data: {
          name: params.name,
          description: params.description || null,
          isActive: true,
          scope: params.scope,
          targetClientId: params.targetClientId || null,
          targetSymbol: params.targetSymbol || null,
          targetStrategy: params.targetStrategy || null,
          activatedBy: params.activatedBy,
          activatedAt: now,
          reason: params.reason,
        },
      });
    }

    await this.writeAuditLog({
      action: 'kill_switch_activated',
      performedBy: params.activatedBy,
      details: `Activated kill switch "${params.name}" (scope: ${params.scope}) — ${params.reason}`,
      newValue: JSON.stringify({
        name: params.name,
        scope: params.scope,
        targetClientId: params.targetClientId,
        targetSymbol: params.targetSymbol,
        targetStrategy: params.targetStrategy,
        reason: params.reason,
      }),
    });

    console.log(
      `[KillSwitch] ACTIVATED "${params.name}" by ${params.activatedBy} — ${params.reason}`
    );

    if (params.scope === 'global') {
      this.engineStopped = true;
      console.log('[KillSwitch] GLOBAL KILL — engine stopped');
    }
  }

  async deactivate(
    name: string,
    deactivatedBy: string,
    reason: string,
    role?: string
  ): Promise<void> {
    this.validateRole(deactivatedBy, role);

    if (!reason || reason.trim().length === 0) {
      throw new Error('Reason is required for deactivating a kill switch');
    }

    const existing = await prisma.killSwitch.findUnique({
      where: { name },
    });

    if (!existing) {
      throw new Error(`Kill switch "${name}" not found`);
    }

    if (!existing.isActive) {
      throw new Error(`Kill switch "${name}" is already inactive`);
    }

    const now = new Date();

    await prisma.killSwitch.update({
      where: { name },
      data: {
        isActive: false,
        deactivatedBy,
        deactivatedAt: now,
        reason,
      },
    });

    await this.writeAuditLog({
      action: 'kill_switch_deactivated',
      performedBy: deactivatedBy,
      details: `Deactivated kill switch "${name}" — ${reason}`,
      previousValue: JSON.stringify({
        activatedBy: existing.activatedBy,
        activatedAt: existing.activatedAt,
        reason: existing.reason,
      }),
      newValue: JSON.stringify({
        deactivatedBy,
        deactivatedAt: now.toISOString(),
        reason,
      }),
    });

    console.log(
      `[KillSwitch] DEACTIVATED "${name}" by ${deactivatedBy} — ${reason}`
    );

    if (existing.scope === 'global') {
      const anyGlobalActive = await prisma.killSwitch.findFirst({
        where: { isActive: true, scope: 'global' },
      });
      if (!anyGlobalActive) {
        this.engineStopped = false;
        console.log('[KillSwitch] Engine resumed');
      }
    }
  }

  async stopEngine(
    deactivatedBy: string,
    reason: string,
    role?: string
  ): Promise<void> {
    this.validateRole(deactivatedBy, role);

    if (!reason || reason.trim().length === 0) {
      throw new Error('Reason is required to stop the engine');
    }

    this.engineStopped = true;

    await this.writeAuditLog({
      action: 'engine_stopped',
      performedBy: deactivatedBy,
      details: `Engine stopped — ${reason}`,
    });

    console.log(`[KillSwitch] Engine STOPPED by ${deactivatedBy} — ${reason}`);
  }

  async resumeEngine(
    resumedBy: string,
    reason: string,
    role?: string
  ): Promise<void> {
    this.validateRole(resumedBy, role);

    if (!reason || reason.trim().length === 0) {
      throw new Error('Reason is required to resume the engine');
    }

    const globalActive = await prisma.killSwitch.findFirst({
      where: { isActive: true, scope: 'global' },
    });

    if (globalActive) {
      throw new Error(
        `Cannot resume engine: global kill switch "${globalActive.name}" is still active. Deactivate it first.`
      );
    }

    this.engineStopped = false;

    await this.writeAuditLog({
      action: 'engine_resumed',
      performedBy: resumedBy,
      details: `Engine resumed — ${reason}`,
    });

    console.log(`[KillSwitch] Engine RESUMED by ${resumedBy} — ${reason}`);
  }

  async getActiveSwitches(): Promise<KillSwitchRecord[]> {
    const switches = await prisma.killSwitch.findMany({
      where: { isActive: true },
      orderBy: { activatedAt: 'desc' },
    });
    return switches as KillSwitchRecord[];
  }

  async getStatus(): Promise<KillSwitchStatus> {
    const activeSwitches = await this.getActiveSwitches();

    const globalKillActive = activeSwitches.some((s) => s.scope === 'global');
    const blockedClients = activeSwitches
      .filter((s) => s.scope === 'per_client' && s.targetClientId)
      .map((s) => s.targetClientId!);
    const blockedSymbols = activeSwitches
      .filter((s) => s.scope === 'per_symbol' && s.targetSymbol)
      .map((s) => s.targetSymbol!);

    return {
      engineRunning: !this.engineStopped,
      globalKillActive,
      activeSwitches,
      blockedClients: [...new Set(blockedClients)],
      blockedSymbols: [...new Set(blockedSymbols)],
    };
  }
}

export const killSwitch = KillSwitchClass.getInstance();
