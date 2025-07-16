import { prisma } from '../config/database';
import { Booking, BookingModification, User } from '@prisma/client';
import { ApiError } from '../utils/errors';
import { BookingConfirmationService } from './bookingConfirmation.service';
import { sendModificationEmail } from './notification.service';
import { calculateBookingPrice } from './pricing.service';
import { differenceInHours } from 'date-fns';

export interface ModificationRequest {
  bookingId: string;
  userId: string;
  changes: {
    dateTime?: {
      newPickupTime: Date;
      newReturnTime?: Date;
    };
    locations?: {
      newPickupAddress?: string;
      newDropoffAddress?: string;
    };
    serviceType?: {
      from: string;
      to: string;
    };
    enhancements?: {
      added: any[];
      removed: any[];
    };
    passengerCount?: number;
  };
  reason?: string;
}

export interface ModificationResult {
  modification: BookingModification;
  priceDifference: number;
  modificationFee: number;
  requiresPayment: boolean;
  newTotal: number;
}

export class BookingModificationService {
  private confirmationService = new BookingConfirmationService();

  async modifyBooking(request: ModificationRequest): Promise<ModificationResult> {
    // Get booking with all related data
    const booking = await prisma.booking.findUnique({
      where: { id: request.bookingId },
      include: {
        user: true,
        confirmation: true,
        enhancements: true,
        payment: true
      }
    });

    if (!booking) {
      throw new ApiError('Booking not found', 404);
    }

    if (booking.userId !== request.userId) {
      throw new ApiError('Unauthorized to modify this booking', 403);
    }

    // Check if booking can be modified
    await this.validateModification(booking);

    // Calculate price difference
    const { priceDifference, modificationFee, newTotal } = await this.calculatePriceDifference(
      booking,
      request.changes
    );

    // Store original data
    const originalData = {
      scheduledDateTime: booking.scheduledDateTime,
      pickupAddress: booking.pickupAddress,
      dropoffAddress: booking.dropoffAddress,
      serviceType: booking.serviceType,
      totalAmount: booking.totalAmount,
      enhancements: booking.enhancements
    };

    // Create modification record
    const modification = await prisma.bookingModification.create({
      data: {
        bookingId: request.bookingId,
        modifiedBy: request.userId,
        modificationType: this.getModificationType(request.changes),
        originalData: originalData,
        newData: request.changes,
        priceDifference,
        modificationFee,
        reason: request.reason,
        status: 'pending'
      }
    });

    // Return result for payment processing if needed
    return {
      modification,
      priceDifference,
      modificationFee,
      requiresPayment: priceDifference > 0,
      newTotal
    };
  }

  async applyModification(modificationId: string): Promise<Booking> {
    const modification = await prisma.bookingModification.findUnique({
      where: { id: modificationId },
      include: { booking: true }
    });

    if (!modification) {
      throw new ApiError('Modification not found', 404);
    }

    if (modification.status !== 'pending') {
      throw new ApiError('Modification already processed', 400);
    }

    const changes = modification.newData as any;
    const updateData: any = {};

    // Apply changes
    if (changes.dateTime) {
      updateData.scheduledDateTime = changes.dateTime.newPickupTime;
    }

    if (changes.locations) {
      if (changes.locations.newPickupAddress) {
        updateData.pickupAddress = changes.locations.newPickupAddress;
      }
      if (changes.locations.newDropoffAddress) {
        updateData.dropoffAddress = changes.locations.newDropoffAddress;
      }
    }

    if (changes.serviceType) {
      updateData.serviceType = changes.serviceType.to;
    }

    // Update total amount
    const newTotal = Number(modification.booking.totalAmount) + Number(modification.priceDifference);
    updateData.totalAmount = newTotal;

    // Update booking
    const updatedBooking = await prisma.booking.update({
      where: { id: modification.bookingId },
      data: {
        ...updateData,
        isModified: true,
        modificationCount: { increment: 1 }
      },
      include: {
        user: true,
        confirmation: true,
        enhancements: true
      }
    });

    // Update modification status
    await prisma.bookingModification.update({
      where: { id: modificationId },
      data: {
        status: 'completed',
        processedAt: new Date()
      }
    });

    // Send modification confirmation email
    await sendModificationEmail(updatedBooking, {
      changes: this.formatChangesForEmail(changes),
      priceDifference: modification.priceDifference,
      modificationFee: modification.modificationFee
    });

    return updatedBooking;
  }

