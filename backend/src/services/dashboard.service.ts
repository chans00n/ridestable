import { prisma } from '../config/database';
import { SavedLocation, NotificationPreferences } from '@prisma/client';
import { ApiError } from '../utils/errors';

export interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UserDashboardData {
  upcomingBookings: PaginatedData<any>;
  bookingHistory: PaginatedData<any>;
  savedLocations: PaginatedData<SavedLocation>;
  paymentMethods: any[];
  preferences: NotificationPreferences | null;
  stats: {
    totalBookings: number;
    completedTrips: number;
    totalSpent: number;
    favoriteServiceType: string | null;
  };
}

export interface PaginationOptions {
  upcomingPage: number;
  historyPage: number;
  locationsPage: number;
  limit: number;
}

export class DashboardService {
  async getUserDashboard(userId: string, pagination?: PaginationOptions): Promise<UserDashboardData> {
    // Get user to verify existence
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new ApiError('User not found', 404);
    }

    // Default pagination options
    const paginationOpts = pagination || {
      upcomingPage: 1,
      historyPage: 1,
      locationsPage: 1,
      limit: 10
    };

    // Fetch all dashboard data in parallel
    const [
      upcomingBookings,
      bookingHistory,
      savedLocations,
      paymentMethods,
      preferences,
      stats
    ] = await Promise.all([
      this.getUpcomingBookings(userId, paginationOpts.upcomingPage, paginationOpts.limit),
      this.getBookingHistory(userId, paginationOpts.historyPage, paginationOpts.limit),
      this.getSavedLocations(userId, paginationOpts.locationsPage, paginationOpts.limit),
      this.getPaymentMethods(userId),
      this.getNotificationPreferences(userId),
      this.getUserStats(userId)
    ]);

