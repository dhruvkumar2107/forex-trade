import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError, apiInternalError, apiUnauthorized } from '@/lib/api';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const configureSchema = z.object({
  clientId: z.string().uuid(),
  metaApiAccountId: z.string().min(1),
  metaApiConnectionId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return apiUnauthorized();
    }

    const body = await request.json();
    const parsed = configureSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(parsed.error.errors.map((e) => e.message).join(', '));
    }

    const { clientId, metaApiAccountId, metaApiConnectionId } = parsed.data;

    const client = await prisma.copyTradingClient.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      return apiError('Client not found', 404);
    }

    await prisma.copyTradingClient.update({
      where: { id: clientId },
      data: {
        metaApiAccountId,
        metaApiConnectionId: metaApiConnectionId || null,
        connectionHealth: 'connected',
        lastHealthCheckAt: new Date(),
      },
    });

    return apiSuccess({ message: 'MetaApi account configured successfully' });
  } catch (error) {
    console.error('[Configure Client Error]', error);
    return apiInternalError();
  }
}
