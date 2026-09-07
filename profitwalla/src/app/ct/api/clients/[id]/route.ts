import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError, apiInternalError, apiUnauthorized } from '@/lib/api';
import { updateCopyConfigSchema } from '@/lib/validation';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return apiUnauthorized();

    const client = await prisma.copyTradingClient.findUnique({
      where: { id: params.id },
      include: {
        tradeEvents: { orderBy: { createdAt: 'desc' }, take: 50 },
        alerts: { orderBy: { createdAt: 'desc' }, take: 20 },
        clientConfigs: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });

    if (!client) return apiError('Client not found', 404);
    return apiSuccess(client);
  } catch (error) {
    console.error('[Client Detail Error]', error);
    return apiInternalError();
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return apiUnauthorized();

    const body = await request.json();
    const parsed = updateCopyConfigSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.errors.map((e) => e.message).join(', '));
    }

    const client = await prisma.copyTradingClient.findUnique({ where: { id: params.id } });
    if (!client) return apiError('Client not found', 404);

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
    if (parsed.data.maxDrawdownPercent !== undefined) {
      updateData.maxDrawdownPercent = parsed.data.maxDrawdownPercent;
      configChanges.push({ field: 'maxDrawdownPercent', oldValue: String(client.maxDrawdownPercent), newValue: String(parsed.data.maxDrawdownPercent) });
    }
    if (parsed.data.symbolWhitelist) {
      updateData.symbolWhitelist = parsed.data.symbolWhitelist;
      configChanges.push({ field: 'symbolWhitelist', oldValue: client.symbolWhitelist.join(','), newValue: parsed.data.symbolWhitelist.join(',') });
    }
    if (parsed.data.isPaused !== undefined) {
      updateData.isPaused = parsed.data.isPaused;
      configChanges.push({ field: 'isPaused', oldValue: String(client.isPaused), newValue: String(parsed.data.isPaused) });
    }

    const updated = await prisma.copyTradingClient.update({ where: { id: params.id }, data: updateData });

    for (const change of configChanges) {
      await prisma.clientConfigHistory.create({
        data: { clientId: params.id, field: change.field, oldValue: change.oldValue, newValue: change.newValue, changedBy: 'staff' },
      });
    }

    return apiSuccess(updated);
  } catch (error) {
    console.error('[Update Client Error]', error);
    return apiInternalError();
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return apiUnauthorized();

    const client = await prisma.copyTradingClient.findUnique({ where: { id: params.id } });
    if (!client) return apiError('Client not found', 404);

    await prisma.copyTradingClient.update({
      where: { id: params.id },
      data: { isActive: false, connectionHealth: 'disconnected' },
    });

    if (client.metaApiAccountId) {
      const { metaApiService } = await import('@/lib/metaapi');
      const openTrades = await prisma.tradeEvent.findMany({
        where: { clientId: params.id, status: 'open' },
      });
      for (const trade of openTrades) {
        if (trade.metaApiTradeId) {
          await metaApiService.closeTrade(client.metaApiAccountId, trade.metaApiTradeId);
          await prisma.tradeEvent.update({ where: { id: trade.id }, data: { status: 'closed' } });
        }
      }
    }

    return apiSuccess({ message: 'Client disconnected' });
  } catch (error) {
    console.error('[Delete Client Error]', error);
    return apiInternalError();
  }
}
