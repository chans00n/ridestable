import { PrismaClient } from '@prisma/client'
import { logger } from './logger'
import { addConnectionParams } from '../utils/database-url'

// Global prisma instance for serverless environments
declare global {
  var prisma: PrismaClient | undefined
}

// Create Prisma client with explicit database URL to work around permission issues
let DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/stable_ride_dev?schema=public'

// Add connection parameters for serverless environment
if (process.env.VERCEL && process.env.DATABASE_URL) {
  DATABASE_URL = addConnectionParams(DATABASE_URL)
}

// Log database configuration for debugging
if (process.env.VERCEL) {
  logger.info('Database configuration:', {
    hasDbUrl: !!process.env.DATABASE_URL,
    hasDirectUrl: !!process.env.DIRECT_URL,
    dbHost: DATABASE_URL.split('@')[1]?.split(':')[0] || 'unknown',
  })
}

export const prisma = global.prisma || new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL,
    },
  },
  log: process.env.NODE_ENV === 'development' ? [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'event',
      level: 'error',
    },
    {
      emit: 'event',
      level: 'info',
    },
    {
      emit: 'event',
      level: 'warn',
    },
  ] : ['error'],
  // Add connection timeout for serverless
  datasourceUrl: DATABASE_URL,
})

// Prevent multiple instances in serverless environments
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma
}

prisma.$on('query', (e) => {
  logger.debug('Query: ' + e.query)
  logger.debug('Duration: ' + e.duration + 'ms')
})

prisma.$on('error', (e) => {
  logger.error('Prisma error:', e)
})

export const connectDatabase = async () => {
  try {
    // Test connection on startup in production
    if (process.env.NODE_ENV === 'production') {
      await prisma.$connect()
      logger.info('Database connected successfully')
      
      // Test query
      const count = await prisma.user.count()
      logger.info(`Database test query successful - ${count} users found`)
    } else {
      // Lazy connection in development
      logger.info('Database connection initialized (lazy connection)')
    }
  } catch (error) {
    logger.error('Failed to connect to database:', error)
    // Don't exit process in serverless environment
    if (!process.env.VERCEL) {
      process.exit(1)
    }
  }
}

export const disconnectDatabase = async () => {
  await prisma.$disconnect()
  logger.info('Database disconnected')
}