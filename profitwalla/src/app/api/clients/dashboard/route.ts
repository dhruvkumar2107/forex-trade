import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError, apiInternalError } from '@/lib/api';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return apiError('Unauthorized', 401);
    }

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    if (!clientId) {
      return apiError('Client ID is required');
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
