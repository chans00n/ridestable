import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAdmin() {
  try {
    const admins = await prisma.adminUser.findMany();
    console.log('Admin users:', admins);
    
    const superAdmin = await prisma.adminUser.findUnique({
      where: { email: 'super@stableride.com' }
    });
    
    console.log('Super admin:', superAdmin);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdmin();