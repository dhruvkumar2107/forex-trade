import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError, apiInternalError, apiUnauthorized } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return apiUnauthorized();
    }

    const body = await request.json();
    const { ids, status } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return apiError('Client IDs are required');
    }

    if (!status || !['submitted', 'reviewing', 'approved', 'rejected'].includes(status)) {
      return apiError('Invalid status');
    }

    const result = await prisma.client.updateMany({
      where: { id: { in: ids } },
      data: { status },
    });

    await prisma.auditLog.createMany({
      data: ids.map((id: string) => ({
        clientId: id,
        action: `bulk_status_changed_to_${status}`,
        performedBy: session.user.email || 'unknown',
        details: `Bulk status update to ${status}`,
      })),
    });

    return apiSuccess({ updated: result.count });
  } catch (error) {
    console.error('[Bulk Update Error]', error);
    return apiInternalError();
  }
}
