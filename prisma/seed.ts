import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial users...');

  // 1. Customer
  const customerPassword = await bcrypt.hash('customer123456', 10);
  await prisma.user.upsert({
    where: { email: 'customer@livlab.vn' },
    update: {},
    create: {
      email: 'customer@livlab.vn',
      name: 'Khách hàng LivLab',
      passwordHash: customerPassword,
      role: 'CUSTOMER',
    },
  });

  // 2. Showroom
  const showroomPassword = await bcrypt.hash('showroom123456', 10);
  await prisma.user.upsert({
    where: { email: 'showroom@livlab.vn' },
    update: {},
    create: {
      email: 'showroom@livlab.vn',
      name: 'Showroom LivLab',
      passwordHash: showroomPassword,
      role: 'SHOWROOM',
    },
  });

  // 3. Admin
  const adminPassword = await bcrypt.hash('admin123456', 10);
  await prisma.user.upsert({
    where: { email: 'admin@livlab.vn' },
    update: {},
    create: {
      email: 'admin@livlab.vn',
      name: 'Admin LivLab',
      passwordHash: adminPassword,
      role: 'ADMIN',
    },
  });

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
