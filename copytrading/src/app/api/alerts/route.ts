import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiInternalError, apiUnauthorized } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return apiUnauthorized();
    }

    const { searchParams } = new URL(request.url);
    const resolved = searchParams.get('resolved');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: Record<string, unknown> = {};
    if (resolved !== null && resolved !== undefined) {
      where.resolved = resolved === 'true';
    }

    const alerts = await prisma.copyTradeAlert.findMany({
      where,
      include: {
        client: { select: { mt5AccountNumber: true, clientRef: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return apiSuccess(alerts);
  } catch (error) {
    console.error('[Alerts List Error]', error);
    return apiInternalError();
  }
}
