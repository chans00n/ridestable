import { PrismaClient, BookingStatus, DriverStatus } from '@prisma/client';
import { AppError } from '../utils/errors';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, format } from 'date-fns';
// import { notificationService } from './notification.service';
import { sendBookingNotification } from './notification-patch';
import { redisClient } from '../config/redis';

const prisma = new PrismaClient();

interface LocationUpdate {
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
}

class DriverService {
  async getTodaySchedule(driverId: string) {
    const today = new Date();
    const startDate = startOfDay(today);
    const endDate = endOfDay(today);

    const bookings = await prisma.booking.findMany({
      where: {
        driverId,
        scheduledDateTime: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          in: ['CONFIRMED', 'IN_PROGRESS'],
        },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
          },
        },
        enhancements: true,
        payment: true,
      },
      orderBy: {
        scheduledDateTime: 'asc',
      },
    });

    const rides = bookings.map(booking => this.formatBookingForDriver(booking));

    const summary = {
      totalRides: rides.length,
      estimatedEarnings: rides.reduce((sum, ride) => sum + ride.earnings.total, 0),
      totalHours: rides.reduce((sum, ride) => sum + (ride.schedule.estimatedDuration / 60), 0),
    };

    return { rides, summary };
  }

  async getWeekSchedule(driverId: string, startDate?: string, endDate?: string) {
    const weekStart = startDate ? new Date(startDate) : startOfWeek(new Date());
    const weekEnd = endDate ? new Date(endDate) : endOfWeek(weekStart);

    const bookings = await prisma.booking.findMany({
      where: {
        driverId,
        scheduledDateTime: {
          gte: weekStart,
          lte: weekEnd,
        },
        status: {
          in: ['CONFIRMED', 'IN_PROGRESS'],
        },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
          },
        },
        enhancements: true,
        payment: true,
      },
      orderBy: {
        scheduledDateTime: 'asc',
      },
    });

    // Group bookings by day
    const dailySchedules = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      
      const dayBookings = bookings.filter(booking => {
        const bookingDate = new Date(booking.scheduledDateTime);
        return bookingDate.toDateString() === date.toDateString();
      });

      const rides = dayBookings.map(booking => this.formatBookingForDriver(booking));
      
      dailySchedules.push({
        date,
        rides,
        dailyEarnings: rides.reduce((sum, ride) => sum + ride.earnings.total, 0),
        workingHours: rides.reduce((sum, ride) => sum + (ride.schedule.estimatedDuration / 60), 0),
      });
    }

    // Calculate week summary
    const allRides = bookings.map(booking => this.formatBookingForDriver(booking));
    const busiestDay = dailySchedules.reduce((busiest, day) => 
      day.rides.length > busiest.rides.length ? day : busiest
    );

    const longestRide = allRides.reduce((longest, ride) => 
      ride.schedule.estimatedDuration > longest.schedule.estimatedDuration ? ride : longest
    , allRides[0]);

    const summary = {
      totalRides: allRides.length,
      estimatedEarnings: allRides.reduce((sum, ride) => sum + ride.earnings.total, 0),
      busiestDay: format(busiestDay.date, 'EEEE'),
      longestRide: longestRide ? {
        day: format(new Date(longestRide.schedule.pickupTime), 'EEEE'),
        duration: longestRide.schedule.estimatedDuration,
        service: longestRide.service.type,
      } : null,
    };

    return {
      weekRange: {
        startDate: weekStart,
        endDate: weekEnd,
      },
      dailySchedules,
      summary,
    };
  }

  async getActiveRide(driverId: string) {
    const activeBooking = await prisma.booking.findFirst({
      where: {
        driverId,
        status: 'IN_PROGRESS',
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
          },
        },
        enhancements: true,
        payment: true,
      },
    });

    return activeBooking ? this.formatBookingForDriver(activeBooking) : null;
  }

  async getRideDetails(rideId: string, driverId: string) {
    const booking = await prisma.booking.findFirst({
      where: {
        id: rideId,
        driverId,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
          },
        },
        enhancements: true,
        payment: true,
      },
    });

    if (!booking) {
      throw new AppError('Ride not found', 404);
    }

    return this.formatBookingForDriver(booking);
  }

  async updateRideStatus(rideId: string, driverId: string, status: string) {
    const booking = await prisma.booking.findFirst({
      where: {
        id: rideId,
        driverId,
      },
    });

    if (!booking) {
      throw new AppError('Ride not found', 404);
    }

    // Update booking status based on driver action
    let bookingStatus: BookingStatus = booking.status;
    
    switch (status) {
      case 'started':
      case 'arrived_pickup':
      case 'passenger_aboard':
      case 'arrived_destination':
        bookingStatus = 'IN_PROGRESS';
        break;
      case 'completed':
        bookingStatus = 'COMPLETED';
        break;
    }

    await prisma.booking.update({
      where: { id: rideId },
      data: { status: bookingStatus },
    });

    // Send notification to customer
    await sendBookingNotification(booking.userId, rideId, status);
  }

  async completeRide(rideId: string, driverId: string) {
    const booking = await prisma.booking.findFirst({
      where: {
        id: rideId,
        driverId,
        status: 'IN_PROGRESS',
      },
    });

    if (!booking) {
      throw new AppError('Active ride not found', 404);
    }

    // Update booking status
    await prisma.booking.update({
      where: { id: rideId },
      data: { status: 'COMPLETED' },
    });

    // Update driver stats
    await prisma.user.update({
      where: { id: driverId },
      data: {
        totalTrips: { increment: 1 },
      },
    });

    // Send completion notification
    await sendBookingNotification(booking.userId, rideId, 'completed');
  }

  async updateDriverLocation(driverId: string, location: LocationUpdate) {
    // Store location in Redis for real-time tracking
    const key = `driver:location:${driverId}`;
    const locationData = {
      ...location,
      timestamp: new Date().toISOString(),
    };

    await redisClient.setex(key, 300, JSON.stringify(locationData)); // Expire after 5 minutes
  }

  async startLocationSharing(rideId: string, driverId: string) {
    const booking = await prisma.booking.findFirst({
      where: {
        id: rideId,
        driverId,
        status: 'IN_PROGRESS',
      },
    });

    if (!booking) {
      throw new AppError('Active ride not found', 404);
    }

    // Set location sharing flag in Redis
    const key = `location:sharing:${rideId}`;
    await redisClient.setex(key, 14400, 'true'); // Expire after 4 hours
  }

  async stopLocationSharing(rideId: string, driverId: string) {
    const key = `location:sharing:${rideId}`;
    await redisClient.del(key);
  }

  async getDriverProfile(driverId: string) {
    const driver = await prisma.user.findUnique({
      where: { id: driverId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        isDriver: true,
        driverLicenseNumber: true,
        driverLicenseExpiry: true,
        vehicleInfo: true,
        driverStatus: true,
        driverRating: true,
        totalTrips: true,
      },
    });

    if (!driver || !driver.isDriver) {
      throw new AppError('Driver profile not found', 404);
    }

    return driver;
  }

  async updateVehicleInfo(driverId: string, vehicleInfo: any) {
    await prisma.user.update({
      where: { id: driverId },
      data: { vehicleInfo },
    });
  }

  async updateAvailability(driverId: string, status: DriverStatus) {
    await prisma.user.update({
      where: { id: driverId },
      data: { driverStatus: status },
    });
  }

  async getTodayEarnings(driverId: string) {
    const today = new Date();
    const startDate = startOfDay(today);
    const endDate = endOfDay(today);

    const completedBookings = await prisma.booking.findMany({
      where: {
        driverId,
        status: 'COMPLETED',
        updatedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        payment: true,
      },
    });

    const totalEarnings = completedBookings.reduce((sum, booking) => 
      sum + Number(booking.totalAmount), 0
    );

    return {
      date: today,
      totalRides: completedBookings.length,
      totalEarnings,
      rides: completedBookings.map(booking => ({
        id: booking.id,
        amount: Number(booking.totalAmount),
        completedAt: booking.updatedAt,
      })),
    };
  }

  async getWeekEarnings(driverId: string) {
    const today = new Date();
    const weekStart = startOfWeek(today);
    const weekEnd = endOfWeek(today);

    const completedBookings = await prisma.booking.findMany({
      where: {
        driverId,
        status: 'COMPLETED',
        updatedAt: {
          gte: weekStart,
          lte: weekEnd,
        },
      },
      include: {
        payment: true,
      },
    });

    const totalEarnings = completedBookings.reduce((sum, booking) => 
      sum + Number(booking.totalAmount), 0
    );

    return {
      weekStart,
      weekEnd,
      totalRides: completedBookings.length,
      totalEarnings,
      dailyBreakdown: this.calculateDailyEarnings(completedBookings, weekStart),
    };
  }

  async getEarningsHistory(driverId: string, startDate: string, endDate: string) {
    const completedBookings = await prisma.booking.findMany({
      where: {
        driverId,
        status: 'COMPLETED',
        updatedAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      include: {
        payment: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return completedBookings.map(booking => ({
      id: booking.id,
      date: booking.updatedAt,
      amount: Number(booking.totalAmount),
      pickupAddress: booking.pickupAddress,
      dropoffAddress: booking.dropoffAddress,
      serviceType: booking.serviceType,
    }));
  }

  private formatBookingForDriver(booking: any) {
    const enhancements = booking.enhancements || {};
    const payment = booking.payment || {};

    // Parse special requests and flight info from notes if available
    const specialRequests = [];
    let flightInfo = null;
    
    if (booking.notes) {
      // Extract flight info if present
      const flightMatch = booking.notes.match(/Flight:\s*([A-Z]{2})\s*(\d+)/);
      if (flightMatch) {
        flightInfo = {
          airline: flightMatch[1],
          flightNumber: flightMatch[2],
          terminal: booking.notes.match(/Terminal\s*([A-Z\d]+)/)?.[1],
          status: 'on-time',
        };
      }
      
      // Extract special requests
      if (booking.notes.includes('Luggage assistance')) specialRequests.push('Luggage assistance needed');
      if (booking.notes.includes('Trip protection')) specialRequests.push('Trip protection enabled');
      if (booking.notes.includes('Gate code')) {
        const gateMatch = booking.notes.match(/Gate code:\s*(\d+)/);
        if (gateMatch) specialRequests.push(`Gate code: ${gateMatch[1]}`);
      }
    }

    return {
      id: booking.id,
      bookingReference: booking.id,
      customer: {
        name: `${booking.user.firstName} ${booking.user.lastName}`,
        phone: booking.user.phone || '',
        email: booking.user.email,
        preferredName: booking.user.firstName,
      },
      schedule: {
        pickupTime: booking.scheduledDateTime,
        estimatedDuration: booking.serviceType === 'HOURLY' ? 180 : 60, // 3 hours for hourly, 1 hour default
        returnTime: booking.serviceType === 'ROUNDTRIP' ? 
          new Date(booking.scheduledDateTime.getTime() + 120 * 60000) : undefined,
      },
      locations: {
        pickup: {
          address: booking.pickupAddress,
          lat: 0, // Should be geocoded
          lng: 0,
          specialInstructions: booking.notes?.includes('Gate code') ? 
            `Gate code: ${booking.notes.match(/Gate code:\s*(\d+)/)?.[1]}` : undefined,
        },
        dropoff: {
          address: booking.dropoffAddress,
          lat: 0,
          lng: 0,
        },
      },
      service: {
        type: booking.serviceType.toLowerCase().replace('_', '-') as 'one-way' | 'roundtrip' | 'hourly',
        enhancements: enhancements.enhancements || [],
        specialRequests,
        flightInfo,
      },
      earnings: {
        baseRate: Number(booking.totalAmount) * 0.7, // Driver gets 70%
        enhancements: 0,
        gratuity: Number(booking.totalAmount) * 0.15, // Assume 15% tip
        total: Number(booking.totalAmount) * 0.85, // 70% base + 15% tip
      },
      status: this.mapBookingStatus(booking.status),
    };
  }

  private mapBookingStatus(status: BookingStatus): string {
    switch (status) {
      case 'CONFIRMED':
        return 'upcoming';
      case 'IN_PROGRESS':
        return 'active';
      case 'COMPLETED':
        return 'completed';
      case 'CANCELLED':
        return 'cancelled';
      default:
        return 'upcoming';
    }
  }

  private calculateDailyEarnings(bookings: any[], weekStart: Date) {
    const dailyEarnings = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      
      const dayBookings = bookings.filter(booking => {
        const bookingDate = new Date(booking.updatedAt);
        return bookingDate.toDateString() === date.toDateString();
      });

      dailyEarnings.push({
        date,
        rides: dayBookings.length,
        earnings: dayBookings.reduce((sum, booking) => 
          sum + Number(booking.totalAmount), 0
        ),
      });
    }

    return dailyEarnings;
  }
}

export const driverService = new DriverService();