import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/encryption';
import { apiSuccess, apiError, apiInternalError, apiUnauthorized, getClientIp } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return apiUnauthorized();
    }

    const body = await request.json();
    const { clientId, adminPassword } = body;

    if (!clientId || !adminPassword) {
      return apiError('Client ID and admin password are required');
    }

    const adminUser = await prisma.adminUser.findUnique({
      where: { email: session.user.email! },
    });

    if (!adminUser) {
      return apiUnauthorized();
    }

    const bcrypt = (await import('bcryptjs')).default;
    if (!await bcrypt.compare(adminPassword, adminUser.passwordHash)) {
      await prisma.auditLog.create({
        data: {
          clientId,
          action: 'failed_credential_reveal',
          performedBy: session.user.email || 'unknown',
          details: 'Incorrect admin password during credential reveal attempt',
          ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown',
        },
      });
      return apiError('Invalid admin credentials');
    }

    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      return apiError('Client not found', 404);
    }

    const investorPassword = decrypt(
      client.mt5InvestorPasswordEnc,
      client.mt5InvestorPasswordIv
    );

    await prisma.auditLog.create({
      data: {
        clientId,
        action: 'view_credentials',
        performedBy: session.user.email || 'unknown',
        details: 'Investor password revealed in admin panel (re-authenticated)',
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown',
      },
    });

    return apiSuccess({
      investorPassword,
    });
  } catch (error) {
    console.error('[Credential Reveal Error]', error);
    return apiInternalError();
  }
}
