import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createSuperAdmin() {
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash('admin123', 10)
    
    // Create the super admin user
    const admin = await prisma.adminUser.create({
      data: {
        email: 'admin@stableride.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'SUPER_ADMIN',
        isActive: true,
        permissions: []
      }
    })

    console.log('✅ Super admin user created successfully!')
    console.log('Email:', admin.email)
    console.log('Password: admin123')
    console.log('Role:', admin.role)
    console.log('\nPlease change the password after first login!')
    
  } catch (error: any) {
    if (error.code === 'P2002') {
      console.log('⚠️  Super admin user already exists with email: admin@stableride.com')
    } else {
      console.error('❌ Error creating super admin:', error)
    }
  } finally {
    await prisma.$disconnect()
  }
}

createSuperAdmin()