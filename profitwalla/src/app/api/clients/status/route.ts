import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError, apiInternalError } from '@/lib/api';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rateLimitKey = `status-check:${ip}`;
    const rateLimit = await checkRateLimit(rateLimitKey, RATE_LIMITS.statusCheck);
    if (!rateLimit.allowed) {
      return apiError('Too many requests. Please try again later.', 429);
    }

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const mobile = searchParams.get('mobile');

    if (!clientId && !mobile) {
      return apiError('Client ID or mobile number is required');
    }

    const client = clientId
      ? await prisma.client.findUnique({
          where: { id: clientId },
          select: { id: true, status: true, fullName: true, createdAt: true },
        })
      : await prisma.client.findFirst({
          where: { mobile: mobile || '' },
          select: { id: true, status: true, fullName: true, createdAt: true },
        });

    if (!client) {
      return apiError('Application not found', 404);
    }

    return apiSuccess(client);
  } catch (error) {
    console.error('[Status Check Error]', error);
    return apiInternalError();
  }
}
