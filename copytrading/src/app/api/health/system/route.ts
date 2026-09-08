import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiInternalError, apiUnauthorized } from '@/lib/api';
import { copyEngine } from '@/lib/copy-engine';
import { connectionMonitor } from '@/lib/connection-monitor';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return apiUnauthorized();
    }

    const engineStatus = copyEngine.getStatus();

    const masterAccountId = process.env.METAAPI_MASTER_ACCOUNT_ID;
    let masterConnected = false;
    if (masterAccountId) {
      try {
        const { metaApiService } = await import('@/lib/metaapi');
        const masterInfo = await metaApiService.getAccountInfo(masterAccountId);
        masterConnected = masterInfo !== null;
      } catch {
        masterConnected = false;
      }
    }

    let clientHealthSummary = {
      totalClients: 0,
      healthyClients: 0,
      unhealthyClients: 0,
      averageHealthScore: 0,
      oldestHeartbeat: null as Date | null,
      recentAlerts: 0,
    };
    try {
      clientHealthSummary = await connectionMonitor.getSystemHealthSummary();
    } catch {
      // graceful fallback
    }

    let metaApiStatus = 'unknown';
    try {
      const { metaApiService } = await import('@/lib/metaapi');
      if (masterAccountId) {
        const info = await metaApiService.getAccountInfo(masterAccountId);
        metaApiStatus = info ? 'connected' : 'degraded';
      } else {
        metaApiStatus = 'no_master_configured';
      }
    } catch {
      metaApiStatus = 'error';
    }

    let dbStatus = 'unknown';
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbStatus = 'connected';
    } catch {
      dbStatus = 'error';
    }

    const totalClients = await prisma.copyTradingClient.count();
    const activeClients = await prisma.copyTradingClient.count({
      where: {
        status: { in: ['copying', 'healthy', 'connected'] },
      },
    });

    return apiSuccess({
      engine: {
        isRunning: engineStatus.isRunning,
        lastSync: engineStatus.lastPollAt,
        totalPolls: engineStatus.totalPolls,
        totalErrors: engineStatus.totalErrors,
        currentCycleId: engineStatus.currentCycleId,
      },
      masterConnection: {
        configured: !!masterAccountId,
        connected: masterConnected,
      },
      clients: {
        total: totalClients,
        active: activeClients,
        health: clientHealthSummary,
      },
      metaApi: {
        status: metaApiStatus,
      },
      database: {
        status: dbStatus,
      },
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[System Health Error]', error);
    return apiInternalError();
  }
}
