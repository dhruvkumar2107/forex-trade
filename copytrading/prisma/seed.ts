import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding copy trading database...');

  // Staff credentials from environment variables — NEVER use defaults in production
  const staffEmail = process.env.SEED_STAFF_EMAIL || 'staff@profitwalla.local';
  const staffPassword = process.env.SEED_STAFF_PASSWORD;
  const staffName = process.env.SEED_STAFF_NAME || 'Staff';

  if (!staffPassword) {
    console.warn('[Seed] SEED_STAFF_PASSWORD not set. Skipping staff user creation.');
    console.warn('[Seed] Set SEED_STAFF_EMAIL and SEED_STAFF_PASSWORD environment variables.');
  } else {
    const staffPasswordHash = await bcrypt.hash(staffPassword, 12);

    await prisma.staffUser.upsert({
      where: { email: staffEmail },
      update: {},
      create: {
        email: staffEmail,
        name: staffName,
        passwordHash: staffPasswordHash,
        role: 'staff',
        permissions: [
          'VIEW_CLIENT', 'VIEW_DASHBOARD', 'VIEW_TRADES', 'VIEW_ALERTS',
        ],
      },
    });

    console.log(`[Seed] Staff user created: ${staffEmail}`);
  }

  // Create master account placeholder
  const masterAccountId = process.env.METAAPI_MASTER_ACCOUNT_ID;
  if (masterAccountId) {
    await prisma.masterAccount.upsert({
      where: { metaApiAccountId: masterAccountId },
      update: {},
      create: {
        metaApiAccountId: masterAccountId,
        accountName: 'Profitwalla Master',
        isActive: true,
      },
    });
    console.log(`[Seed] Master account configured: ${masterAccountId}`);
  } else {
    console.warn('[Seed] METAAPI_MASTER_ACCOUNT_ID not set. Skipping master account creation.');
  }

  console.log('[Seed] Completed!');
}

main()
  .catch((e) => {
    console.error('[Seed] Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