  private async validateModification(booking: any): Promise<void> {
    // Check booking status
    if (booking.status === 'CANCELLED') {
      throw new ApiError('Cannot modify cancelled booking', 400);
    }

    if (booking.status === 'COMPLETED') {
      throw new ApiError('Cannot modify completed booking', 400);
    }

    // Check modification deadline
    const canModify = await this.confirmationService.validateModificationDeadline(booking.id);
    if (!canModify) {
      throw new ApiError('Modification deadline has passed (2 hours before pickup)', 400);
    }

    // Check modification limit
    if (booking.modificationCount >= 3) {
      throw new ApiError('Maximum modification limit reached', 400);
    }
  }

  private async calculatePriceDifference(
    booking: any,
    changes: any
  ): Promise<{ priceDifference: number; modificationFee: number; newTotal: number }> {
    let newPrice = Number(booking.totalAmount);
    let modificationFee = 0;

    // Major changes incur a modification fee
    if (changes.dateTime || changes.serviceType) {
      modificationFee = 10; // $10 modification fee
    }

    // Calculate new price if service type or route changes
    if (changes.serviceType || changes.locations) {
      const newServiceType = changes.serviceType?.to || booking.serviceType;
      const newPickup = changes.locations?.newPickupAddress || booking.pickupAddress;
      const newDropoff = changes.locations?.newDropoffAddress || booking.dropoffAddress;

      // TODO: Recalculate price based on new parameters
      // This would call the pricing service with new parameters
      // For now, simulate a price change
      if (changes.serviceType) {
        const multiplier = newServiceType === 'LUXURY' ? 1.5 : 1.0;
        newPrice = Number(booking.totalAmount) * multiplier;
      }
    }

    const priceDifference = newPrice - Number(booking.totalAmount) + modificationFee;

    return {
      priceDifference,
      modificationFee,
      newTotal: newPrice + modificationFee
    };
  }

  private getModificationType(changes: any): string {
    const types = [];
    
    if (changes.dateTime) types.push('datetime');
    if (changes.locations) types.push('location');
    if (changes.serviceType) types.push('service');
    if (changes.enhancements) types.push('enhancements');
    if (changes.passengerCount) types.push('passengers');

    return types.join(',');
  }

  private formatChangesForEmail(changes: any): string {
    const changesList = [];

    if (changes.dateTime) {
      changesList.push(`New pickup time: ${new Date(changes.dateTime.newPickupTime).toLocaleString()}`);
    }

    if (changes.locations) {
      if (changes.locations.newPickupAddress) {
        changesList.push(`New pickup location: ${changes.locations.newPickupAddress}`);
      }
      if (changes.locations.newDropoffAddress) {
        changesList.push(`New dropoff location: ${changes.locations.newDropoffAddress}`);
      }
    }

    if (changes.serviceType) {
      changesList.push(`Service type changed from ${changes.serviceType.from} to ${changes.serviceType.to}`);
    }

    return changesList.join('\n');
  }

  async getModificationHistory(bookingId: string, userId: string): Promise<BookingModification[]> {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId }
    });

    if (!booking || booking.userId !== userId) {
      throw new ApiError('Booking not found or unauthorized', 404);
    }

    return prisma.bookingModification.findMany({
      where: { bookingId },
      orderBy: { createdAt: 'desc' }
    });
  }
}