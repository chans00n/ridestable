import { PrismaClient } from '@prisma/client';
import { startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

const prisma = new PrismaClient();

export interface DashboardMetrics {
  totalBookings: number;
  activeBookings: number;
  totalRevenue: number;
  newCustomers: number;
  bookingsTrend: number;
  revenueTrend: number;
  customersTrend: number;
  activeTrend: number;
  realTime: {
    activeBookings: number;
    todayBookings: number;
    todayRevenue: number;
    onlineCustomers: number;
  };
  performance: {
    weeklyRevenue: number[];
    monthlyBookings: number[];
    customerSatisfaction: number;
    averageBookingValue: number;
  };
  operational: {
    pendingBookings: any[];
    upcomingPickups: any[];
    recentCancellations: any[];
    systemAlerts: any[];
  };
}

export interface RevenueAnalytics {
  today: number;
  yesterday: number;
  thisWeek: number;
  lastWeek: number;
  thisMonth: number;
  lastMonth: number;
  growth: {
    daily: number;
    weekly: number;
    monthly: number;
  };
}

export interface BookingAnalytics {
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  averageBookingValue: number;
  bookingsByServiceType: Record<string, number>;
  bookingsByHour: number[];
  peakHours: number[];
}

export class AdminDashboardService {
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    // Real-time metrics
    const [activeBookings, todayBookings, todayPayments] = await Promise.all([
      prisma.booking.count({
        where: {
          status: {
            in: ['CONFIRMED', 'IN_PROGRESS']
          }
        }
      }),
      prisma.booking.count({
        where: {
          createdAt: {
            gte: todayStart,
            lte: todayEnd
          }
        }
      }),
      prisma.payment.findMany({
        where: {
          createdAt: {
            gte: todayStart,
            lte: todayEnd
          },
          status: 'COMPLETED'
        },
        select: {
          amount: true
        }
      })
    ]);

    const todayRevenue = todayPayments.reduce((sum, payment) => 
      sum + Number(payment.amount), 0
    );

    // Performance metrics - Weekly revenue (last 7 days)
    const weeklyRevenue = await this.getWeeklyRevenue();
    
    // Monthly bookings (last 12 months)
    const monthlyBookings = await this.getMonthlyBookings();

    // Average booking value
    const avgBookingValue = await this.getAverageBookingValue();

    // Operational metrics
    const [pendingBookings, upcomingPickups, recentCancellations] = await Promise.all([
      prisma.booking.findMany({
        where: { status: 'PENDING' },
        include: {
          user: {
            select: {
              email: true,
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      }),
      prisma.booking.findMany({
        where: {
          status: 'CONFIRMED',
          scheduledDateTime: {
            gte: now,
            lte: new Date(now.getTime() + 24 * 60 * 60 * 1000) // Next 24 hours
          }
        },
        include: {
          user: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
              phone: true
            }
          }
        },
        orderBy: { scheduledDateTime: 'asc' },
        take: 10
      }),
      prisma.booking.findMany({
        where: {
          status: 'CANCELLED',
          updatedAt: {
            gte: subDays(now, 7)
          }
        },
        include: {
          user: {
            select: {
              email: true,
              firstName: true,
              lastName: true
            }
          },
          cancellation: true
        },
        orderBy: { updatedAt: 'desc' },
        take: 10
      })
    ]);

    // System alerts (e.g., low completion rate, high cancellation rate)
    const systemAlerts = await this.generateSystemAlerts();

    // Get total metrics
    const [totalBookings, totalRevenue, newCustomersThisMonth] = await Promise.all([
      prisma.booking.count(), // Total all-time bookings
      prisma.payment.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true }
      }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: startOfMonth(now)
          }
        }
      })
    ]);

    // Calculate trends (comparing to last period)
    const lastMonthStart = startOfMonth(subDays(now, 30));
    const lastMonthEnd = endOfMonth(subDays(now, 30));
    
    const [lastMonthBookings, lastMonthRevenue, lastMonthNewCustomers, lastMonthActive] = await Promise.all([
      prisma.booking.count({
        where: {
          createdAt: {
            gte: lastMonthStart,
            lte: lastMonthEnd
          }
        }
      }),
      prisma.payment.aggregate({
        where: {
          status: 'COMPLETED',
          createdAt: {
            gte: lastMonthStart,
            lte: lastMonthEnd
          }
        },
        _sum: { amount: true }
      }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: lastMonthStart,
            lte: lastMonthEnd
          }
        }
      }),
      prisma.booking.count({
        where: {
          status: {
            in: ['CONFIRMED', 'IN_PROGRESS']
          },
          createdAt: {
            gte: lastMonthStart,
            lte: lastMonthEnd
          }
        }
      })
    ]);

    // Calculate current month metrics for trends
    const thisMonthBookings = await prisma.booking.count({
      where: {
        createdAt: {
          gte: startOfMonth(now)
        }
      }
    });

    const thisMonthRevenue = await prisma.payment.aggregate({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: startOfMonth(now)
        }
      },
      _sum: { amount: true }
    });

    // Calculate trends
    const bookingsTrend = lastMonthBookings > 0 
      ? ((thisMonthBookings - lastMonthBookings) / lastMonthBookings) * 100 
      : 0;
    
    const revenueTrend = lastMonthRevenue._sum.amount && Number(lastMonthRevenue._sum.amount) > 0
      ? ((Number(thisMonthRevenue._sum.amount || 0) - Number(lastMonthRevenue._sum.amount)) / Number(lastMonthRevenue._sum.amount)) * 100
      : 0;
    
    const customersTrend = lastMonthNewCustomers > 0
      ? ((newCustomersThisMonth - lastMonthNewCustomers) / lastMonthNewCustomers) * 100
      : 0;
    
    const activeTrend = lastMonthActive > 0
      ? ((activeBookings - lastMonthActive) / lastMonthActive) * 100
      : 0;

    return {
      // Top-level metrics for dashboard cards
      totalBookings,
      activeBookings,
      totalRevenue: Number(totalRevenue._sum.amount || 0),
      newCustomers: newCustomersThisMonth,
      bookingsTrend,
      revenueTrend,
      customersTrend,
      activeTrend,
      
      // Detailed metrics
      realTime: {
        activeBookings,
        todayBookings,
        todayRevenue,
        onlineCustomers: 0 // This would require session tracking
      },
      performance: {
        weeklyRevenue,
        monthlyBookings,
        customerSatisfaction: 4.5, // This would come from ratings
        averageBookingValue: avgBookingValue
      },
      operational: {
        pendingBookings,
        upcomingPickups,
        recentCancellations,
        systemAlerts
      }
    };
  }

  async getRevenueAnalytics(): Promise<RevenueAnalytics> {
    const now = new Date();
    const todayStart = startOfDay(now);
    const yesterdayStart = startOfDay(subDays(now, 1));
    const thisWeekStart = startOfWeek(now);
    const lastWeekStart = startOfWeek(subDays(now, 7));
    const thisMonthStart = startOfMonth(now);
    const lastMonthStart = startOfMonth(subDays(now, 30));

    const [
      todayRevenue,
      yesterdayRevenue,
      thisWeekRevenue,
      lastWeekRevenue,
      thisMonthRevenue,
      lastMonthRevenue
    ] = await Promise.all([
      this.getRevenueForPeriod(todayStart, endOfDay(now)),
      this.getRevenueForPeriod(yesterdayStart, endOfDay(subDays(now, 1))),
      this.getRevenueForPeriod(thisWeekStart, endOfWeek(now)),
      this.getRevenueForPeriod(lastWeekStart, endOfWeek(subDays(now, 7))),
      this.getRevenueForPeriod(thisMonthStart, endOfMonth(now)),
      this.getRevenueForPeriod(lastMonthStart, endOfMonth(subDays(now, 30)))
    ]);

    return {
      today: todayRevenue,
      yesterday: yesterdayRevenue,
      thisWeek: thisWeekRevenue,
      lastWeek: lastWeekRevenue,
      thisMonth: thisMonthRevenue,
      lastMonth: lastMonthRevenue,
      growth: {
        daily: this.calculateGrowth(todayRevenue, yesterdayRevenue),
        weekly: this.calculateGrowth(thisWeekRevenue, lastWeekRevenue),
        monthly: this.calculateGrowth(thisMonthRevenue, lastMonthRevenue)
      }
    };
  }

  async getBookingAnalytics(days: number = 30): Promise<BookingAnalytics> {
    const startDate = subDays(new Date(), days);

    const bookings = await prisma.booking.findMany({
      where: {
        createdAt: { gte: startDate }
      },
      include: {
        payment: true
      }
    });

    const totalBookings = bookings.length;
    const completedBookings = bookings.filter(b => b.status === 'COMPLETED').length;
    const cancelledBookings = bookings.filter(b => b.status === 'CANCELLED').length;

    const totalRevenue = bookings
      .filter(b => b.payment?.status === 'COMPLETED')
      .reduce((sum, b) => sum + Number(b.payment!.amount), 0);

    const averageBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

    // Bookings by service type
    const bookingsByServiceType = bookings.reduce((acc, booking) => {
      acc[booking.serviceType] = (acc[booking.serviceType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Bookings by hour
    const bookingsByHour = new Array(24).fill(0);
    bookings.forEach(booking => {
      const hour = new Date(booking.scheduledDateTime).getHours();
      bookingsByHour[hour]++;
    });

    // Peak hours (top 3 hours with most bookings)
    const peakHours = bookingsByHour
      .map((count, hour) => ({ hour, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(item => item.hour);

    return {
      totalBookings,
      completedBookings,
      cancelledBookings,
      averageBookingValue,
      bookingsByServiceType,
      bookingsByHour,
      peakHours
    };
  }

  async getCustomerAnalytics(days: number = 30): Promise<any> {
    const startDate = subDays(new Date(), days);

    const [newCustomers, returningCustomers, topCustomers] = await Promise.all([
      prisma.user.count({
        where: {
          createdAt: { gte: startDate }
        }
      }),
      prisma.user.count({
        where: {
          bookings: {
            some: {
              createdAt: { gte: startDate }
            }
          },
          createdAt: { lt: startDate }
        }
      }),
      prisma.user.findMany({
        where: {
          bookings: {
            some: {
              createdAt: { gte: startDate },
              status: 'COMPLETED'
            }
          }
        },
        include: {
          _count: {
            select: { bookings: true }
          },
          bookings: {
            where: {
              status: 'COMPLETED',
              payment: {
                status: 'COMPLETED'
              }
            },
            include: {
              payment: true
            }
          }
        },
        take: 10
      })
    ]);

    const topCustomersWithRevenue = topCustomers.map(customer => ({
      id: customer.id,
      email: customer.email,
      name: `${customer.firstName} ${customer.lastName}`,
      totalBookings: customer._count.bookings,
      totalRevenue: customer.bookings.reduce((sum, booking) => 
        sum + (booking.payment ? Number(booking.payment.amount) : 0), 0
      )
    })).sort((a, b) => b.totalRevenue - a.totalRevenue);

    return {
      newCustomers,
      returningCustomers,
      topCustomers: topCustomersWithRevenue,
      customerRetentionRate: (returningCustomers / (newCustomers + returningCustomers)) * 100
    };
  }

  async updateDashboardMetrics(): Promise<void> {
    const today = new Date();
    const todayStart = startOfDay(today);

    const [
      activeBookings,
      totalBookings,
      completedBookings,
      cancelledBookings,
      todayRevenue,
      newCustomers,
      returningCustomers
    ] = await Promise.all([
      prisma.booking.count({
        where: {
          status: { in: ['CONFIRMED', 'IN_PROGRESS'] },
          scheduledDateTime: {
            gte: todayStart,
            lte: endOfDay(today)
          }
        }
      }),
      prisma.booking.count({
        where: {
          createdAt: {
            gte: todayStart,
            lte: endOfDay(today)
          }
        }
      }),
      prisma.booking.count({
        where: {
          status: 'COMPLETED',
          updatedAt: {
            gte: todayStart,
            lte: endOfDay(today)
          }
        }
      }),
      prisma.booking.count({
        where: {
          status: 'CANCELLED',
          updatedAt: {
            gte: todayStart,
            lte: endOfDay(today)
          }
        }
      }),
      this.getRevenueForPeriod(todayStart, endOfDay(today)),
      prisma.user.count({
        where: {
          createdAt: {
            gte: todayStart,
            lte: endOfDay(today)
          }
        }
      }),
      prisma.user.count({
        where: {
          bookings: {
            some: {
              createdAt: {
                gte: todayStart,
                lte: endOfDay(today)
              }
            }
          },
          createdAt: { lt: todayStart }
        }
      })
    ]);

    const averageBookingValue = totalBookings > 0 ? todayRevenue / totalBookings : 0;

    // Store metrics in database
    await prisma.dashboardMetrics.upsert({
      where: { date: todayStart },
      update: {
        activeBookings,
        totalBookings,
        completedBookings,
        cancelledBookings,
        totalRevenue: todayRevenue,
        averageBookingValue,
        newCustomers,
        returningCustomers
      },
      create: {
        date: todayStart,
        activeBookings,
        totalBookings,
        completedBookings,
        cancelledBookings,
        totalRevenue: todayRevenue,
        averageBookingValue,
        newCustomers,
        returningCustomers
      }
    });
  }

  private async getRevenueForPeriod(startDate: Date, endDate: Date): Promise<number> {
    const payments = await prisma.payment.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        },
        status: 'COMPLETED'
      },
      select: {
        amount: true
      }
    });

    return payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
  }

  private async getWeeklyRevenue(): Promise<number[]> {
    const revenue: number[] = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = subDays(now, i);
      const dayRevenue = await this.getRevenueForPeriod(
        startOfDay(date),
        endOfDay(date)
      );
      revenue.push(dayRevenue);
    }

    return revenue;
  }

  private async getMonthlyBookings(): Promise<number[]> {
    const bookings: number[] = [];
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const date = subDays(now, i * 30);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);

      const count = await prisma.booking.count({
        where: {
          createdAt: {
            gte: monthStart,
            lte: monthEnd
          }
        }
      });

      bookings.push(count);
    }

    return bookings;
  }

  private async getAverageBookingValue(): Promise<number> {
    const result = await prisma.payment.aggregate({
      where: {
        status: 'COMPLETED'
      },
      _avg: {
        amount: true
      }
    });

    return Number(result._avg.amount || 0);
  }

  private calculateGrowth(current: number, previous: number): number {
    if (previous === 0) return 100;
    return ((current - previous) / previous) * 100;
  }

  private async generateSystemAlerts(): Promise<any[]> {
    const alerts: any[] = [];
    const now = new Date();
    const yesterday = subDays(now, 1);

    // Check cancellation rate
    const [todayBookings, todayCancellations] = await Promise.all([
      prisma.booking.count({
        where: {
          createdAt: {
            gte: startOfDay(now),
            lte: endOfDay(now)
          }
        }
      }),
      prisma.booking.count({
        where: {
          status: 'CANCELLED',
          updatedAt: {
            gte: startOfDay(now),
            lte: endOfDay(now)
          }
        }
      })
    ]);

    const cancellationRate = todayBookings > 0 ? (todayCancellations / todayBookings) * 100 : 0;
    if (cancellationRate > 20) {
      alerts.push({
        type: 'warning',
        message: `High cancellation rate: ${cancellationRate.toFixed(1)}%`,
        timestamp: new Date()
      });
    }

    // Check for overdue payments
    const overduePayments = await prisma.payment.count({
      where: {
        status: 'PENDING',
        createdAt: {
          lt: subDays(now, 1) // Payments pending for more than 24 hours
        }
      }
    });

    if (overduePayments > 0) {
      alerts.push({
        type: 'info',
        message: `${overduePayments} payments pending for more than 24 hours`,
        timestamp: new Date()
      });
    }

    return alerts;
  }

  async getBookingsForMap(days: number = 7): Promise<any[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const bookings = await prisma.booking.findMany({
      where: {
        OR: [
          {
            scheduledDateTime: {
              gte: startDate
            }
          },
          {
            createdAt: {
              gte: startDate
            }
          }
        ]
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        confirmation: true
      },
      orderBy: {
        scheduledDateTime: 'desc'
      },
      take: 500 // Limit to prevent too many markers
    });

    // Geocode addresses if needed (in a real app, you'd store these coordinates)
    // For now, we'll add mock coordinates for Las Vegas area
    const bookingsWithCoordinates = bookings.map(booking => {
      // Generate random coordinates around Las Vegas for demo
      const pickupLat = 36.1699 + (Math.random() - 0.5) * 0.2;
      const pickupLng = -115.1398 + (Math.random() - 0.5) * 0.2;
      const dropoffLat = 36.1699 + (Math.random() - 0.5) * 0.2;
      const dropoffLng = -115.1398 + (Math.random() - 0.5) * 0.2;

      return {
        id: booking.id,
        status: booking.status,
        scheduledDateTime: booking.scheduledDateTime,
        pickupAddress: booking.pickupAddress,
        dropoffAddress: booking.dropoffAddress,
        totalAmount: booking.totalAmount,
        user: booking.user,
        confirmation: booking.confirmation,
        pickupCoordinates: {
          lat: pickupLat,
          lng: pickupLng
        },
        dropoffCoordinates: {
          lat: dropoffLat,
          lng: dropoffLng
        }
      };
    });

    return bookingsWithCoordinates;
  }
}

export const adminDashboardService = new AdminDashboardService();