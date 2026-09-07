import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/encryption';
import { apiSuccess, apiError, apiInternalError, getClientIp } from '@/lib/api';
import { clientFormSchema } from '@/lib/validation';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

async function ensureTables() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Client" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
        "fullName" TEXT NOT NULL,
        "mobile" TEXT NOT NULL,
        "mobileVerified" BOOLEAN NOT NULL DEFAULT false,
        "occupation" TEXT NOT NULL,
        "mt5AccountNumber" TEXT NOT NULL,
        "mt5InvestorPasswordEnc" TEXT NOT NULL,
        "mt5InvestorPasswordIv" TEXT NOT NULL,
        "brokerServer" TEXT NOT NULL,
        "startingEquity" DOUBLE PRECISION NOT NULL,
        "city" TEXT NOT NULL,
        "state" TEXT NOT NULL,
        "consentGiven" BOOLEAN NOT NULL DEFAULT false,
        "consentTimestamp" TIMESTAMP(3),
        "status" TEXT NOT NULL DEFAULT 'submitted',
        "adminNotes" TEXT,
        "pushedToCopyTrading" BOOLEAN NOT NULL DEFAULT false,
        "pushedAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
      );
      CREATE UNIQUE INDEX IF NOT EXISTS "Client_mobile_key" ON "Client"("mobile");
      CREATE UNIQUE INDEX IF NOT EXISTS "Client_mt5AccountNumber_key" ON "Client"("mt5AccountNumber");
      CREATE INDEX IF NOT EXISTS "Client_status_idx" ON "Client"("status");
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "AuditLog" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
        "clientId" TEXT NOT NULL,
        "action" TEXT NOT NULL,
        "performedBy" TEXT NOT NULL,
        "details" TEXT,
        "ipAddress" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
      );
      CREATE INDEX IF NOT EXISTS "AuditLog_clientId_idx" ON "AuditLog"("clientId");
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "AdminUser" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
        "email" TEXT NOT NULL,
        "name" TEXT,
        "passwordHash" TEXT NOT NULL,
        "role" TEXT NOT NULL DEFAULT 'admin',
        "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
        "twoFactorSecret" TEXT,
        "lastLoginAt" TIMESTAMP(3),
        "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
        "lockedUntil" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
      );
      CREATE UNIQUE INDEX IF NOT EXISTS "AdminUser_email_key" ON "AdminUser"("email");
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "RateLimitEntry" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
        "key" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "RateLimitEntry_pkey" PRIMARY KEY ("id")
      );
      CREATE INDEX IF NOT EXISTS "RateLimitEntry_key_createdAt_idx" ON "RateLimitEntry"("key", "createdAt");
    `);
  } catch (e) {
    console.error('[Ensure Tables Error]', e);
  }
}

let tablesEnsured = false;

export async function POST(request: NextRequest) {
  try {
    if (!tablesEnsured) {
      await ensureTables();
      tablesEnsured = true;
    }

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
      message: 'Application submitted successfully!',
    }, 201);
  } catch (error) {
    console.error('[Client Submit Error]', error);
    return apiInternalError();
  }
}
