import { prisma } from '../config/database';
import { logger } from '../config/logger';
import { AppError } from '../middleware/error';
import { quoteService } from './quote.service';
import { BookingConfirmationService } from './bookingConfirmation.service';
import type { Booking, BookingStatus, ServiceType } from '@prisma/client';

interface CreateBookingParams {
  userId: string;
  serviceType: string;
  pickupAddress: string;
  pickupLatitude: number;
  pickupLongitude: number;
  dropoffAddress?: string;
  dropoffLatitude?: number;
  dropoffLongitude?: number;
  scheduledDateTime: Date;
  returnDateTime?: Date;
  durationHours?: number;
  specialInstructions?: string;
  contactPhone: string;
  quoteId?: string;
  gratuityPercentage?: number;
  gratuityAmount?: number;
  enhancementCost?: number;
}

interface UpdateBookingParams {
  status?: BookingStatus;
  notes?: string;
}

export class BookingService {
  private confirmationService = new BookingConfirmationService();
  /**
   * Create a new booking
   */
  async createBooking(params: CreateBookingParams): Promise<Booking> {
    try {
      // Validate service type
      const serviceType = this.mapServiceType(params.serviceType);
      
      // If quote ID provided, validate it
      let totalAmount = 0;
      if (params.quoteId) {
        const quote = await prisma.quote.findUnique({
          where: { id: params.quoteId }
        });
        
        if (!quote) {
          throw new AppError(404, 'Quote not found');
        }
        
        if (quote.userId !== params.userId) {
          throw new AppError(403, 'Quote belongs to another user');
        }
        
        if (new Date(quote.validUntil) < new Date()) {
          throw new AppError(400, 'Quote has expired');
        }
        
        totalAmount = quote.totalAmount.toNumber();
      } else {
        // Calculate price if no quote provided
        const quoteParams = {
          userId: params.userId,
          serviceType: params.serviceType,
          pickupLocation: {
            address: params.pickupAddress,
            lat: params.pickupLatitude,
            lng: params.pickupLongitude
          },
          dropoffLocation: params.dropoffAddress ? {
            address: params.dropoffAddress,
            lat: params.dropoffLatitude!,
            lng: params.dropoffLongitude!
          } : undefined,
          pickupDateTime: params.scheduledDateTime,
          returnDateTime: params.returnDateTime,
          durationHours: params.durationHours
        };
        
        const quoteResult = await quoteService.createQuote(quoteParams);
        totalAmount = quoteResult.total;
      }
      
      // Add gratuity if provided
      if (params.gratuityAmount && params.gratuityAmount > 0) {
        totalAmount += params.gratuityAmount;
      }
      
      // Add enhancement cost if provided
      if (params.enhancementCost && params.enhancementCost > 0) {
        totalAmount += params.enhancementCost;
      }

      // Update user phone if provided
      if (params.contactPhone) {
        await prisma.user.update({
          where: { id: params.userId },
          data: { phone: params.contactPhone }
        });
      }

      // Create booking and confirmation in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create booking
        const booking = await tx.booking.create({
          data: {
            userId: params.userId,
            serviceType,
            status: 'PENDING',
            scheduledDateTime: params.scheduledDateTime,
            pickupAddress: params.pickupAddress,
            dropoffAddress: params.dropoffAddress || params.pickupAddress, // Default to pickup if one-way
            totalAmount,
            notes: params.specialInstructions
          },
          include: {
            user: true
          }
        });

        logger.info('Booking created', { 
          bookingId: booking.id,
          userId: params.userId,
          serviceType 
        });

        // Create booking confirmation synchronously
        try {
          await this.confirmationService.createConfirmation(booking.id, tx);
        } catch (error) {
          logger.error('Failed to create booking confirmation', { 
            bookingId: booking.id, 
            error 
          });
          throw new AppError(500, 'Failed to create booking confirmation');
        }

        return booking;
      });

      return result;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to create booking', error);
      throw new AppError(500, 'Failed to create booking');
    }
  }

  /**
   * Get booking by ID
   */
  async getBooking(bookingId: string, userId?: string): Promise<Booking | null> {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: true,
        payment: true
      }
    });

    if (booking && userId && booking.userId !== userId) {
      throw new AppError(403, 'Not authorized to view this booking');
    }

    return booking;
  }

  /**
   * Get user's bookings
   */
  async getUserBookings(
    userId: string,
    status?: BookingStatus,
    limit: number = 10,
    offset: number = 0
  ): Promise<{ bookings: Booking[]; total: number }> {
    const where = {
      userId,
      ...(status && { status })
    };

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          payment: true
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.booking.count({ where })
    ]);

    return { bookings, total };
  }

  /**
   * Update booking
   */
  async updateBooking(
    bookingId: string,
    userId: string,
    params: UpdateBookingParams
  ): Promise<Booking> {
    const booking = await this.getBooking(bookingId, userId);
    
    if (!booking) {
      throw new AppError(404, 'Booking not found');
    }

    // Validate status transitions
    if (params.status) {
      this.validateStatusTransition(booking.status, params.status);
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: params,
      include: {
        user: true,
        payment: true
      }
    });

    logger.info('Booking updated', { 
      bookingId,
      updates: params 
    });

    return updatedBooking;
  }

  /**
   * Cancel booking
   */
  async cancelBooking(bookingId: string, userId: string): Promise<Booking> {
    const booking = await this.getBooking(bookingId, userId);
    
    if (!booking) {
      throw new AppError(404, 'Booking not found');
    }

    if (booking.status !== 'PENDING' && booking.status !== 'CONFIRMED') {
      throw new AppError(400, 'Cannot cancel booking in current status');
    }

    // Check cancellation policy (24 hours before pickup)
    const hoursUntilPickup = (booking.scheduledDateTime.getTime() - Date.now()) / (1000 * 60 * 60);
    if (hoursUntilPickup < 24) {
      throw new AppError(400, 'Cannot cancel booking within 24 hours of pickup');
    }

    return this.updateBooking(bookingId, userId, { status: 'CANCELLED' });
  }

  /**
   * Map service type string to enum
   */
  private mapServiceType(serviceType: string): ServiceType {
    const normalized = serviceType.toUpperCase().replace('-', '_');
    
    switch (normalized) {
      case 'ONE_WAY':
        return 'ONE_WAY';
      case 'ROUNDTRIP':
        return 'ROUNDTRIP';
      case 'HOURLY':
        return 'HOURLY';
      default:
        throw new AppError(400, `Invalid service type: ${serviceType}`);
    }
  }

  /**
   * Validate booking status transitions
   */
  private validateStatusTransition(current: BookingStatus, next: BookingStatus): void {
    const validTransitions: Record<BookingStatus, BookingStatus[]> = {
      PENDING: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['IN_PROGRESS', 'CANCELLED'],
      IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
      COMPLETED: [],
      CANCELLED: []
    };

    if (!validTransitions[current].includes(next)) {
      throw new AppError(400, `Cannot transition from ${current} to ${next}`);
    }
  }
}

export const bookingService = new BookingService();