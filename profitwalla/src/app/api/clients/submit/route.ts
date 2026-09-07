import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/encryption';
import { apiSuccess, apiError, apiInternalError, getClientIp } from '@/lib/api';
import { clientFormSchema } from '@/lib/validation';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

async function sendConfirmationEmail(email: string, name: string, clientId: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  try {
    const { Resend } = await import('resend');
    const resend = new Resend(apiKey);

    await resend.emails.send({
      from: 'Profitwalla <noreply@profitwalla.com>',
      to: email,
      subject: 'Your Application Has Been Received — Profitwalla',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #00D4AA; font-size: 24px;">Application Received</h1>
          <p>Hi ${name},</p>
          <p>Thank you for applying to Profitwalla. Your application has been <strong>approved</strong> and your account will be connected shortly.</p>
          <div style="background: #111820; border: 1px solid #1E2633; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <p style="color: #9CA3AF; font-size: 14px; margin: 0;">Your Reference ID</p>
            <p style="color: #00D4AA; font-family: monospace; font-size: 16px; margin: 4px 0 0 0;">${clientId}</p>
          </div>
          <p style="color: #9CA3AF; font-size: 14px;">You can check your application status anytime at <a href="https://profitwalla.com/status?clientId=${clientId}" style="color: #00D4AA;">profitwalla.com/status</a></p>
          <hr style="border: none; border-top: 1px solid #1E2633; margin: 20px 0;" />
          <p style="color: #6B7280; font-size: 12px;">This is an automated message from Profitwalla. If you did not submit this application, please ignore this email.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error('[Email Error]', error);
  }
}

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
        status: 'approved',
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

    // Send confirmation email (non-blocking)
    sendConfirmationEmail(data.mobile + '@placeholder.com', data.fullName, client.id).catch(() => {});

    return apiSuccess({
      id: client.id,
      status: client.status,
      message: 'Application submitted successfully! Your account has been approved.',
    }, 201);
  } catch (error) {
    console.error('[Client Submit Error]', error);
    return apiInternalError();
  }
}
