import cron from 'node-cron';
import { prisma } from '../config/database';
import { logger } from '../config/logger';
import { addMinutes, isBefore, isAfter } from 'date-fns';
import { sendPickupReminder, sendPickupReminderSms } from './notification.service';

export class ReminderService {
  private reminderTasks: Map<string, cron.ScheduledTask> = new Map();

  /**
   * Initialize the reminder service with scheduled tasks
   */
  initialize(): void {
    // Run every 5 minutes to check for upcoming bookings
    const task = cron.schedule('*/5 * * * *', async () => {
      await this.checkAndSendReminders();
    });

    // Start the cron job
    task.start();
    this.reminderTasks.set('pickup-reminders', task);

    logger.info('Reminder service initialized - checking for reminders every 5 minutes');
  }

  /**
   * Stop all scheduled tasks
   */
  stop(): void {
    this.reminderTasks.forEach((task, name) => {
      task.stop();
      logger.info(`Stopped reminder task: ${name}`);
    });
    this.reminderTasks.clear();
  }

  /**
   * Check for bookings that need reminders and send them
   */
  private async checkAndSendReminders(): Promise<void> {
    try {
      const now = new Date();
      const thirtyMinutesFromNow = addMinutes(now, 30);
      const thirtyFiveMinutesFromNow = addMinutes(now, 35);

      // Find bookings that:
      // 1. Are confirmed
      // 2. Have pickup time between 30-35 minutes from now
      // 3. Haven't had a reminder sent yet
      const bookingsNeedingReminders = await prisma.booking.findMany({
        where: {
          status: 'CONFIRMED',
          scheduledDateTime: {
            gte: thirtyMinutesFromNow,
            lt: thirtyFiveMinutesFromNow
          },
          notifications: {
            none: {
              type: 'pickup_reminder',
              sentAt: {
                gte: addMinutes(now, -60) // No reminder sent in the last hour
              }
            }
          }
        },
        include: {
          user: true,
          confirmation: true
        }
      });

      logger.info(`Found ${bookingsNeedingReminders.length} bookings needing reminders`);

      // Send reminders for each booking
      for (const booking of bookingsNeedingReminders) {
        await this.sendReminder(booking);
      }
    } catch (error) {
      logger.error('Error checking for reminders:', error);
    }
  }

  /**
   * Send reminder for a specific booking
   */
  private async sendReminder(booking: any): Promise<void> {
    try {
      // Send email reminder
      await sendPickupReminder(booking);

      // Send SMS reminder if user has phone number and SMS is enabled
      const preferences = await prisma.notificationPreferences.findUnique({
        where: { userId: booking.userId }
      });

      if (booking.user.phone && (!preferences || preferences.smsEnabled)) {
        await sendPickupReminderSms(booking, booking.user.phone).catch(err => {
          logger.error('Failed to send SMS reminder:', err);
        });
      }

      logger.info(`Sent reminder for booking ${booking.id} (${booking.confirmation?.bookingReference})`);
    } catch (error) {
      logger.error(`Failed to send reminder for booking ${booking.id}:`, error);
    }
  }

  /**
   * Schedule a specific reminder for a booking
   * This can be used to schedule reminders at custom times
   */
  async scheduleCustomReminder(
    bookingId: string,
    reminderTime: Date,
    type: 'email' | 'sms' | 'both' = 'both'
  ): Promise<void> {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: true,
        confirmation: true
      }
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    // Create a one-time cron job for this specific reminder
    const cronExpression = this.dateToCronExpression(reminderTime);
    const taskName = `reminder-${bookingId}-${reminderTime.getTime()}`;

    const task = cron.schedule(cronExpression, async () => {
      try {
        if (type === 'email' || type === 'both') {
          await sendPickupReminder(booking);
        }

        if ((type === 'sms' || type === 'both') && booking.user.phone) {
          await sendPickupReminderSms(booking, booking.user.phone);
        }

        // Remove the task after execution
        this.reminderTasks.delete(taskName);
      } catch (error) {
        logger.error(`Failed to send custom reminder for booking ${bookingId}:`, error);
      }
    }, {
      scheduled: false
    });

    // Start the task
    task.start();
    this.reminderTasks.set(taskName, task);

    logger.info(`Scheduled custom reminder for booking ${bookingId} at ${reminderTime}`);
  }

  /**
   * Convert a Date to a cron expression
   */
  private dateToCronExpression(date: Date): string {
    const minutes = date.getMinutes();
    const hours = date.getHours();
    const dayOfMonth = date.getDate();
    const month = date.getMonth() + 1;
    const dayOfWeek = '*';

    return `${minutes} ${hours} ${dayOfMonth} ${month} ${dayOfWeek}`;
  }

  /**
   * Get statistics about reminders
   */
  async getReminderStats(days: number = 7): Promise<any> {
    const since = addMinutes(new Date(), -days * 24 * 60);

    const stats = await prisma.notification.groupBy({
      by: ['status', 'channel'],
      where: {
        type: 'pickup_reminder',
        createdAt: {
          gte: since
        }
      },
      _count: true
    });

    return {
      period: `Last ${days} days`,
      reminders: stats,
      activeScheduledTasks: this.reminderTasks.size
    };
  }
}

// Create singleton instance
export const reminderService = new ReminderService();