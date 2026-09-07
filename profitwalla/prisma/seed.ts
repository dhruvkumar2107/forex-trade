import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

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
  console.log('Admin user: admin@profitwalla.com / admin123');

  const staffPasswordHash = await bcrypt.hash('staff123', 12);
  await prisma.adminUser.upsert({
    where: { email: 'staff@copytrading.local' },
    update: {},
    create: {
      email: 'staff@copytrading.local',
      name: 'Staff',
      passwordHash: staffPasswordHash,
      role: 'staff',
    },
  });
  console.log('Staff user: staff@copytrading.local / staff123');

  console.log('Seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
