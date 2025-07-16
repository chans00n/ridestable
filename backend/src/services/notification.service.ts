import { prisma } from '../config/database';
import { Notification, NotificationPreferences } from '@prisma/client';
import sgMail from '@sendgrid/mail';
import { config } from '../config';
import { ApiError } from '../utils/errors';
import { notificationTemplates } from '../config/notificationTemplates';
import { format } from 'date-fns';
import { SmsService } from './sms.service';

// Initialize SendGrid
if (config.email.sendgridApiKey) {
  sgMail.setApiKey(config.email.sendgridApiKey);
}

export interface NotificationData {
  userId: string;
  type: string;
  channel: 'email' | 'sms' | 'push';
  templateId?: string;
  recipient: string;
  subject?: string;
  data: Record<string, any>;
  bookingId?: string;
}

export interface ConfirmationEmailData {
  booking: any;
  confirmation: any;
  pdfUrl?: string;
  calendarInvite?: string;
}

export class NotificationService {
  async sendNotification(data: NotificationData): Promise<Notification> {
    // Check user preferences
    const preferences = await this.getUserPreferences(data.userId);
    
    if (!this.shouldSendNotification(data.channel, preferences)) {
      throw new ApiError('User has disabled this notification channel', 400);
    }

    // Create notification record
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        bookingId: data.bookingId,
        type: data.type,
        channel: data.channel,
        templateId: data.templateId,
        recipient: data.recipient,
        subject: data.subject,
        content: JSON.stringify(data.data),
        metadata: data.data,
        status: 'pending'
      }
    });

    // Send notification based on channel
    try {
      switch (data.channel) {
        case 'email':
          await this.sendEmailNotification(data);
          break;
        case 'sms':
          await this.sendSmsNotification(data);
          break;
        case 'push':
          await this.sendPushNotification(data);
          break;
      }

      // Update notification status
      await prisma.notification.update({
        where: { id: notification.id },
        data: {
          status: 'sent',
          sentAt: new Date()
        }
      });

    } catch (error) {
      await prisma.notification.update({
        where: { id: notification.id },
        data: {
          status: 'failed',
          failedAt: new Date(),
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        }
      });
      throw error;
    }

    return notification;
  }

  private async sendEmailNotification(data: NotificationData): Promise<void> {
    const template = notificationTemplates[data.type as keyof typeof notificationTemplates];
    if (!template) {
      throw new ApiError(`No template found for notification type: ${data.type}`, 404);
    }

    const html = this.renderTemplate(template.html, data.data);
    const text = this.renderTemplate(template.text, data.data);

    const msg: any = {
      to: data.recipient,
      from: {
        email: config.email.from,
        name: config.email.fromName
      },
      subject: data.subject || template.subject,
      text,
      html
    };

    // Add calendar invite attachment if provided
    if (data.data.calendarInvite) {
      msg.attachments = [{
        content: data.data.calendarInvite,
        filename: `booking-${data.data.bookingReference || 'invite'}.ics`,
        type: 'text/calendar',
        disposition: 'attachment'
      }];
    }

    await sgMail.send(msg);
  }

  private async sendSmsNotification(data: NotificationData): Promise<void> {
    // Extract phone number from recipient or data
    const phone = data.recipient || data.data.phone || data.data.contactPhone;
    
    if (!phone) {
      throw new ApiError('Phone number not provided for SMS notification', 400);
    }

    // Route to appropriate SMS template based on notification type
    switch (data.type) {
      case 'booking_confirmation':
        await SmsService.sendBookingConfirmationSms(phone, {
          bookingReference: data.data.bookingReference,
          pickupDate: data.data.pickupDate,
          pickupTime: data.data.pickupTime,
          pickupAddress: data.data.pickupAddress
        });
        break;

      case 'payment_confirmation':
        await SmsService.sendPaymentConfirmationSms(phone, {
          bookingReference: data.data.bookingReference,
          amount: data.data.totalAmount
        });
        break;

      case 'pickup_reminder':
        await SmsService.sendPickupReminderSms(phone, {
          bookingReference: data.data.bookingReference || 'N/A',
          pickupTime: data.data.pickupTime,
          driverName: data.data.driverName,
          vehicleInfo: data.data.vehicleInfo
        });
        break;

      case 'booking_cancellation':
        await SmsService.sendCancellationSms(phone, {
          bookingReference: data.data.bookingReference,
          refundAmount: data.data.refundAmount
        });
        break;

      case 'booking_modification':
        await SmsService.sendModificationSms(phone, {
          bookingReference: data.data.bookingReference,
          changes: this.summarizeChanges(data.data.changes)
        });
        break;

      case 'verification_code':
        await SmsService.sendVerificationSms(phone, data.data.code);
        break;

      default:
        // For other types, send a generic SMS
        const body = data.data.message || `Stable Ride: ${data.type.replace(/_/g, ' ')}`;
        await SmsService.sendSms({ to: phone, body });
    }
  }

  private summarizeChanges(changes: any): string {
    if (!changes) return 'Updated';
    
    const summaries = [];
    if (changes.dateTime) summaries.push('Time changed');
    if (changes.locations) summaries.push('Location changed');
    if (changes.serviceType) summaries.push('Service type changed');
    
    return summaries.length > 0 ? summaries.join(', ') : 'Updated';
  }

  private async sendPushNotification(data: NotificationData): Promise<void> {
    // TODO: Implement push notifications
    console.log('Push notification not implemented yet:', data);
  }

  private renderTemplate(template: string, data: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] || match;
    });
  }

  async getUserPreferences(userId: string): Promise<NotificationPreferences | null> {
    return prisma.notificationPreferences.findUnique({
      where: { userId }
    });
  }

  private shouldSendNotification(channel: string, preferences: NotificationPreferences | null): boolean {
    if (!preferences) return true; // Default to sending if no preferences

    switch (channel) {
      case 'email':
        return preferences.emailEnabled;
      case 'sms':
        return preferences.smsEnabled;
      case 'push':
        return preferences.pushEnabled;
      default:
        return false;
    }
  }

  async updateUserPreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    // Convert time strings to DateTime or null
    const processedPreferences = { ...preferences };
    
    if ('quietHoursStart' in processedPreferences) {
      if (!processedPreferences.quietHoursStart || processedPreferences.quietHoursStart === '') {
        processedPreferences.quietHoursStart = null;
      } else {
        // Convert time string (HH:MM) to a DateTime with today's date
        const [hours, minutes] = processedPreferences.quietHoursStart.split(':');
        const date = new Date();
        date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        processedPreferences.quietHoursStart = date;
      }
    }
    
    if ('quietHoursEnd' in processedPreferences) {
      if (!processedPreferences.quietHoursEnd || processedPreferences.quietHoursEnd === '') {
        processedPreferences.quietHoursEnd = null;
      } else {
        // Convert time string (HH:MM) to a DateTime with today's date
        const [hours, minutes] = processedPreferences.quietHoursEnd.split(':');
        const date = new Date();
        date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        processedPreferences.quietHoursEnd = date;
      }
    }

    return prisma.notificationPreferences.upsert({
      where: { userId },
      update: processedPreferences,
      create: {
        userId,
        ...processedPreferences
      }
    });
  }

  async getNotificationHistory(userId: string, limit = 50): Promise<Notification[]> {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  }
}

