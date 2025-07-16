import { PrismaClient, Prisma } from '@prisma/client';
import { AppError } from '../utils/errors';
import { adminAuthService } from './adminAuth.service';
import { notificationService } from './notification.service';
import { emailService } from './email.service';
import { smsService } from './sms.service';

const prisma = new PrismaClient();

export interface CustomerFilters {
  search?: string;
  emailVerified?: boolean;
  hasBookings?: boolean;
  dateRange?: [Date, Date];
  minBookings?: number;
  minRevenue?: number;
}

export interface CustomerCommunication {
  customerId: string;
  channel: 'email' | 'sms' | 'both';
  subject?: string;
  message: string;
  templateId?: string;
  variables?: Record<string, any>;
}

export interface PaginatedCustomers {
  data: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class AdminCustomerService {
  async searchCustomers(
    filters: CustomerFilters,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedCustomers> {
    const where: Prisma.UserWhereInput = {};

    // Search filter (email, name, phone)
    if (filters.search) {
      where.OR = [
        { email: { contains: filters.search, mode: 'insensitive' } },
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    // Email verification filter
    if (filters.emailVerified !== undefined) {
      where.emailVerified = filters.emailVerified;
    }

    // Registration date filter
    if (filters.dateRange) {
      where.createdAt = {
        gte: filters.dateRange[0],
        lte: filters.dateRange[1]
      };
    }

    // Has bookings filter
    if (filters.hasBookings !== undefined) {
      where.bookings = filters.hasBookings ? { some: {} } : { none: {} };
    }

    const [customers, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          _count: {
            select: {
              bookings: true,
              paymentMethods: true
            }
          },
          bookings: {
            where: { status: 'COMPLETED' },
            include: { payment: true },
            orderBy: { createdAt: 'desc' },
            take: 5
          },
          notificationPreferences: true
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);

    // Calculate additional metrics
    const customersWithMetrics = await Promise.all(
      customers.map(async (customer) => {
        const totalRevenue = customer.bookings.reduce((sum, booking) => {
          return sum + (booking.payment ? Number(booking.payment.amount) : 0);
        }, 0);

        const lastBooking = await prisma.booking.findFirst({
          where: { userId: customer.id },
          orderBy: { createdAt: 'desc' }
        });

        return {
          ...customer,
          metrics: {
            totalBookings: customer._count.bookings,
            completedBookings: customer.bookings.length,
            totalRevenue,
            lastBookingDate: lastBooking?.createdAt,
            averageBookingValue: customer.bookings.length > 0 
              ? totalRevenue / customer.bookings.length 
              : 0
          }
        };
      })
    );

    // Apply post-query filters
    let filteredCustomers = customersWithMetrics;
    if (filters.minBookings) {
      filteredCustomers = filteredCustomers.filter(
        c => c.metrics.totalBookings >= filters.minBookings!
      );
    }
    if (filters.minRevenue) {
      filteredCustomers = filteredCustomers.filter(
        c => c.metrics.totalRevenue >= filters.minRevenue!
      );
    }

    return {
      data: filteredCustomers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getCustomerDetails(customerId: string): Promise<any> {
    const customer = await prisma.user.findUnique({
      where: { id: customerId },
      include: {
        bookings: {
          include: {
            payment: true,
            confirmation: true,
            cancellation: true
          },
          orderBy: { createdAt: 'desc' }
        },
        paymentMethods: true,
        savedLocations: true,
        notificationPreferences: true,
        notifications: {
          orderBy: { createdAt: 'desc' },
          take: 20
        }
      }
    });

    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    // Calculate customer lifetime value and other metrics
    const metrics = await this.calculateCustomerMetrics(customerId);

    return {
      ...customer,
      metrics
    };
  }

  async updateCustomer(
    customerId: string,
    updateData: any,
    adminId: string
  ): Promise<any> {
    const customer = await prisma.user.findUnique({
      where: { id: customerId }
    });

    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    const updatedCustomer = await prisma.user.update({
      where: { id: customerId },
      data: updateData
    });

    // Log audit
    await adminAuthService.logAuditEntry(
      adminId,
      'CUSTOMER_UPDATED',
      'customers',
      customerId,
      { changes: updateData }
    );

    return updatedCustomer;
  }

  async sendCommunication(
    communication: CustomerCommunication,
    adminId: string
  ): Promise<any> {
    const customer = await prisma.user.findUnique({
      where: { id: communication.customerId },
      include: { notificationPreferences: true }
    });

    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    const results = {
      email: null as any,
      sms: null as any
    };

    // Send email
    if (
      (communication.channel === 'email' || communication.channel === 'both') &&
      customer.email
    ) {
      try {
        if (communication.templateId) {
          await emailService.sendTemplatedEmail(
            customer.email,
            communication.templateId,
            {
              ...communication.variables,
              firstName: customer.firstName,
              lastName: customer.lastName
            }
          );
        } else {
          await emailService.sendEmail({
            to: customer.email,
            subject: communication.subject || 'Message from Stable Ride',
            text: communication.message,
            html: `<p>${communication.message.replace(/\n/g, '<br>')}</p>`
          });
        }
        results.email = { status: 'sent', timestamp: new Date() };
      } catch (error) {
        results.email = { status: 'failed', error: error.message };
      }
    }

    // Send SMS
    if (
      (communication.channel === 'sms' || communication.channel === 'both') &&
      customer.phone
    ) {
      try {
        await smsService.sendSMS(customer.phone, communication.message);
        results.sms = { status: 'sent', timestamp: new Date() };
      } catch (error) {
        results.sms = { status: 'failed', error: error.message };
      }
    }

    // Create notification record
    await prisma.notification.create({
      data: {
        userId: customer.id,
        type: 'ADMIN_MESSAGE',
        channel: communication.channel,
        recipient: communication.channel === 'email' ? customer.email : customer.phone!,
        subject: communication.subject,
        content: communication.message,
        status: 'sent',
        sentAt: new Date()
      }
    });

    // Log audit
    await adminAuthService.logAuditEntry(
      adminId,
      'CUSTOMER_COMMUNICATION_SENT',
      'customers',
      customer.id,
      {
        channel: communication.channel,
        subject: communication.subject
      }
    );

    return results;
  }

  async getCustomerBookingHistory(
    customerId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<any> {
    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where: { userId: customerId },
        include: {
          payment: true,
          confirmation: true,
          cancellation: true,
          enhancements: true
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.booking.count({ where: { userId: customerId } })
    ]);

    return {
      data: bookings,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getCustomerCommunicationHistory(
    customerId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<any> {
    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: customerId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.notification.count({ where: { userId: customerId } })
    ]);

    return {
      data: notifications,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async exportCustomers(filters: CustomerFilters, format: 'csv' | 'excel' = 'csv'): Promise<string> {
    const customers = await prisma.user.findMany({
      where: this.buildWhereClause(filters),
      include: {
        _count: {
          select: { bookings: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (format === 'csv') {
      return this.generateCSV(customers);
    } else {
      throw new AppError('Excel export not yet implemented', 501);
    }
  }

  private async calculateCustomerMetrics(customerId: string): Promise<any> {
    const [bookingStats, paymentStats, lastActivity] = await Promise.all([
      prisma.booking.aggregate({
        where: { userId: customerId },
        _count: true,
        _sum: { totalAmount: true }
      }),
      prisma.payment.aggregate({
        where: {
          booking: { userId: customerId },
          status: 'COMPLETED'
        },
        _sum: { amount: true }
      }),
      prisma.booking.findFirst({
        where: { userId: customerId },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true }
      })
    ]);

    const cancellationCount = await prisma.booking.count({
      where: {
        userId: customerId,
        status: 'CANCELLED'
      }
    });

    return {
      totalBookings: bookingStats._count,
      totalSpent: paymentStats._sum.amount || 0,
      averageBookingValue: bookingStats._count > 0 
        ? (Number(bookingStats._sum.totalAmount) || 0) / bookingStats._count 
        : 0,
      cancellationRate: bookingStats._count > 0 
        ? (cancellationCount / bookingStats._count) * 100 
        : 0,
      lastActivityDate: lastActivity?.createdAt
    };
  }

  private buildWhereClause(filters: CustomerFilters): Prisma.UserWhereInput {
    const where: Prisma.UserWhereInput = {};

    if (filters.search) {
      where.OR = [
        { email: { contains: filters.search, mode: 'insensitive' } },
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    if (filters.emailVerified !== undefined) {
      where.emailVerified = filters.emailVerified;
    }

    if (filters.dateRange) {
      where.createdAt = {
        gte: filters.dateRange[0],
        lte: filters.dateRange[1]
      };
    }

    return where;
  }

  private generateCSV(customers: any[]): string {
    const headers = [
      'Customer ID',
      'Email',
      'First Name',
      'Last Name',
      'Phone',
      'Email Verified',
      'Total Bookings',
      'Registration Date'
    ];

    const rows = customers.map(customer => [
      customer.id,
      customer.email,
      customer.firstName,
      customer.lastName,
      customer.phone || '',
      customer.emailVerified ? 'Yes' : 'No',
      customer._count.bookings,
      customer.createdAt.toISOString()
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csv;
  }
}

export const adminCustomerService = new AdminCustomerService();