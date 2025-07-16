import twilio from 'twilio';
import { twilioConfig, isTwilioConfigured } from '../config/twilio.config';
import { logger } from '../config/logger';
import { AppError } from '../middleware/error';

// Initialize Twilio client
let twilioClient: twilio.Twilio | null = null;

if (isTwilioConfigured()) {
  twilioClient = twilio(twilioConfig.accountSid, twilioConfig.authToken);
  logger.info('Twilio SMS service initialized');
} else {
  logger.warn('Twilio configuration incomplete, SMS notifications will be disabled');
}

export interface SmsOptions {
  to: string;
  body: string;
  mediaUrl?: string[];
}

export class SmsService {
  /**
   * Send an SMS message
   */
  static async sendSms(options: SmsOptions): Promise<string | null> {
    if (!twilioClient) {
      logger.warn('Twilio not configured, skipping SMS send');
      return null;
    }

    try {
      // Format phone number (ensure it includes country code)
      const formattedPhone = this.formatPhoneNumber(options.to);

      const messageOptions: any = {
        body: options.body,
        to: formattedPhone,
      };

      // Use messaging service SID if available, otherwise use phone number
      if (twilioConfig.messagingServiceSid) {
        messageOptions.messagingServiceSid = twilioConfig.messagingServiceSid;
      } else {
        messageOptions.from = twilioConfig.phoneNumber;
      }

      // Add media URLs if provided (for MMS)
      if (options.mediaUrl && options.mediaUrl.length > 0) {
        messageOptions.mediaUrl = options.mediaUrl;
      }

      const message = await twilioClient.messages.create(messageOptions);

      logger.info('SMS sent successfully', {
        sid: message.sid,
        to: formattedPhone,
        status: message.status
      });

      return message.sid;
    } catch (error: any) {
      logger.error('Failed to send SMS', {
        error: error.message,
        to: options.to
      });
      throw new AppError('Failed to send SMS notification', 500);
    }
  }

  /**
   * Format phone number to E.164 format
   */
  private static formatPhoneNumber(phone: string): string {
    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, '');

    // If it's a US number without country code, add +1
    if (cleaned.length === 10) {
      return `+1${cleaned}`;
    }

    // If it already has country code but no +
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+${cleaned}`;
    }

    // If it already has + at the beginning, return as is
    if (phone.startsWith('+')) {
      return phone;
    }

    // Otherwise, assume it needs a + prefix
    return `+${cleaned}`;
  }

  /**
   * Send booking confirmation SMS
   */
  static async sendBookingConfirmationSms(phone: string, data: {
    bookingReference: string;
    pickupDate: string;
    pickupTime: string;
    pickupAddress: string;
  }): Promise<void> {
    const body = `Stable Ride Booking ${data.bookingReference}\n\n` +
      `Pickup: ${data.pickupDate} at ${data.pickupTime}\n` +
      `Location: ${data.pickupAddress}\n\n` +
      `Complete payment to confirm your booking.`;

    await this.sendSms({ to: phone, body });
  }

  /**
   * Send payment confirmation SMS
   */
  static async sendPaymentConfirmationSms(phone: string, data: {
    bookingReference: string;
    amount: string;
  }): Promise<void> {
    const body = `Payment confirmed for booking ${data.bookingReference}. ` +
      `Amount: $${data.amount}. ` +
      `Your ride is confirmed. Thank you for choosing Stable Ride!`;

    await this.sendSms({ to: phone, body });
  }

  /**
   * Send pickup reminder SMS
   */
  static async sendPickupReminderSms(phone: string, data: {
    bookingReference: string;
    pickupTime: string;
    driverName?: string;
    vehicleInfo?: string;
  }): Promise<void> {
    let body = `Reminder: Your Stable Ride pickup is at ${data.pickupTime} (Ref: ${data.bookingReference}).`;
    
    if (data.driverName) {
      body += `\nDriver: ${data.driverName}`;
    }
    
    if (data.vehicleInfo) {
      body += `\nVehicle: ${data.vehicleInfo}`;
    }

    await this.sendSms({ to: phone, body });
  }

  /**
   * Send cancellation SMS
   */
  static async sendCancellationSms(phone: string, data: {
    bookingReference: string;
    refundAmount?: string;
  }): Promise<void> {
    let body = `Your Stable Ride booking ${data.bookingReference} has been cancelled.`;
    
    if (data.refundAmount) {
      body += ` A refund of $${data.refundAmount} will be processed within 5-7 business days.`;
    }

    await this.sendSms({ to: phone, body });
  }

  /**
   * Send modification SMS
   */
  static async sendModificationSms(phone: string, data: {
    bookingReference: string;
    changes: string;
  }): Promise<void> {
    const body = `Your Stable Ride booking ${data.bookingReference} has been modified. ` +
      `Changes: ${data.changes}. ` +
      `Check your email for full details.`;

    await this.sendSms({ to: phone, body });
  }

  /**
   * Send verification code SMS
   */
  static async sendVerificationSms(phone: string, code: string): Promise<void> {
    const body = `Your Stable Ride verification code is: ${code}. ` +
      `This code will expire in 10 minutes.`;

    await this.sendSms({ to: phone, body });
  }
}