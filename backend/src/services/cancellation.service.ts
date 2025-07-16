import { prisma } from '../config/database';
import { Booking, Cancellation, Payment } from '@prisma/client';
import { ApiError } from '../utils/errors';
import { stripeService } from './stripe.service';
import { sendCancellationEmail } from './notification.service';
import { differenceInHours } from 'date-fns';
import { generateCancellationReference } from '../utils/referenceGenerator';

export interface CancellationRequest {
  bookingId: string;
  userId: string;
  reason?: string;
  cancellationType?: 'customer' | 'driver' | 'system';
}

export interface CancellationPolicy {
  timeframes: {
    fullRefund: number;        // 24 hours before = 100% refund
    partialRefund: number;     // 2 hours before = 50% refund
    noRefund: number;          // Less than 2 hours = 0% refund
  };
  tripProtectionOverride: boolean;
  emergencyExceptions: string[];
  cancellationFees: {
    standard: number;          // $10 standard cancellation fee
    lastMinute: number;        // $25 last-minute cancellation fee
  };
}

const defaultPolicy: CancellationPolicy = {
  timeframes: {
    fullRefund: 24,
    partialRefund: 2,
    noRefund: 0
  },
  tripProtectionOverride: true,
  emergencyExceptions: ['medical_emergency', 'weather', 'vehicle_breakdown'],
  cancellationFees: {
    standard: 10,
    lastMinute: 25
  }
};

export class CancellationService {
  async cancelBooking(request: CancellationRequest): Promise<Cancellation> {
    // Get booking with all related data
    const booking = await prisma.booking.findUnique({
      where: { id: request.bookingId },
      include: {
        user: true,
        payment: true,
        enhancements: true,
        confirmation: true
      }
    });

    if (!booking) {
      throw new ApiError('Booking not found', 404);
    }

    if (booking.userId !== request.userId) {
      throw new ApiError('Unauthorized to cancel this booking', 403);
    }

    if (booking.status === 'CANCELLED') {
      throw new ApiError('Booking is already cancelled', 400);
    }

    if (booking.status === 'COMPLETED') {
      throw new ApiError('Cannot cancel completed booking', 400);
    }

    // Calculate refund amount
    const { refundAmount, cancellationFee, tripProtectionApplied } = await this.calculateRefund(
      booking,
      request.reason
    );

    // Create cancellation record
    const cancellation = await prisma.cancellation.create({
      data: {
        bookingId: request.bookingId,
        cancelledBy: request.userId,
        cancellationReason: request.reason,
        cancellationType: request.cancellationType || 'customer',
        refundAmount,
        refundStatus: refundAmount > 0 ? 'pending' : 'not_applicable',
        tripProtectionApplied
      }
    });

    // Update booking status
    await prisma.booking.update({
      where: { id: request.bookingId },
      data: {
        status: 'CANCELLED',
        cancellationId: cancellation.id
      }
    });

    // Process refund if applicable
    if (refundAmount > 0 && booking.payment) {
      await this.processRefund(booking.payment, cancellation, refundAmount);
    }

    // Send cancellation email
    await sendCancellationEmail(booking, cancellation);

    return cancellation;
  }

  private async calculateRefund(
    booking: any,
    cancellationReason?: string
  ): Promise<{ refundAmount: number; cancellationFee: number; tripProtectionApplied: boolean }> {
    const hoursUntilPickup = differenceInHours(
      new Date(booking.scheduledDateTime),
      new Date()
    );

    const paidAmount = Number(booking.payment?.amount || 0);
    let refundPercentage = 0;
    let cancellationFee = 0;
    let tripProtectionApplied = false;

    // Check if trip protection was purchased
    const hasTripProtection = booking.enhancements?.tripProtection || false;

    // Emergency exceptions get full refund
    if (cancellationReason && defaultPolicy.emergencyExceptions.includes(cancellationReason)) {
      refundPercentage = 100;
      cancellationFee = 0;
    }
    // Trip protection provides full refund minus small fee
    else if (hasTripProtection && defaultPolicy.tripProtectionOverride) {
      refundPercentage = 100;
      cancellationFee = 5; // Small processing fee
      tripProtectionApplied = true;
    }
    // Standard cancellation policy
    else {
      if (hoursUntilPickup >= defaultPolicy.timeframes.fullRefund) {
        refundPercentage = 100;
        cancellationFee = defaultPolicy.cancellationFees.standard;
      } else if (hoursUntilPickup >= defaultPolicy.timeframes.partialRefund) {
        refundPercentage = 50;
        cancellationFee = defaultPolicy.cancellationFees.standard;
      } else {
        refundPercentage = 0;
        cancellationFee = defaultPolicy.cancellationFees.lastMinute;
      }
    }

    const grossRefund = (paidAmount * refundPercentage) / 100;
    const refundAmount = Math.max(0, grossRefund - cancellationFee);

    return {
      refundAmount,
      cancellationFee,
      tripProtectionApplied
    };
  }

  private async processRefund(
    payment: Payment,
    cancellation: Cancellation,
    refundAmount: number
  ): Promise<void> {
    try {
      // Process refund through Stripe
      const refund = await stripeService.createRefund({
        paymentIntentId: payment.stripePaymentIntentId!,
        amount: refundAmount, // stripeService.createRefund will convert to cents
        metadata: {
          bookingId: payment.bookingId,
          cancellationId: cancellation.id
        }
      });

      // Update cancellation with refund details
      await prisma.cancellation.update({
        where: { id: cancellation.id },
        data: {
          refundStatus: 'processing',
          refundTransactionId: refund.id,
          refundProcessedAt: new Date()
        }
      });

      // Update payment status
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'REFUNDED'
        }
      });

    } catch (error) {
      console.error('Refund processing error:', error);
      
      await prisma.cancellation.update({
        where: { id: cancellation.id },
        data: {
          refundStatus: 'failed'
        }
      });

      throw new ApiError('Failed to process refund', 500);
    }
  }

  async getCancellationDetails(bookingId: string, userId: string): Promise<Cancellation | null> {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { cancellation: true }
    });

    if (!booking || booking.userId !== userId) {
      throw new ApiError('Booking not found or unauthorized', 404);
    }

    return booking.cancellation;
  }

  async updateRefundStatus(cancellationId: string, status: string): Promise<Cancellation> {
    return prisma.cancellation.update({
      where: { id: cancellationId },
      data: {
        refundStatus: status,
        refundProcessedAt: status === 'completed' ? new Date() : undefined
      }
    });
  }

  async getCancellationPolicy(): Promise<CancellationPolicy> {
    // In a real application, this might fetch from database or config
    return defaultPolicy;
  }
}