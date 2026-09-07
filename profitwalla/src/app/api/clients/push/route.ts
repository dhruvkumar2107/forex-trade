import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/encryption';
import { apiSuccess, apiError, apiInternalError, apiUnauthorized, getClientIp } from '@/lib/api';
import { pushClientToCopyTrading } from '@/lib/copytrading-api';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return apiUnauthorized();
    }

    const body = await request.json();
    const { clientId } = body;

    if (!clientId) {
      return apiError('Client ID is required');
    }

    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      return apiError('Client not found', 404);
    }

    if (client.status !== 'approved') {
      return apiError('Client must be approved before pushing to copy trading');
    }

    if (client.pushedToCopyTrading) {
      return apiError('Client has already been pushed to copy trading');
    }

    // Decrypt password for transfer (encrypted channel)
    const investorPassword = decrypt(
      client.mt5InvestorPasswordEnc,
      client.mt5InvestorPasswordIv
    );

    // Push to copy trading system
    const result = await pushClientToCopyTrading({
      clientRef: client.id,
      mt5AccountNumber: client.mt5AccountNumber,
      brokerServer: client.brokerServer,
      mt5InvestorPassword: investorPassword,
      startingEquity: client.startingEquity,
      fullName: client.fullName,
    });

    if (!result.success) {
      return apiError(`Failed to push to copy trading: ${result.error}`);
    }

    // Update client status
    await prisma.client.update({
      where: { id: clientId },
      data: {
        pushedToCopyTrading: true,
        pushedAt: new Date(),
        status: 'connected',
      },
    });

    await prisma.auditLog.create({
      data: {
        clientId,
        action: 'pushed_to_copy_trading',
        performedBy: session.user.email || 'unknown',
        details: `Pushed to copy trading system. New client ID: ${result.clientId}`,
        ipAddress: getClientIp(request),
      },
    });

    return apiSuccess({
      message: 'Client successfully pushed to copy trading system',
      copyTradingClientId: result.clientId,
    });
  } catch (error) {
    console.error('[Push to Copy Trading Error]', error);
    return apiInternalError();
  }
}
