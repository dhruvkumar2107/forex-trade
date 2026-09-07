import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { metaApiService } from '@/lib/metaapi';
import { apiSuccess, apiInternalError } from '@/lib/api';

function apiError(message: string, status = 400) {
  return Response.json({ success: false, error: message }, { status });
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return apiError('Unauthorized', 401);
    }

    const clients = await prisma.copyTradingClient.findMany({
      where: { isActive: true, metaApiAccountId: { not: null } },
      select: { id: true, metaApiAccountId: true },
    });

    const results = [];
    for (const client of clients) {
      if (!client.metaApiAccountId) continue;
      const info = await metaApiService.getAccountInfo(client.metaApiAccountId);
      const health = info ? 'healthy' : 'disconnected';
      await prisma.copyTradingClient.update({
        where: { id: client.id },
        data: { connectionHealth: health, lastHealthCheckAt: new Date() },
      });
      results.push({ clientId: client.id, health, equity: info?.equity || null });
    }

    return apiSuccess({ checked: results.length, results, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('[Cron Health Error]', error);
    return apiInternalError();
  }
}
