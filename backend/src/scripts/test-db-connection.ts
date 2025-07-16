import { prisma } from '../config/database'

async function testConnection() {
  console.log('Testing database connection...')
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set')
  console.log('DIRECT_URL:', process.env.DIRECT_URL ? 'Set' : 'Not set')
  
  try {
    // Test basic connection
    await prisma.$connect()
    console.log('✅ Database connected successfully')
    
    // Test a simple query
    const userCount = await prisma.user.count()
    console.log(`✅ Query successful - Found ${userCount} users`)
    
    // Disconnect
    await prisma.$disconnect()
    console.log('✅ Database disconnected successfully')
    
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    process.exit(1)
  }
}

testConnection()