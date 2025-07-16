import { PrismaClient, Prisma, BookingStatus, ServiceType } from '@prisma/client';
import { AppError } from '../utils/errors';
import { adminAuthService } from './adminAuth.service';
import { stripeService } from './stripe.service';
import { notificationService } from './notification.service';

const prisma = new PrismaClient();

export interface AdminBookingFilters {
  dateRange?: [Date, Date];
  status?: BookingStatus[];
  serviceType?: ServiceType[];
  customerEmail?: string;
  bookingReference?: string;
  amountRange?: [number, number];
  showCancelled?: boolean;
  showCompleted?: boolean;
  showPending?: boolean;
}

export interface AdminBookingSort {
  field: string;
  order: 'asc' | 'desc';
}

export interface PaginatedBookings {
  data: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class AdminBookingService {
  async searchBookings(
    filters: AdminBookingFilters,
    page: number = 1,
    limit: number = 20,
    sort?: AdminBookingSort
  ): Promise<PaginatedBookings> {
    const where: Prisma.BookingWhereInput = {};

    // Date range filter
    if (filters.dateRange) {
      where.scheduledDateTime = {
        gte: filters.dateRange[0],
        lte: filters.dateRange[1]
      };
    }

    // Status filter
    if (filters.status && filters.status.length > 0) {
      where.status = { in: filters.status };
    } else {
      const statusFilters: BookingStatus[] = [];
      if (!filters.showCancelled) statusFilters.push('CANCELLED');
      if (!filters.showCompleted) statusFilters.push('COMPLETED');
      if (!filters.showPending) statusFilters.push('PENDING');
      
      if (statusFilters.length < 5) {
        where.status = { notIn: statusFilters };
      }
    }

    // Service type filter
    if (filters.serviceType && filters.serviceType.length > 0) {
      where.serviceType = { in: filters.serviceType };
    }

    // Customer email filter
    if (filters.customerEmail) {
      where.user = {
        email: { contains: filters.customerEmail, mode: 'insensitive' }
      };
    }

    // Booking reference filter
    if (filters.bookingReference) {
      where.confirmation = {
        bookingReference: { contains: filters.bookingReference, mode: 'insensitive' }
      };
    }

    // Amount range filter
    if (filters.amountRange) {
      where.totalAmount = {
        gte: filters.amountRange[0],
        lte: filters.amountRange[1]
      };
    }

    // Default sort
    const orderBy: any = sort ? { [sort.field]: sort.order } : { createdAt: 'desc' };

    const [data, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true
            }
          },
          payment: true,
          confirmation: true,
          enhancements: true,
          cancellation: true
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy
      }),
      prisma.booking.count({ where })
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getBookingDetails(bookingId: string): Promise<any> {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: true,
        payment: true,
        confirmation: true,
        enhancements: true,
        modifications: {
          include: {
            user: true
          },
          orderBy: { createdAt: 'desc' }
        },
        cancellation: {
          include: {
            user: true
          }
        },
        quotes: true,
        notifications: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!booking) {
      throw new AppError('Booking not found', 404);
    }

    return booking;
  }

  async modifyBooking(
    bookingId: string,
    modificationData: any,
    adminId: string
  ): Promise<any> {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { payment: true }
    });

    if (!booking) {
      throw new AppError('Booking not found', 404);
    }

    if (booking.status === 'CANCELLED' || booking.status === 'COMPLETED') {
      throw new AppError(`Cannot modify ${booking.status.toLowerCase()} booking`, 400);
    }

    // Create modification record
    const modification = await prisma.bookingModification.create({
      data: {
        bookingId,
        modificationType: 'ADMIN_MODIFICATION',
        originalData: booking,
        newData: modificationData,
        priceDifference: modificationData.priceDifference || 0,
        modificationFee: 0, // No fee for admin modifications
        modifiedBy: adminId,
        reason: modificationData.reason || 'Admin modification',
        status: 'approved'
      }
    });

    // Update booking
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        ...modificationData.updates,
        isModified: true,
        modificationCount: { increment: 1 }
      }
    });

    // Handle payment adjustments if needed
    if (modificationData.priceDifference) {
      if (modificationData.priceDifference > 0) {
        // Additional charge needed
        // In production, you'd create a payment intent for the difference
      } else {
        // Refund needed
        if (booking.payment?.stripePaymentIntentId) {
          await stripeService.createRefund(
            booking.payment.stripePaymentIntentId,
            Math.abs(modificationData.priceDifference),
            'Admin modification refund'
          );
        }
      }
    }

    // Send notification to customer
    await notificationService.sendBookingModificationNotification(updatedBooking.id);

    // Log audit
    await adminAuthService.logAuditEntry(
      adminId,
      'BOOKING_MODIFIED',
      'bookings',
      bookingId,
      { modification, reason: modificationData.reason }
    );

    return updatedBooking;
  }

  async cancelBooking(
    bookingId: string,
    cancellationData: {
      reason: string;
      refundAmount: number;
      sendNotification: boolean;
    },
    adminId: string
  ): Promise<any> {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { payment: true, enhancements: true }
    });

    if (!booking) {
      throw new AppError('Booking not found', 404);
    }

    if (booking.status === 'CANCELLED') {
      throw new AppError('Booking is already cancelled', 400);
    }

    // Create cancellation record
    const cancellation = await prisma.cancellation.create({
      data: {
        bookingId,
        cancelledBy: adminId,
        cancellationReason: cancellationData.reason,
        cancellationType: 'ADMIN_CANCELLATION',
        refundAmount: cancellationData.refundAmount,
        refundStatus: 'pending',
        tripProtectionApplied: booking.enhancements?.tripProtection || false
      }
    });

    // Update booking status
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'CANCELLED',
        cancellationId: cancellation.id
      }
    });

    // Process refund if payment exists
    if (booking.payment?.stripePaymentIntentId && cancellationData.refundAmount > 0) {
      try {
        const refund = await stripeService.createRefund(
          booking.payment.stripePaymentIntentId,
          cancellationData.refundAmount,
          cancellationData.reason
        );

        await prisma.cancellation.update({
          where: { id: cancellation.id },
          data: {
            refundStatus: 'completed',
            refundTransactionId: refund.id,
            refundProcessedAt: new Date()
          }
        });
      } catch (error) {
        console.error('Refund failed:', error);
        await prisma.cancellation.update({
          where: { id: cancellation.id },
          data: {
            refundStatus: 'failed'
          }
        });
      }
    }

    // Send notification if requested
    if (cancellationData.sendNotification) {
      await notificationService.sendCancellationNotification(booking.id);
    }

    // Log audit
    await adminAuthService.logAuditEntry(
      adminId,
      'BOOKING_CANCELLED',
      'bookings',
      bookingId,
      { reason: cancellationData.reason, refundAmount: cancellationData.refundAmount }
    );

    return cancellation;
  }

  async processRefund(
    bookingId: string,
    refundData: {
      amount: number;
      reason: string;
    },
    adminId: string
  ): Promise<any> {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { payment: true }
    });

    if (!booking || !booking.payment) {
      throw new AppError('Booking or payment not found', 404);
    }

    if (!booking.payment.stripePaymentIntentId) {
      throw new AppError('No payment to refund', 400);
    }

    const refund = await stripeService.createRefund(
      booking.payment.stripePaymentIntentId,
      refundData.amount,
      refundData.reason
    );

    // Update payment status if full refund
    if (refundData.amount >= Number(booking.payment.amount)) {
      await prisma.payment.update({
        where: { id: booking.payment.id },
        data: { status: 'REFUNDED' }
      });
    }

    // Log audit
    await adminAuthService.logAuditEntry(
      adminId,
      'REFUND_PROCESSED',
      'payments',
      booking.payment.id,
      { amount: refundData.amount, reason: refundData.reason, refundId: refund.id }
    );

    return refund;
  }

  async exportBookings(
    filters: AdminBookingFilters,
    format: 'csv' | 'excel' = 'csv'
  ): Promise<string> {
    const bookings = await prisma.booking.findMany({
      where: this.buildWhereClause(filters),
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
            phone: true
          }
        },
        payment: true,
        confirmation: true
      },
      orderBy: { createdAt: 'desc' }
    });

    if (format === 'csv') {
      return this.generateCSV(bookings);
    } else {
      // Excel export would be implemented here
      throw new AppError('Excel export not yet implemented', 501);
    }
  }

  async getBookingStatistics(days: number = 30): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await prisma.booking.groupBy({
      by: ['status', 'serviceType'],
      where: {
        createdAt: { gte: startDate }
      },
      _count: true,
      _sum: {
        totalAmount: true
      }
    });

    const totalBookings = await prisma.booking.count({
      where: { createdAt: { gte: startDate } }
    });

    const totalRevenue = await prisma.payment.aggregate({
      where: {
        createdAt: { gte: startDate },
        status: 'COMPLETED'
      },
      _sum: {
        amount: true
      }
    });

    return {
      totalBookings,
      totalRevenue: totalRevenue._sum.amount || 0,
      byStatus: stats.reduce((acc, stat) => {
        acc[stat.status] = stat._count;
        return acc;
      }, {} as Record<string, number>),
      byServiceType: stats.reduce((acc, stat) => {
        acc[stat.serviceType] = stat._count;
        return acc;
      }, {} as Record<string, number>)
    };
  }

  private buildWhereClause(filters: AdminBookingFilters): Prisma.BookingWhereInput {
    const where: Prisma.BookingWhereInput = {};

    if (filters.dateRange) {
      where.scheduledDateTime = {
        gte: filters.dateRange[0],
        lte: filters.dateRange[1]
      };
    }

    if (filters.status && filters.status.length > 0) {
      where.status = { in: filters.status };
    }

    if (filters.serviceType && filters.serviceType.length > 0) {
      where.serviceType = { in: filters.serviceType };
    }

    if (filters.customerEmail) {
      where.user = {
        email: { contains: filters.customerEmail, mode: 'insensitive' }
      };
    }

    return where;
  }

  private generateCSV(bookings: any[]): string {
    const headers = [
      'Booking ID',
      'Reference',
      'Customer Name',
      'Customer Email',
      'Service Type',
      'Status',
      'Pickup Date/Time',
      'Pickup Address',
      'Dropoff Address',
      'Amount',
      'Payment Status',
      'Created At'
    ];

    const rows = bookings.map(booking => [
      booking.id,
      booking.confirmation?.bookingReference || '',
      `${booking.user.firstName} ${booking.user.lastName}`,
      booking.user.email,
      booking.serviceType,
      booking.status,
      booking.scheduledDateTime.toISOString(),
      booking.pickupAddress,
      booking.dropoffAddress,
      booking.totalAmount.toString(),
      booking.payment?.status || 'N/A',
      booking.createdAt.toISOString()
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csv;
  }
}

export const adminBookingService = new AdminBookingService();