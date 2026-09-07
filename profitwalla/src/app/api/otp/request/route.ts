import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError, apiInternalError } from '@/lib/api';
import { otpRequestSchema } from '@/lib/validation';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = otpRequestSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(parsed.error.errors[0].message);
    }

    const { mobile } = parsed.data;

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rateLimitKey = `otp-request:${mobile}:${ip}`;
    const rateLimit = await checkRateLimit(rateLimitKey, RATE_LIMITS.otpRequest);
    if (!rateLimit.allowed) {
      return apiError('Too many requests. Please try again later.', 429);
    }

    const code = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    const existing = await prisma.otpSession.findFirst({
      where: { mobile },
      orderBy: { createdAt: 'desc' },
    });

    if (existing) {
      await prisma.otpSession.update({
        where: { id: existing.id },
        data: { code, expiresAt, attempts: 0, verified: false },
      });
    } else {
      await prisma.otpSession.create({
        data: { mobile, code, expiresAt },
      });
    }

    return apiSuccess({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('[OTP Request Error]', error);
    return apiInternalError();
  }
}
