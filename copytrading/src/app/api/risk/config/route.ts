import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { apiSuccess, apiError, apiInternalError, apiUnauthorized, apiForbidden } from '@/lib/api';
import { updateRiskConfigSchema } from '@/lib/validation';
import { auditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const DEFAULT_RISK_CONFIG = {
  id: 'default',
  maxDrawdownPercent: 10,
  maxDailyLossPercent: 5,
  maxAccountLossPercent: 20,
  maxExposurePercent: 50,
  maxOpenPositions: 20,
  maxSymbolExposurePercent: 20,
  maxLeverage: 100,
  maxSlippagePoints: 5,
  minEquity: 100,
  updatedAt: new Date(),
};

let currentRiskConfig = { ...DEFAULT_RISK_CONFIG };

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return apiUnauthorized();
    }

    return apiSuccess(currentRiskConfig);
  } catch (error) {
    console.error('[Risk Config GET Error]', error);
    return apiInternalError();
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return apiUnauthorized();
    }

    if (!session.user.permissions?.includes('CHANGE_RISK')) {
      return apiForbidden();
    }

    const body = await request.json();
    const parsed = updateRiskConfigSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(parsed.error.errors.map((e) => e.message).join(', '));
    }

    const previousSnapshot = { ...currentRiskConfig };

    currentRiskConfig = {
      ...currentRiskConfig,
      ...parsed.data,
      updatedAt: new Date(),
    };

    const changedFields = Object.keys(parsed.data).filter(
      (key) => (parsed.data as Record<string, unknown>)[key] !== undefined,
    );

    for (const field of changedFields) {
      await auditLog.logConfigChange({
        entityType: 'risk_config',
        entityId: 'default',
        field,
        oldValue: (previousSnapshot as Record<string, unknown>)[field],
        newValue: (parsed.data as Record<string, unknown>)[field],
        changedBy: session.user.id,
      });
    }

    await auditLog.log({
      entityType: 'risk_config',
      entityId: 'default',
      action: 'risk_config_updated',
      performedBy: session.user.id,
      role: session.user.role,
      details: JSON.stringify(parsed.data),
    });

    return apiSuccess(currentRiskConfig);
  } catch (error) {
    console.error('[Risk Config PATCH Error]', error);
    return apiInternalError();
  }
}
