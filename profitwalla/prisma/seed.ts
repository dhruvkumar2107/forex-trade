import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user for Profitwalla
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

  console.log('Admin user created: admin@profitwalla.com / admin123');
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
