import { prisma } from '../config/database';
import { Booking, BookingConfirmation, User } from '@prisma/client';
import { ApiError } from '../utils/errors';
import { generateBookingReference, generateConfirmationNumber } from '../utils/referenceGenerator';
import { sendConfirmationEmail } from './notification.service';
import { generateCalendarInvite } from './calendar.service';
import { generatePdfReceipt } from './pdf.service';
import { addHours } from 'date-fns';

interface BookingWithDetails extends Booking {
  user: User;
  enhancements?: any;
  payment?: any;
}

export class BookingConfirmationService {
  async createConfirmation(bookingId: string, tx?: any): Promise<BookingConfirmation> {
    // Use transaction if provided, otherwise use default prisma client
    const db = tx || prisma;
    
    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: true,
        enhancements: true,
        payment: true
      }
    });

    if (!booking) {
      throw new ApiError('Booking not found', 404);
    }

    // Check if confirmation already exists
    const existingConfirmation = await db.bookingConfirmation.findUnique({
      where: { bookingId }
    });

    if (existingConfirmation) {
      return existingConfirmation;
    }

    // Generate unique references
    const bookingReference = await this.generateUniqueBookingReference(db);
    const confirmationNumber = generateConfirmationNumber();

    // Calculate modification deadline (2 hours before pickup)
    const modificationDeadline = addHours(booking.scheduledDateTime, -2);

    // Create confirmation record
    const confirmation = await db.bookingConfirmation.create({
      data: {
        bookingId,
        bookingReference,
        confirmationNumber,
        status: 'confirmed',
        modificationDeadline
      }
    });

    // Update booking with confirmation ID
    await db.booking.update({
      where: { id: bookingId },
      data: { 
        confirmationId: confirmation.id
        // Status remains PENDING until payment is confirmed
      }
    });

    // Send confirmation email asynchronously
    this.processConfirmationNotifications(booking as BookingWithDetails, confirmation)
      .catch(error => {
        console.error('Error processing confirmation notifications:', error);
      });

    return confirmation;
  }

  private async generateUniqueBookingReference(db: any = prisma): Promise<string> {
    let reference: string;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      reference = generateBookingReference();
      const existing = await db.bookingConfirmation.findUnique({
        where: { bookingReference: reference }
      });

      if (!existing) {
        return reference;
      }

      attempts++;
    } while (attempts < maxAttempts);

    throw new ApiError('Failed to generate unique booking reference', 500);
  }

  private async processConfirmationNotifications(
    booking: BookingWithDetails,
    confirmation: BookingConfirmation
  ): Promise<void> {
    try {
      // Generate PDF receipt
      const pdfUrl = await generatePdfReceipt(booking, confirmation);

      // Update confirmation with PDF URL
      await prisma.bookingConfirmation.update({
        where: { id: confirmation.id },
        data: { pdfReceiptUrl: pdfUrl }
      });

      // Generate calendar invite
      const calendarInvite = await generateCalendarInvite(booking, confirmation);

      // Send confirmation email with attachments
      await sendConfirmationEmail({
        booking,
        confirmation,
        pdfUrl,
        calendarInvite
      });

      // Update confirmation status
      await prisma.bookingConfirmation.update({
        where: { id: confirmation.id },
        data: {
          confirmationSentAt: new Date(),
          calendarInviteSent: true
        }
      });

    } catch (error) {
      console.error('Error in processConfirmationNotifications:', error);
      throw error;
    }
  }

  async getConfirmation(bookingId: string, userId: string): Promise<BookingConfirmation | null> {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { confirmation: true }
    });

    if (!booking || booking.userId !== userId) {
      throw new ApiError('Booking not found or unauthorized', 404);
    }

    return booking.confirmation;
  }

  async getConfirmationByReference(reference: string): Promise<BookingConfirmation | null> {
    return prisma.bookingConfirmation.findUnique({
      where: { bookingReference: reference },
      include: {
        bookings: {
          include: {
            user: true,
            enhancements: true,
            payment: true
          }
        }
      }
    });
  }

  async resendConfirmation(bookingId: string, userId: string): Promise<void> {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: true,
        confirmation: true,
        enhancements: true,
        payment: true
      }
    });

    if (!booking || booking.userId !== userId) {
      throw new ApiError('Booking not found or unauthorized', 404);
    }

    if (!booking.confirmation) {
      throw new ApiError('No confirmation found for this booking', 404);
    }

    // Resend confirmation email
    await this.processConfirmationNotifications(
      booking as BookingWithDetails,
      booking.confirmation
    );
  }

  async validateModificationDeadline(bookingId: string): Promise<boolean> {
    const confirmation = await prisma.bookingConfirmation.findFirst({
      where: { bookingId }
    });

    if (!confirmation) {
      throw new ApiError('Booking confirmation not found', 404);
    }

    return new Date() < confirmation.modificationDeadline;
  }
}