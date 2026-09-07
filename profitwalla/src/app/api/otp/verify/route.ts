import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError, apiInternalError } from '@/lib/api';
import { otpVerifySchema } from '@/lib/validation';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = otpVerifySchema.safeParse(body);

    if (!parsed.success) {
      return apiError(parsed.error.errors[0].message);
    }

    const { mobile, code } = parsed.data;

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rateLimitKey = `otp-verify:${mobile}:${ip}`;
    const rateLimit = await checkRateLimit(rateLimitKey, RATE_LIMITS.otpVerify);
    if (!rateLimit.allowed) {
      return apiError('Too many verification attempts. Please try again later.', 429);
    }

    const session = await prisma.otpSession.findFirst({
      where: {
        mobile,
        verified: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!session) {
      return apiError('OTP expired or not found. Please request a new one.');
    }

    if (session.attempts >= 5) {
      return apiError('Too many attempts. Please request a new OTP.');
    }

    if (session.code !== code) {
      await prisma.otpSession.update({
        where: { id: session.id },
        data: { attempts: { increment: 1 } },
      });
      return apiError(`Invalid OTP. ${5 - session.attempts - 1} attempts remaining.`);
    }

    await prisma.otpSession.update({
      where: { id: session.id },
      data: { verified: true },
    });

    await prisma.client.updateMany({
      where: { mobile },
      data: { mobileVerified: true },
    });

    return apiSuccess({ message: 'Mobile number verified successfully' });
  } catch (error) {
    console.error('[OTP Verify Error]', error);
    return apiInternalError();
  }
}
