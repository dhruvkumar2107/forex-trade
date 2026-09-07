import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST() {
  try {
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
