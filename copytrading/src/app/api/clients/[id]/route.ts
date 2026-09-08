import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError, apiInternalError, apiUnauthorized } from '@/lib/api';
import { updateCopyConfigSchema } from '@/lib/validation';
import { auditLog } from '@/lib/audit';
import { getClientIp } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return apiUnauthorized();
    }

    const client = await prisma.copyTradingClient.findUnique({
      where: { id: params.id },
      include: {
        clientPositions: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        copyExecutions: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        alerts: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        configHistory: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!client) {
      return apiError('Client not found', 404);
    }

    return apiSuccess(client);
  } catch (error) {
    console.error('[Client Detail Error]', error);
    return apiInternalError();
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return apiUnauthorized();
    }

    const body = await request.json();
    const parsed = updateCopyConfigSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(parsed.error.errors.map((e) => e.message).join(', '));
    }

    const client = await prisma.copyTradingClient.findUnique({
      where: { id: params.id },
    });

    if (!client) {
      return apiError('Client not found', 404);
    }

    const updateData: Record<string, unknown> = {};
    const configChanges: { field: string; oldValue: string; newValue: string }[] = [];

    if (parsed.data.copyMode) {
      updateData.copyMode = parsed.data.copyMode;
      configChanges.push({ field: 'copyMode', oldValue: client.copyMode, newValue: parsed.data.copyMode });
    }
    if (parsed.data.lotRatio !== undefined) {
      updateData.lotRatio = parsed.data.lotRatio;
      configChanges.push({ field: 'lotRatio', oldValue: String(client.lotRatio), newValue: String(parsed.data.lotRatio) });
    }
    if (parsed.data.fixedLotSize !== undefined) {
      updateData.fixedLotSize = parsed.data.fixedLotSize;
      configChanges.push({ field: 'fixedLotSize', oldValue: String(client.fixedLotSize ?? ''), newValue: String(parsed.data.fixedLotSize) });
    }
    if (parsed.data.maxDrawdownPercent !== undefined) {
      updateData.maxDrawdownPercent = parsed.data.maxDrawdownPercent;
      configChanges.push({ field: 'maxDrawdownPercent', oldValue: String(client.maxDrawdownPercent), newValue: String(parsed.data.maxDrawdownPercent) });
    }
    if (parsed.data.maxDailyLossPercent !== undefined) {
      updateData.maxDailyLossPercent = parsed.data.maxDailyLossPercent;
      configChanges.push({ field: 'maxDailyLossPercent', oldValue: String(client.maxDailyLossPercent), newValue: String(parsed.data.maxDailyLossPercent) });
    }
    if (parsed.data.maxAccountLossPercent !== undefined) {
      updateData.maxAccountLossPercent = parsed.data.maxAccountLossPercent;
      configChanges.push({ field: 'maxAccountLossPercent', oldValue: String(client.maxAccountLossPercent), newValue: String(parsed.data.maxAccountLossPercent) });
    }
    if (parsed.data.maxExposurePercent !== undefined) {
      updateData.maxExposurePercent = parsed.data.maxExposurePercent;
      configChanges.push({ field: 'maxExposurePercent', oldValue: String(client.maxExposurePercent), newValue: String(parsed.data.maxExposurePercent) });
    }
    if (parsed.data.maxOpenPositions !== undefined) {
      updateData.maxOpenPositions = parsed.data.maxOpenPositions;
      configChanges.push({ field: 'maxOpenPositions', oldValue: String(client.maxOpenPositions), newValue: String(parsed.data.maxOpenPositions) });
    }
    if (parsed.data.maxSymbolExposurePercent !== undefined) {
      updateData.maxSymbolExposurePercent = parsed.data.maxSymbolExposurePercent;
      configChanges.push({ field: 'maxSymbolExposurePercent', oldValue: String(client.maxSymbolExposurePercent), newValue: String(parsed.data.maxSymbolExposurePercent) });
    }
    if (parsed.data.maxLeverage !== undefined) {
      updateData.maxLeverage = parsed.data.maxLeverage;
      configChanges.push({ field: 'maxLeverage', oldValue: String(client.maxLeverage), newValue: String(parsed.data.maxLeverage) });
    }
    if (parsed.data.maxSlippagePoints !== undefined) {
      updateData.maxSlippagePoints = parsed.data.maxSlippagePoints;
      configChanges.push({ field: 'maxSlippagePoints', oldValue: String(client.maxSlippagePoints), newValue: String(parsed.data.maxSlippagePoints) });
    }
    if (parsed.data.minEquity !== undefined) {
      updateData.minEquity = parsed.data.minEquity;
      configChanges.push({ field: 'minEquity', oldValue: String(client.minEquity), newValue: String(parsed.data.minEquity) });
    }
    if (parsed.data.allowedSymbols) {
      updateData.allowedSymbols = parsed.data.allowedSymbols;
      configChanges.push({ field: 'allowedSymbols', oldValue: client.allowedSymbols.join(','), newValue: parsed.data.allowedSymbols.join(',') });
    }
    if (parsed.data.status) {
      updateData.status = parsed.data.status;
      configChanges.push({ field: 'status', oldValue: client.status, newValue: parsed.data.status });
    }

    if (Object.keys(updateData).length === 0) {
      return apiError('No valid fields to update');
    }

    const updated = await prisma.copyTradingClient.update({
      where: { id: params.id },
      data: updateData,
    });

    for (const change of configChanges) {
      await prisma.clientConfigHistory.create({
        data: {
          clientId: params.id,
          field: change.field,
          oldValue: change.oldValue,
          newValue: change.newValue,
          changedBy: session.user.id,
        },
      });
    }

    await auditLog.log({
      entityType: 'client',
      entityId: params.id,
      clientId: params.id,
      action: 'client_config_updated',
      performedBy: session.user.id,
      role: session.user.role,
      details: JSON.stringify({ changes: configChanges.map((c) => c.field) }),
      previousValue: JSON.stringify(
        Object.fromEntries(configChanges.map((c) => [c.field, c.oldValue])),
      ),
      newValue: JSON.stringify(
        Object.fromEntries(configChanges.map((c) => [c.field, c.newValue])),
      ),
      ipAddress: getClientIp(request),
    });

    return apiSuccess(updated);
  } catch (error) {
    console.error('[Update Client Error]', error);
    return apiInternalError();
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return apiUnauthorized();
    }

    const client = await prisma.copyTradingClient.findUnique({
      where: { id: params.id },
    });

    if (!client) {
      return apiError('Client not found', 404);
    }

    await prisma.copyTradingClient.update({
      where: { id: params.id },
      data: {
        status: 'closed',
        previousStatus: client.status,
        statusChangedAt: new Date(),
        statusChangeReason: `Soft-removed by ${session.user.id}`,
        statusChangedBy: session.user.id,
      },
    });

    const openPositions = await prisma.clientPosition.findMany({
      where: { clientId: params.id, status: 'open' },
    });

    for (const pos of openPositions) {
      if (pos.metaApiPositionId && client.metaApiAccountId) {
        const { metaApiService } = await import('@/lib/metaapi');
        await metaApiService.closePosition(client.metaApiAccountId, pos.metaApiPositionId);
      }
      await prisma.clientPosition.update({
        where: { id: pos.id },
        data: { status: 'closed' },
      });
    }

    await auditLog.logClientAction({
      entityType: 'CLIENT',
      clientId: params.id,
      action: 'client_soft_removed',
      performedBy: session.user.id,
      role: session.user.role,
      details: {
        clientRef: client.clientRef,
        closedPositions: openPositions.length,
        previousStatus: client.status,
      },
      ipAddress: getClientIp(request),
    });

    return apiSuccess({ message: 'Client soft-removed', closedPositions: openPositions.length });
  } catch (error) {
    console.error('[Delete Client Error]', error);
    return apiInternalError();
  }
}
