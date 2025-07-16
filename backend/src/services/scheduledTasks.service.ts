import cron from 'node-cron';
import { logger } from '../config/logger';
import { reminderService } from './reminder.service';
import { prisma } from '../config/database';
import { subDays, startOfDay } from 'date-fns';

export class ScheduledTasksService {
  private tasks: Map<string, cron.ScheduledTask> = new Map();
  private isRunning = false;

  /**
   * Start all scheduled tasks
   */
  start(): void {
    if (this.isRunning) {
      logger.warn('Scheduled tasks are already running');
      return;
    }

    logger.info('Starting scheduled tasks...');

    // Initialize reminder service
    reminderService.initialize();

    // Schedule daily cleanup tasks (runs at 2 AM)
    this.scheduleTask('daily-cleanup', '0 2 * * *', this.performDailyCleanup);

    // Schedule hourly stats collection
    this.scheduleTask('hourly-stats', '0 * * * *', this.collectHourlyStats);

    // Schedule expired quote cleanup (every 30 minutes)
    this.scheduleTask('quote-cleanup', '*/30 * * * *', this.cleanupExpiredQuotes);

    // Schedule notification retry (every 15 minutes)
    this.scheduleTask('notification-retry', '*/15 * * * *', this.retryFailedNotifications);

    this.isRunning = true;
    logger.info('All scheduled tasks started successfully');
  }

  /**
   * Stop all scheduled tasks
   */
  stop(): void {
    logger.info('Stopping scheduled tasks...');

    // Stop reminder service
    reminderService.stop();

    // Stop all other tasks
    this.tasks.forEach((task, name) => {
      task.stop();
      logger.info(`Stopped task: ${name}`);
    });

    this.tasks.clear();
    this.isRunning = false;
    logger.info('All scheduled tasks stopped');
  }

  /**
   * Schedule a task with error handling
   */
  private scheduleTask(name: string, cronExpression: string, handler: () => Promise<void>): void {
    const task = cron.schedule(cronExpression, async () => {
      logger.info(`Running scheduled task: ${name}`);
      try {
        await handler.call(this);
        logger.info(`Completed scheduled task: ${name}`);
      } catch (error) {
        logger.error(`Error in scheduled task ${name}:`, error);
      }
    });

    task.start();
    this.tasks.set(name, task);
    logger.info(`Scheduled task registered: ${name} (${cronExpression})`);
  }

  /**
   * Perform daily cleanup tasks
   */
  private async performDailyCleanup(): Promise<void> {
    const thirtyDaysAgo = subDays(new Date(), 30);

    // Clean up old notifications
    const deletedNotifications = await prisma.notification.deleteMany({
      where: {
        createdAt: {
          lt: thirtyDaysAgo
        },
        status: {
          in: ['sent', 'failed']
        }
      }
    });

    logger.info(`Cleaned up ${deletedNotifications.count} old notifications`);

    // Clean up expired sessions
    const deletedSessions = await prisma.session.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    });

    logger.info(`Cleaned up ${deletedSessions.count} expired sessions`);

    // Archive old completed bookings
    const ninetyDaysAgo = subDays(new Date(), 90);
    const archivedBookings = await prisma.booking.updateMany({
      where: {
        status: 'COMPLETED',
        updatedAt: {
          lt: ninetyDaysAgo
        },
        archived: false
      },
      data: {
        archived: true
      }
    });

    logger.info(`Archived ${archivedBookings.count} old completed bookings`);
  }

  /**
   * Collect hourly statistics
   */
  private async collectHourlyStats(): Promise<void> {
    const hourStart = startOfDay(new Date());
    hourStart.setHours(new Date().getHours());

    // Count bookings created in the last hour
    const newBookings = await prisma.booking.count({
      where: {
        createdAt: {
          gte: hourStart
        }
      }
    });

    // Count completed trips in the last hour
    const completedTrips = await prisma.booking.count({
      where: {
        status: 'COMPLETED',
        updatedAt: {
          gte: hourStart
        }
      }
    });

    // Log stats (in production, you might want to store these in a stats table)
    logger.info('Hourly statistics', {
      hour: hourStart.toISOString(),
      newBookings,
      completedTrips
    });
  }

  /**
   * Clean up expired quotes
   */
  private async cleanupExpiredQuotes(): Promise<void> {
    const deletedQuotes = await prisma.quote.deleteMany({
      where: {
        validUntil: {
          lt: new Date()
        },
        booking: null // Only delete quotes that don't have associated bookings
      }
    });

    if (deletedQuotes.count > 0) {
      logger.info(`Cleaned up ${deletedQuotes.count} expired quotes`);
    }
  }

  /**
   * Retry failed notifications
   */
  private async retryFailedNotifications(): Promise<void> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    // Find failed notifications that haven't been retried recently
    const failedNotifications = await prisma.notification.findMany({
      where: {
        status: 'failed',
        retryCount: {
          lt: 3 // Max 3 retries
        },
        updatedAt: {
          lt: oneHourAgo // Don't retry if we tried in the last hour
        }
      },
      take: 10 // Process 10 at a time
    });

    for (const notification of failedNotifications) {
      try {
        // Re-send the notification
        // This would need to be implemented based on your notification logic
        logger.info(`Retrying notification ${notification.id}`);

        // Update retry count
        await prisma.notification.update({
          where: { id: notification.id },
          data: {
            retryCount: notification.retryCount + 1
          }
        });
      } catch (error) {
        logger.error(`Failed to retry notification ${notification.id}:`, error);
      }
    }

    if (failedNotifications.length > 0) {
      logger.info(`Retried ${failedNotifications.length} failed notifications`);
    }
  }

  /**
   * Get status of all scheduled tasks
   */
  getStatus(): Record<string, any> {
    const status: Record<string, any> = {
      isRunning: this.isRunning,
      tasks: {}
    };

    this.tasks.forEach((task, name) => {
      status.tasks[name] = {
        name,
        // Note: node-cron doesn't expose task status directly
        registered: true
      };
    });

    return status;
  }
}

// Create singleton instance
export const scheduledTasksService = new ScheduledTasksService();