// Convenience functions for specific notification types
export async function sendConfirmationEmail(data: ConfirmationEmailData): Promise<void> {
  const service = new NotificationService();
  
  await service.sendNotification({
    userId: data.booking.userId,
    type: 'booking_confirmation',
    channel: 'email',
    recipient: data.booking.user.email,
    subject: `Booking Created - Payment Required - ${data.confirmation.bookingReference}`,
    bookingId: data.booking.id,
    data: {
      customerName: `${data.booking.user.firstName} ${data.booking.user.lastName}`,
      bookingReference: data.confirmation.bookingReference,
      confirmationNumber: data.confirmation.confirmationNumber,
      pickupDate: format(new Date(data.booking.scheduledDateTime), 'EEEE, MMMM d, yyyy'),
      pickupTime: format(new Date(data.booking.scheduledDateTime), 'h:mm a'),
      pickupAddress: data.booking.pickupAddress,
      dropoffAddress: data.booking.dropoffAddress,
      serviceType: data.booking.serviceType.replace('_', ' '),
      totalAmount: data.booking.totalAmount,
      pdfUrl: data.pdfUrl,
      paymentUrl: `${process.env.APP_URL}/payment/${data.booking.id}`,
      calendarInvite: data.calendarInvite
    }
  });
}

export async function sendModificationEmail(booking: any, modification: any): Promise<void> {
  const service = new NotificationService();
  
  await service.sendNotification({
    userId: booking.userId,
    type: 'booking_modification',
    channel: 'email',
    recipient: booking.user.email,
    subject: `Booking Modified - ${booking.confirmation.bookingReference}`,
    bookingId: booking.id,
    data: {
      customerName: `${booking.user.firstName} ${booking.user.lastName}`,
      bookingReference: booking.confirmation.bookingReference,
      changes: modification.changes,
      priceDifference: modification.priceDifference,
      newTotal: booking.totalAmount
    }
  });
}

export async function sendCancellationEmail(booking: any, cancellation: any): Promise<void> {
  const service = new NotificationService();
  
  await service.sendNotification({
    userId: booking.userId,
    type: 'booking_cancellation',
    channel: 'email',
    recipient: booking.user.email,
    subject: `Booking Cancelled - ${booking.confirmation.bookingReference}`,
    bookingId: booking.id,
    data: {
      customerName: `${booking.user.firstName} ${booking.user.lastName}`,
      bookingReference: booking.confirmation.bookingReference,
      cancellationReason: cancellation.cancellationReason,
      refundAmount: cancellation.refundAmount,
      refundStatus: cancellation.refundStatus
    }
  });
}

