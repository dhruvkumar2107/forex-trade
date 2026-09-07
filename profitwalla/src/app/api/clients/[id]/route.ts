import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError, apiInternalError, apiUnauthorized, getClientIp } from '@/lib/api';
import { adminUpdateClientSchema } from '@/lib/validation';
import { maskPassword } from '@/lib/encryption';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return apiUnauthorized();
    }

    const client = await prisma.client.findUnique({
      where: { id: params.id },
      include: {
        auditLogs: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!client) {
      return apiError('Client not found', 404);
    }

    await prisma.auditLog.create({
      data: {
        clientId: client.id,
        action: 'view_client_details',
        performedBy: session.user.email || 'unknown',
        details: 'Viewed client details in admin panel',
        ipAddress: getClientIp(request),
      },
    });

    return apiSuccess({
      ...client,
      mt5InvestorPasswordEnc: undefined,
      mt5InvestorPasswordIv: undefined,
      mt5InvestorPasswordMasked: maskPassword(client.mt5InvestorPasswordEnc),
    });
  } catch (error) {
    console.error('[Admin Detail Error]', error);
    return apiInternalError();
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return apiUnauthorized();
    }

    const body = await request.json();
    const parsed = adminUpdateClientSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(parsed.error.errors.map((e) => e.message).join(', '));
    }

    const { status, adminNotes } = parsed.data;

    const client = await prisma.client.findUnique({
      where: { id: params.id },
    });

    if (!client) {
      return apiError('Client not found', 404);
    }

    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes;

    const updated = await prisma.client.update({
      where: { id: params.id },
      data: updateData,
    });

    await prisma.auditLog.create({
      data: {
        clientId: params.id,
        action: `status_changed_to_${status || 'note_updated'}`,
        performedBy: session.user.email || 'unknown',
        details: status
          ? `Status changed from ${client.status} to ${status}`
          : 'Admin notes updated',
        ipAddress: getClientIp(request),
      },
    });

    return apiSuccess(updated);
  } catch (error) {
    console.error('[Admin Update Error]', error);
    return apiInternalError();
  }
}
