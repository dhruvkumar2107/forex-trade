import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { verifyInterSystemAuth, apiSuccess, apiError, apiInternalError, apiUnauthorized } from '@/lib/api';
import { copyEngine } from '@/lib/copy-engine';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const isInterSystem = verifyInterSystemAuth(request);

  if (!isInterSystem) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return apiUnauthorized();
    }
  }

  const status = await copyEngine.getStatus();
  return apiSuccess({
    isRunning: status.isRunning,
    lastSync: status.lastPollAt,
    clientsActive: status.activeClients,
    masterConnected: status.masterAccountId !== null,
    pollIntervalMs: status.pollIntervalMs,
    totalPolls: status.totalPolls,
    totalErrors: status.totalErrors,
    totalPositionChanges: status.totalPositionChanges,
    totalClientExecutions: status.totalClientExecutions,
    currentCycleId: status.currentCycleId,
  });
}

export async function POST(request: NextRequest) {
  const isInterSystem = verifyInterSystemAuth(request);

  if (!isInterSystem) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return apiUnauthorized();
    }
  }

  try {
    const body = await request.json();
    const { action } = body as { action: 'start' | 'stop' };

    if (!action || !['start', 'stop'].includes(action)) {
      return apiError('Invalid action. Must be "start" or "stop".');
    }

    if (action === 'start') {
      await copyEngine.start();
      return apiSuccess({
        message: 'Copy engine started',
        ...(await copyEngine.getStatus()),
      });
    }

    copyEngine.stop();
    return apiSuccess({
      message: 'Copy engine stopped',
      ...(await copyEngine.getStatus()),
    });
  } catch (error) {
    console.error('[Engine Control Error]', error);
    return apiInternalError();
  }
}
