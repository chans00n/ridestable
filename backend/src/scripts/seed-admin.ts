import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { config } from '../config';

const prisma = new PrismaClient();

async function seedAdmin() {
  try {
    // Check if admin already exists
    const existingAdmin = await prisma.adminUser.findUnique({
      where: { email: 'super@stableride.com' }
    });

    if (existingAdmin) {
      console.log('Super admin already exists');
      return;
    }

    // Create super admin
    const hashedPassword = await bcrypt.hash('Admin123!@#', 10);
    
    const admin = await prisma.adminUser.create({
      data: {
        email: 'super@stableride.com',
        password: hashedPassword,
        firstName: 'Super',
        lastName: 'Admin',
        role: 'SUPER_ADMIN',
        isActive: true,
        permissions: JSON.stringify([])
      }
    });

    console.log('Super admin created successfully:', {
      email: admin.email,
      role: admin.role,
      temporaryPassword: 'Admin123!@#'
    });

    console.log('\n⚠️  IMPORTANT: Please change the password immediately after first login!');
  } catch (error) {
    console.error('Error seeding admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeder
seedAdmin();