export async function sendPickupReminder(booking: any): Promise<void> {
  const service = new NotificationService();
  
  await service.sendNotification({
    userId: booking.userId,
    type: 'pickup_reminder',
    channel: 'email',
    recipient: booking.user.email,
    subject: `Pickup Reminder - Your ride in 30 minutes`,
    bookingId: booking.id,
    data: {
      customerName: `${booking.user.firstName} ${booking.user.lastName}`,
      pickupTime: format(new Date(booking.scheduledDateTime), 'h:mm a'),
      pickupAddress: booking.pickupAddress,
      driverName: booking.driver?.name || 'TBD',
      driverPhone: booking.driver?.phone || 'TBD'
    }
  });
}

export async function sendPaymentConfirmationEmail(data: {
  booking: any;
  confirmation: any;
  payment: any;
  receiptUrl?: string;
}): Promise<void> {
  const service = new NotificationService();
  
  await service.sendNotification({
    userId: data.booking.userId,
    type: 'payment_confirmation',
    channel: 'email',
    recipient: data.booking.user.email,
    subject: `Payment Confirmed - ${data.confirmation.bookingReference}`,
    bookingId: data.booking.id,
    data: {
      customerName: `${data.booking.user.firstName} ${data.booking.user.lastName}`,
      bookingReference: data.confirmation.bookingReference,
      confirmationNumber: data.confirmation.confirmationNumber,
      pickupDate: format(new Date(data.booking.scheduledDateTime), 'EEEE, MMMM d, yyyy'),
      pickupTime: format(new Date(data.booking.scheduledDateTime), 'h:mm a'),
      pickupAddress: data.booking.pickupAddress,
      dropoffAddress: data.booking.dropoffAddress,
      serviceType: data.booking.serviceType.replace('_', ' '),
      totalAmount: data.payment.amount,
      paymentMethod: data.payment.paymentMethodId ? 'Card' : 'Unknown',
      receiptUrl: data.receiptUrl
    }
  });
}

export async function sendPaymentReceiptEmail(data: {
  booking: any;
  confirmation: any;
  payment: any;
  pdfAttachment?: {
    content: string;
    filename: string;
  };
}): Promise<void> {
  const service = new NotificationService();
  
  // Use the enhanced notification data structure to include attachment
  const notificationData: any = {
    customerName: `${data.booking.user.firstName} ${data.booking.user.lastName}`,
    bookingReference: data.confirmation.bookingReference,
    confirmationNumber: data.confirmation.confirmationNumber,
    pickupDate: format(new Date(data.booking.scheduledDateTime), 'EEEE, MMMM d, yyyy'),
    pickupTime: format(new Date(data.booking.scheduledDateTime), 'h:mm a'),
    pickupAddress: data.booking.pickupAddress,
    dropoffAddress: data.booking.dropoffAddress,
    serviceType: data.booking.serviceType.replace('_', ' '),
    totalAmount: data.payment.amount,
    paymentMethod: data.payment.paymentMethodId ? 'Card' : 'Unknown',
    transactionId: data.payment.stripePaymentIntentId
  };

  // Add PDF attachment if provided
  if (data.pdfAttachment) {
    notificationData.pdfAttachment = data.pdfAttachment;
  }
  
  await service.sendNotification({
    userId: data.booking.userId,
    type: 'payment_receipt',
    channel: 'email',
    recipient: data.booking.user.email,
    subject: `Payment Receipt - ${data.confirmation.bookingReference}`,
    bookingId: data.booking.id,
    data: notificationData
  });
}

// SMS notification convenience functions
export async function sendBookingConfirmationSms(booking: any, phone: string): Promise<void> {
  const service = new NotificationService();
  
  await service.sendNotification({
    userId: booking.userId,
    type: 'booking_confirmation',
    channel: 'sms',
    recipient: phone,
    bookingId: booking.id,
    data: {
      bookingReference: booking.confirmation?.bookingReference || booking.id,
      pickupDate: format(new Date(booking.scheduledDateTime), 'MMM d'),
      pickupTime: format(new Date(booking.scheduledDateTime), 'h:mm a'),
      pickupAddress: booking.pickupAddress
    }
  });
}

export async function sendPaymentConfirmationSms(booking: any, payment: any, phone: string): Promise<void> {
  const service = new NotificationService();
  
  await service.sendNotification({
    userId: booking.userId,
    type: 'payment_confirmation',
    channel: 'sms',
    recipient: phone,
    bookingId: booking.id,
    data: {
      bookingReference: booking.confirmation?.bookingReference || booking.id,
      totalAmount: payment.amount.toFixed(2)
    }
  });
}

export async function sendPickupReminderSms(booking: any, phone: string): Promise<void> {
  const service = new NotificationService();
  
  await service.sendNotification({
    userId: booking.userId,
    type: 'pickup_reminder',
    channel: 'sms',
    recipient: phone,
    bookingId: booking.id,
    data: {
      bookingReference: booking.confirmation?.bookingReference || booking.id,
      pickupTime: format(new Date(booking.scheduledDateTime), 'h:mm a'),
      driverName: booking.driver?.name,
      vehicleInfo: booking.driver?.vehicleInfo
    }
  });
}