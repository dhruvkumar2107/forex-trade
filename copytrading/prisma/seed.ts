import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding copy trading database...');

  const staffPasswordHash = await bcrypt.hash('staff123', 12);
  
  await prisma.staffUser.upsert({
    where: { email: 'staff@copytrading.local' },
    update: {},
    create: {
      email: 'staff@copytrading.local',
      name: 'Staff',
      passwordHash: staffPasswordHash,
      role: 'staff',
    },
  });

  // Create master account placeholder
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

  console.log('Staff user created: staff@copytrading.local / staff123');
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
