import { redisClient } from '../config/redis'
import { logger } from '../config/logger'

// In-memory cache fallback for when Redis is not available
const memoryCache = new Map<string, { value: string; expiry: number }>()

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, data] of memoryCache.entries()) {
    if (data.expiry < now) {
      memoryCache.delete(key)
    }
  }
}, 60000) // Clean up every minute

export const cache = {
  async get(key: string): Promise<string | null> {
    try {
      if (redisClient.isOpen) {
        return await redisClient.get(key)
      }
    } catch (error) {
      logger.warn('Redis get error, falling back to memory cache:', error)
    }
    
    // Fallback to memory cache
    const data = memoryCache.get(key)
    if (data && data.expiry > Date.now()) {
      return data.value
    }
    return null
  },

  async setEx(key: string, seconds: number, value: string): Promise<void> {
    try {
      if (redisClient.isOpen) {
        await redisClient.setEx(key, seconds, value)
        return
      }
    } catch (error) {
      logger.warn('Redis setEx error, falling back to memory cache:', error)
    }
    
    // Fallback to memory cache
    memoryCache.set(key, {
      value,
      expiry: Date.now() + (seconds * 1000)
    })
  },

  async del(key: string): Promise<void> {
    try {
      if (redisClient.isOpen) {
        await redisClient.del(key)
        return
      }
    } catch (error) {
      logger.warn('Redis del error, falling back to memory cache:', error)
    }
    
    // Fallback to memory cache
    memoryCache.delete(key)
  },

  async incr(key: string): Promise<number> {
    try {
      if (redisClient.isOpen) {
        return await redisClient.incr(key)
      }
    } catch (error) {
      logger.warn('Redis incr error, falling back to memory cache:', error)
    }
    
    // Fallback to memory cache
    const current = await this.get(key)
    const value = current ? parseInt(current) + 1 : 1
    await this.setEx(key, 3600, value.toString()) // Default 1 hour expiry
    return value
  }
}