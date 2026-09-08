import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Profitwalla database...');

  // Admin credentials from environment variables — NEVER use defaults in production
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@profitwalla.com';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  const adminName = process.env.SEED_ADMIN_NAME || 'Admin';

  if (!adminPassword) {
    console.warn('[Seed] SEED_ADMIN_PASSWORD not set. Skipping admin user creation.');
    console.warn('[Seed] Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD environment variables.');
  } else {
    const adminPasswordHash = await bcrypt.hash(adminPassword, 12);
    await prisma.adminUser.upsert({
      where: { email: adminEmail },
      update: {},
      create: {
        email: adminEmail,
        name: adminName,
        passwordHash: adminPasswordHash,
        role: 'admin',
      },
    });
    console.log(`[Seed] Admin user created: ${adminEmail}`);
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
