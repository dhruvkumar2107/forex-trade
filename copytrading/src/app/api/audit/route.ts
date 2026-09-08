import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { apiSuccess, apiError, apiInternalError, apiUnauthorized, apiForbidden } from '@/lib/api';
import { auditLog } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return apiUnauthorized();
    }

    if (!session.user.permissions?.includes('VIEW_AUDIT')) {
      return apiForbidden();
    }

    const { searchParams } = new URL(request.url);

    const entityType = searchParams.get('entityType') ?? undefined;
    const clientId = searchParams.get('clientId') ?? undefined;
    const action = searchParams.get('action') ?? undefined;
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');

    const from = fromParam ? new Date(fromParam) : undefined;
    const to = toParam ? new Date(toParam) : undefined;
    const limit = limitParam ? parseInt(limitParam, 10) : 50;
    const offset = offsetParam ? parseInt(offsetParam, 10) : 0;

    if (limit < 1 || limit > 500) {
      return apiError('limit must be between 1 and 500');
    }
    if (offset < 0) {
      return apiError('offset must be non-negative');
    }
    if (from && to && from > to) {
      return apiError('from must be before to');
    }

    const entries = await auditLog.getAuditTrail({
      entityType,
      clientId,
      action,
      from,
      to,
      limit,
      offset,
    });

    return apiSuccess({
      entries,
      limit,
      offset,
    });
  } catch (error) {
    console.error('[Audit GET Error]', error);
    return apiInternalError();
  }
}
