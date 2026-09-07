import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST() {
  try {
    // Create StaffUser table if it doesn't exist (raw SQL for shared DB)
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "StaffUser" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
        "email" TEXT NOT NULL,
        "name" TEXT,
        "passwordHash" TEXT NOT NULL,
        "role" TEXT NOT NULL DEFAULT 'staff',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "StaffUser_pkey" PRIMARY KEY ("id")
      );
      CREATE UNIQUE INDEX IF NOT EXISTS "StaffUser_email_key" ON "StaffUser"("email");
    `);

    // Create MasterAccount table if it doesn't exist
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "MasterAccount" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
        "metaApiAccountId" TEXT NOT NULL,
        "accountName" TEXT NOT NULL,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "currentEquity" DOUBLE PRECISION,
        "currentBalance" DOUBLE PRECISION,
        "openTrades" INTEGER NOT NULL DEFAULT 0,
        "todayPnL" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "totalPnL" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "lastSyncAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "MasterAccount_pkey" PRIMARY KEY ("id")
      );
      CREATE UNIQUE INDEX IF NOT EXISTS "MasterAccount_metaApiAccountId_key" ON "MasterAccount"("metaApiAccountId");
    `);

    const passwordHash = await bcrypt.hash('staff123', 12);

    await prisma.staffUser.upsert({
      where: { email: 'staff@copytrading.local' },
      update: {},
      create: {
        email: 'staff@copytrading.local',
        name: 'Staff',
        passwordHash,
        role: 'staff',
      },
    });

    await prisma.masterAccount.upsert({
      where: { id: 'master-1' },
      update: {},
      create: {
        id: 'master-1',
        metaApiAccountId: process.env.METAAPI_MASTER_ACCOUNT_ID || 'pending',
        accountName: 'Profitwalla Master',
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, message: 'Database seeded. Login: staff@copytrading.local / staff123' });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
