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
    await redisClient.connect()
  } catch (error) {
    logger.error('Failed to connect to Redis:', error)
    process.exit(1)
  }
}

export const disconnectRedis = async () => {
  await redisClient.quit()
  logger.info('Redis disconnected')
}