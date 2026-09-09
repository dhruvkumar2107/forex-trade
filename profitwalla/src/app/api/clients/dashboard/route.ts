import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError, apiInternalError } from '@/lib/api';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { verifyClientToken } from '@/lib/client-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const token = searchParams.get('token');

    if (!clientId) {
      return apiError('Client ID is required');
    }

    // Allow access via admin session OR valid client token
    const session = await getServerSession(authOptions);
    const clientToken = token ? verifyClientToken(token) : null;

    if (!session?.user && !clientToken?.valid) {
      return apiError('Unauthorized', 401);
    }

    // If using client token, ensure it matches the requested clientId
    if (clientToken?.valid && clientToken.clientId !== clientId) {
      return apiError('Unauthorized', 401);
    }

    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        fullName: true,
        status: true,
        createdAt: true,
        brokerServer: true,
        mt5AccountNumber: true,
        startingEquity: true,
        city: true,
        state: true,
        pushedToCopyTrading: true,
        pushedAt: true,
      },
    });

    if (!client) {
      return apiError('Application not found', 404);
    }

    return apiSuccess(client);
  } catch (error) {
    console.error('[Dashboard Error]', error);
    return apiInternalError();
  }
}
