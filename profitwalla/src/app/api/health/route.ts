import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await prisma.$executeRawUnsafe(`SELECT 1`);
    return NextResponse.json({ success: true, db: 'connected' });
  } catch (error) {
    return NextResponse.json({ success: false, db: 'disconnected', error: String(error) }, { status: 500 });
  }
}
