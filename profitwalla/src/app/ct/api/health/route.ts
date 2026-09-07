import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiInternalError } from '@/lib/api';
import { metaApiService } from '@/lib/metaapi';

export async function GET(_request: NextRequest) {
  try {
    const clients = await prisma.copyTradingClient.findMany({
      where: { isActive: true },
      select: { id: true, metaApiAccountId: true },
    });

    const results = [];
    for (const client of clients) {
      if (client.metaApiAccountId) {
        const info = await metaApiService.getAccountInfo(client.metaApiAccountId);
        const health = info ? 'healthy' : 'disconnected';
        await prisma.copyTradingClient.update({
          where: { id: client.id },
          data: { connectionHealth: health, lastHealthCheckAt: new Date() },
        });
        results.push({ clientId: client.id, health, equity: info?.equity || null });
      }
    }

    return apiSuccess({ checked: results.length, results });
  } catch (error) {
    console.error('[Health Check Error]', error);
    return apiInternalError();
  }
}
