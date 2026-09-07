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
    const clientId = searchParams.get('clientId');
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {};
    if (clientId) where.clientId = clientId;
    if (status) where.status = status;

    const trades = await prisma.tradeEvent.findMany({
      where,
      include: { client: { select: { mt5AccountNumber: true, clientRef: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return apiSuccess(trades);
  } catch (error) {
    console.error('[Trades List Error]', error);
    return apiInternalError();
  }
}