    return {
      upcomingBookings,
      bookingHistory,
      savedLocations,
      paymentMethods,
      preferences,
      stats
    };
  }

  private async getUpcomingBookings(userId: string, page: number = 1, limit: number = 10): Promise<PaginatedData<any>> {
    const skip = (page - 1) * limit;
    
    const where = {
      userId,
      status: {
        in: ['PENDING', 'CONFIRMED'] as any
      },
      scheduledDateTime: {
        gte: new Date()
      }
    };

    const [bookings, total] = await Promise.all([
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
          confirmation: true,
          enhancements: true,
          payment: true
        },
        orderBy: {
          scheduledDateTime: 'asc'
        },
        skip,
        take: limit
      }),
      prisma.booking.count({ where })
    ]);

    const items = bookings.map(booking => ({
      id: booking.id,
      bookingReference: booking.confirmation?.bookingReference || 'N/A',
      serviceType: booking.serviceType,
      status: booking.status,
      scheduledDateTime: booking.scheduledDateTime,
      pickupAddress: booking.pickupAddress,
      dropoffAddress: booking.dropoffAddress,
      totalAmount: booking.totalAmount,
      notes: booking.notes,
      user: booking.user,
      canModify: this.canModifyBooking(booking),
      canCancel: this.canCancelBooking(booking),
      countdownMinutes: Math.floor(
        (new Date(booking.scheduledDateTime).getTime() - Date.now()) / 60000
      )
    }));

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  private async getBookingHistory(userId: string, page: number = 1, limit: number = 10): Promise<PaginatedData<any>> {
    const skip = (page - 1) * limit;
    
    const where = {
      userId,
      OR: [
        {
          status: {
            in: ['COMPLETED', 'CANCELLED'] as any
          }
        },
        {
          scheduledDateTime: {
            lt: new Date()
          }
        }
      ]
    };

    const [bookings, total] = await Promise.all([
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
          confirmation: true,
          payment: true,
          cancellation: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.booking.count({ where })
    ]);

    const items = bookings.map(booking => ({
      id: booking.id,
      bookingReference: booking.confirmation?.bookingReference || 'N/A',
      date: booking.scheduledDateTime,
      serviceType: booking.serviceType,
      route: `${booking.pickupAddress} → ${booking.dropoffAddress}`,
      pickupAddress: booking.pickupAddress,
      dropoffAddress: booking.dropoffAddress,
      amount: booking.totalAmount,
      status: booking.status,
      notes: booking.notes,
      user: booking.user,
      canRebook: booking.status === 'COMPLETED',
      canReview: booking.status === 'COMPLETED' && !(booking.payment?.metadata as any)?.reviewed,
      cancellationReason: booking.cancellation?.cancellationReason
    }));

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getSavedLocations(userId: string, page: number = 1, limit: number = 10): Promise<PaginatedData<SavedLocation>> {
    const skip = (page - 1) * limit;
    
    const where = { userId };

    const [locations, total] = await Promise.all([
      prisma.savedLocation.findMany({
        where,
        orderBy: [
          { isDefault: 'desc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: limit
      }),
      prisma.savedLocation.count({ where })
    ]);

    return {
      items: locations,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  private async getPaymentMethods(userId: string): Promise<any[]> {
    return prisma.paymentMethod.findMany({
      where: { userId },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ],
      select: {
        id: true,
        cardBrand: true,
        cardLast4: true,
        cardExpMonth: true,
        cardExpYear: true,
        isDefault: true
      }
    });
  }

  private async getNotificationPreferences(userId: string): Promise<any> {
    const preferences = await prisma.notificationPreferences.findUnique({
      where: { userId }
    });
    
    if (!preferences) return null;
    
    // Convert DateTime to time strings for frontend
    const result = { ...preferences } as any;
    
    if (preferences.quietHoursStart) {
      const date = new Date(preferences.quietHoursStart);
      result.quietHoursStart = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }
    
    if (preferences.quietHoursEnd) {
      const date = new Date(preferences.quietHoursEnd);
      result.quietHoursEnd = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }
    
    return result;
  }

  private async getUserStats(userId: string): Promise<any> {
    const bookings = await prisma.booking.findMany({
      where: { userId },
      include: { payment: true }
    });

    const completedTrips = bookings.filter(b => b.status === 'COMPLETED').length;
    const totalSpent = bookings
      .filter(b => b.payment?.status === 'COMPLETED')
      .reduce((sum, b) => sum + Number(b.totalAmount), 0);

    // Find most used service type
    const serviceTypeCounts = bookings.reduce((acc, booking) => {
      acc[booking.serviceType] = (acc[booking.serviceType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const favoriteServiceType = Object.entries(serviceTypeCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || null;

    return {
      totalBookings: bookings.length,
      completedTrips,
      totalSpent,
      favoriteServiceType
    };
  }

  private canModifyBooking(booking: any): boolean {
    if (booking.status !== 'CONFIRMED') return false;
    
    const hoursUntilPickup = (new Date(booking.scheduledDateTime).getTime() - Date.now()) / 3600000;
    return hoursUntilPickup >= 2; // Can modify up to 2 hours before
  }

  private canCancelBooking(booking: any): boolean {
    return booking.status === 'PENDING' || booking.status === 'CONFIRMED';
  }

  async saveLocation(userId: string, location: {
    name: string;
    address: string;
    latitude?: number;
    longitude?: number;
    locationType?: string;
    isDefault?: boolean;
  }): Promise<SavedLocation> {
    // If setting as default, unset other defaults
    if (location.isDefault) {
      await prisma.savedLocation.updateMany({
        where: { userId },
        data: { isDefault: false }
      });
    }

    return prisma.savedLocation.create({
      data: {
        userId,
        ...location
      }
    });
  }

  async updateLocation(
    userId: string,
    locationId: string,
    updates: Partial<SavedLocation>
  ): Promise<SavedLocation> {
    const location = await prisma.savedLocation.findFirst({
      where: { id: locationId, userId }
    });

    if (!location) {
      throw new ApiError('Location not found', 404);
    }

    // If setting as default, unset other defaults
    if (updates.isDefault) {
      await prisma.savedLocation.updateMany({
        where: { userId, id: { not: locationId } },
        data: { isDefault: false }
      });
    }

    return prisma.savedLocation.update({
      where: { id: locationId },
      data: updates
    });
  }

  async deleteLocation(userId: string, locationId: string): Promise<void> {
    const location = await prisma.savedLocation.findFirst({
      where: { id: locationId, userId }
    });

    if (!location) {
      throw new ApiError('Location not found', 404);
    }

    await prisma.savedLocation.delete({
      where: { id: locationId }
    });
  }

  async rebookTrip(userId: string, bookingId: string): Promise<any> {
    const originalBooking = await prisma.booking.findFirst({
      where: { id: bookingId, userId },
      include: { enhancements: true }
    });

    if (!originalBooking) {
      throw new ApiError('Booking not found', 404);
    }

    // Return booking data formatted for creating a new booking
    return {
      serviceType: originalBooking.serviceType,
      pickupAddress: originalBooking.pickupAddress,
      dropoffAddress: originalBooking.dropoffAddress,
      notes: originalBooking.notes,
      enhancements: originalBooking.enhancements
    };
  }
}