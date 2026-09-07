import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/encryption';
import { apiSuccess, apiError, apiInternalError, getClientIp } from '@/lib/api';
import { clientFormSchema } from '@/lib/validation';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = clientFormSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.errors.map((e) => e.message).join(', ');
      return apiError(errors);
    }

    const data = parsed.data;

    const ip = getClientIp(request);
    const rateLimitKey = `client-submit:${data.mobile}:${ip}`;
    const rateLimit = await checkRateLimit(rateLimitKey, RATE_LIMITS.clientSubmit);
    if (!rateLimit.allowed) {
      return apiError('Too many submissions. Please try again later.', 429);
    }

    const existingByAccount = await prisma.client.findFirst({
      where: { mt5AccountNumber: data.mt5AccountNumber },
    });

    if (existingByAccount) {
      return apiError('This MT5 account number is already registered');
    }

    const existingByMobile = await prisma.client.findFirst({
      where: { mobile: data.mobile },
    });

    if (existingByMobile) {
      return apiError('This mobile number is already registered. Please contact support if you need to update your details.');
    }

    const { encrypted, iv } = encrypt(data.mt5InvestorPassword);

    const client = await prisma.client.create({
      data: {
        fullName: data.fullName,
        mobile: data.mobile,
        mobileVerified: true,
        occupation: data.occupation,
        mt5AccountNumber: data.mt5AccountNumber,
        mt5InvestorPasswordEnc: encrypted,
        mt5InvestorPasswordIv: iv,
        brokerServer: data.brokerServer,
        startingEquity: data.startingEquity,
        city: data.city,
        state: data.state,
        consentGiven: data.consentGiven,
        consentTimestamp: new Date(),
        status: 'submitted',
      },
    });

    await prisma.auditLog.create({
      data: {
        clientId: client.id,
        action: 'client_submitted',
        performedBy: 'system',
        details: 'Client onboarding form submitted',
        ipAddress: ip,
      },
    });

    return apiSuccess({
      id: client.id,
      status: client.status,
      message: 'Application submitted successfully! We will review your details within 24 hours.',
    }, 201);
  } catch (error) {
    console.error('[Client Submit Error]', error);
    return apiInternalError();
  }
}
