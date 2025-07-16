import { PrismaClient } from '@prisma/client'
import { logger } from './logger'

// Create Prisma client with explicit database URL to work around permission issues
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:password@127.0.0.1:5432/stable_ride_dev?schema=public'

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL,
    },
  },
  log: [
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
  ],
})

prisma.$on('query', (e) => {
  logger.debug('Query: ' + e.query)
  logger.debug('Duration: ' + e.duration + 'ms')
})

prisma.$on('error', (e) => {
  logger.error('Prisma error:', e)
})

export const connectDatabase = async () => {
  try {
    // Temporary workaround for PostgreSQL 14 connection issue
    // Skip explicit connection - Prisma will connect on first query
    logger.info('Database connection initialized (lazy connection)')
  } catch (error) {
    logger.error('Failed to connect to database:', error)
    process.exit(1)
  }
}

export const disconnectDatabase = async () => {
  await prisma.$disconnect()
  logger.info('Database disconnected')
}