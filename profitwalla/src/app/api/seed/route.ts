import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.SEED_SECRET}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const adminPasswordHash = await bcrypt.hash('admin123', 12);
    await prisma.adminUser.upsert({
      where: { email: 'admin@profitwalla.com' },
      update: {},
      create: {
        email: 'admin@profitwalla.com',
        name: 'Admin',
        passwordHash: adminPasswordHash,
        role: 'admin',
      },
    });

    return NextResponse.json({ success: true, message: 'Admin seeded. Login: admin@profitwalla.com / admin123' });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
