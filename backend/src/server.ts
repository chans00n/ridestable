import app from './app'
import { config } from './config'
import { logger } from './config/logger'
import { connectDatabase, disconnectDatabase } from './config/database'
import { connectRedis, disconnectRedis } from './config/redis'
import { scheduledTasksService } from './services/scheduledTasks.service'

const startServer = async () => {
  try {
    await connectDatabase()
    await connectRedis()

    // Skip scheduled tasks in serverless environment
    if (!process.env.VERCEL) {
      scheduledTasksService.start()
    }

    const server = app.listen(config.port, '0.0.0.0', () => {
      logger.info(`Server running on port ${config.port}`)
      logger.info(`Environment: ${config.env}`)
      logger.info('Scheduled tasks started')
    })

    const gracefulShutdown = async () => {
      logger.info('Graceful shutdown initiated')
      
      // Stop scheduled tasks
      scheduledTasksService.stop()
      
      server.close(async () => {
        await disconnectDatabase()
        await disconnectRedis()
        logger.info('Server closed')
        process.exit(0)
      })
    }

    process.on('SIGTERM', gracefulShutdown)
    process.on('SIGINT', gracefulShutdown)
  } catch (error) {
    logger.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer()