import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/encryption';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fullName, mobile, occupation, mt5AccountNumber, mt5InvestorPassword, brokerServer, startingEquity, city, state, consentGiven } = body;

    if (!fullName || !mobile || !mt5AccountNumber || !mt5InvestorPassword || !brokerServer || !startingEquity || !city || !state) {
      return NextResponse.json({ success: false, error: 'All fields are required' }, { status: 400 });
    }

    if (!consentGiven) {
      return NextResponse.json({ success: false, error: 'You must accept the risk disclosure' }, { status: 400 });
    }

    // Ensure tables exist
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
      `);
      await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "Client_mobile_key" ON "Client"("mobile");`);
      await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "Client_mt5AccountNumber_key" ON "Client"("mt5AccountNumber");`);

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
      `);
    } catch (tableError) {
      console.error('[Table Error]', tableError);
    }

    const { encrypted, iv } = encrypt(mt5InvestorPassword);

    const client = await prisma.client.create({
      data: {
        fullName,
        mobile,
        mobileVerified: true,
        occupation,
        mt5AccountNumber,
        mt5InvestorPasswordEnc: encrypted,
        mt5InvestorPasswordIv: iv,
        brokerServer,
        startingEquity: Number(startingEquity),
        city,
        state,
        consentGiven: true,
        consentTimestamp: new Date(),
        status: 'submitted',
      },
    });

    try {
      await prisma.auditLog.create({
        data: {
          clientId: client.id,
          action: 'client_submitted',
          performedBy: 'system',
          details: 'Client onboarding form submitted',
          ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown',
        },
      });
    } catch (e) {
      // Audit log failure is non-critical
    }

    return NextResponse.json({
      success: true,
      data: { id: client.id, status: client.status },
    }, { status: 201 });
  } catch (error) {
    console.error('[Submit Error]', error);
    return NextResponse.json({ success: false, error: 'Server error. Please try again.' }, { status: 500 });
  }
}
