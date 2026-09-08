import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError, apiInternalError, apiUnauthorized } from '@/lib/api';
import { reconciliation } from '@/lib/reconciliation';
import { resolveReconciliationSchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return apiUnauthorized();
    }

    const unresolved = await reconciliation.getUnresolved();

    const totalPending = await prisma.reconciliationLog.count({
      where: { resolution: 'pending' } as any,
    });

    return apiSuccess({
      totalPending,
      unresolved,
    });
  } catch (error) {
    console.error('[Reconciliation GET Error]', error);
    return apiInternalError();
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return apiUnauthorized();
    }

    const body = await request.json();
    const { clientId } = body as { clientId?: string };

    let report;
    if (clientId) {
      const result = await reconciliation.runClientReconciliation(clientId);
      report = {
        type: 'single_client',
        result,
      };
    } else {
      report = await reconciliation.runFullReconciliation();
    }

    return apiSuccess(report);
  } catch (error) {
    console.error('[Reconciliation POST Error]', error);
    const message = error instanceof Error ? error.message : 'Reconciliation failed';
    return apiError(message);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return apiUnauthorized();
    }

    const body = await request.json();
    const parsed = resolveReconciliationSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(parsed.error.errors.map((e) => e.message).join(', '));
    }

    await reconciliation.resolve(
      parsed.data.logId,
      parsed.data.resolution,
      parsed.data.notes,
      session.user.id,
    );

    return apiSuccess({ message: 'Mismatch resolved' });
  } catch (error) {
    console.error('[Reconciliation PATCH Error]', error);
    const message = error instanceof Error ? error.message : 'Failed to resolve mismatch';
    return apiError(message);
  }
}
