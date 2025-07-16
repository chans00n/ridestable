import { createClient } from 'redis'
import { config } from './index'
import { logger } from './logger'

export const redisClient = createClient({
  url: config.redis.url,
})

redisClient.on('error', (err) => {
  logger.error('Redis Client Error', err)
})

redisClient.on('connect', () => {
  logger.info('Redis Client Connected')
})

export const connectRedis = async () => {
  try {
    // Skip Redis connection in serverless environment
    if (process.env.VERCEL || process.env.SKIP_REDIS === 'true') {
      logger.info('Skipping Redis connection in serverless environment')
      return
    }
    await redisClient.connect()
  } catch (error) {
    logger.error('Failed to connect to Redis:', error)
    // Don't exit in production, just log the error
    if (config.env === 'production') {
      logger.warn('Running without Redis cache')
    } else {
      process.exit(1)
    }
  }
}

export const disconnectRedis = async () => {
  await redisClient.quit()
  logger.info('Redis disconnected')
}