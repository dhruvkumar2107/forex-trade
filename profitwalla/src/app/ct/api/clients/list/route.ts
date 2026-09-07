import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiInternalError, apiUnauthorized } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return apiUnauthorized();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const health = searchParams.get('health');

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { clientRef: { contains: search } },
        { mt5AccountNumber: { contains: search } },
      ];
    }
    if (health && health !== 'all') {
      where.connectionHealth = health;
    }

    const clients = await prisma.copyTradingClient.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, clientRef: true, mt5AccountNumber: true, brokerServer: true,
        copyMode: true, lotRatio: true, maxDrawdownPercent: true, symbolWhitelist: true,
        isActive: true, isPaused: true, connectionHealth: true, lastTradeSyncAt: true,
        equityAtStart: true, currentEquity: true, totalPnL: true, tradesCopied: true,
        createdAt: true,
      },
    });

    return apiSuccess(clients);
  } catch (error) {
    console.error('[List Clients Error]', error);
    return apiInternalError();
  }
}
