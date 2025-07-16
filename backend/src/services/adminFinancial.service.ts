import { PrismaClient } from '@prisma/client';
import { startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import Stripe from 'stripe';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

export interface FinancialMetrics {
  revenue: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    lastMonth: number;
    yearToDate: number;
    growth: {
      daily: number;
      weekly: number;
      monthly: number;
    };
  };
  transactions: {
    total: number;
    pending: number;
    completed: number;
    failed: number;
    refunded: number;
  };
  averageMetrics: {
    bookingValue: number;
    dailyRevenue: number;
    weeklyRevenue: number;
    monthlyRevenue: number;
  };
  byServiceType: {
    [key: string]: {
      revenue: number;
      count: number;
      percentage: number;
    };
  };
  refunds: {
    total: number;
    amount: number;
    rate: number;
  };
  projections: {
    endOfMonth: number;
    endOfQuarter: number;
    endOfYear: number;
  };
}

export interface PaymentReconciliation {
  stripeBalance: {
    available: number;
    pending: number;
    currency: string;
  };
  platformRecords: {
    total: number;
    reconciled: number;
    unreconciled: number;
    discrepancies: Array<{
      paymentId: string;
      stripeAmount: number;
      platformAmount: number;
      difference: number;
      date: Date;
    }>;
  };
  lastReconciliation: Date | null;
  nextScheduled: Date;
}

export interface RefundDetails {
  id: string;
  bookingId: string;
  paymentId: string;
  amount: number;
  reason: string;
  status: string;
  requestedAt: Date;
  processedAt: Date | null;
  stripeRefundId: string | null;
  customer: {
    name: string;
    email: string;
  };
}

export class AdminFinancialService {
  async getFinancialMetrics(): Promise<FinancialMetrics> {
    const now = new Date();
    const todayStart = startOfDay(now);
    const weekStart = startOfWeek(now);
    const monthStart = startOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));
    const yearStart = new Date(now.getFullYear(), 0, 1);

    // Get revenue data
    const [todayRevenue, weekRevenue, monthRevenue, lastMonthRevenue, yearRevenue] = await Promise.all([
      this.getRevenueForPeriod(todayStart, now),
      this.getRevenueForPeriod(weekStart, now),
      this.getRevenueForPeriod(monthStart, now),
      this.getRevenueForPeriod(lastMonthStart, lastMonthEnd),
      this.getRevenueForPeriod(yearStart, now)
    ]);

    // Get yesterday's revenue for daily growth
    const yesterdayRevenue = await this.getRevenueForPeriod(
      startOfDay(subDays(now, 1)),
      endOfDay(subDays(now, 1))
    );

    // Get last week's revenue for weekly growth
    const lastWeekRevenue = await this.getRevenueForPeriod(
      startOfWeek(subDays(now, 7)),
      endOfWeek(subDays(now, 7))
    );

    // Calculate growth percentages
    const dailyGrowth = yesterdayRevenue > 0 
      ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100
      : 0;

    const weeklyGrowth = lastWeekRevenue > 0
      ? ((weekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100
      : 0;

    const monthlyGrowth = lastMonthRevenue > 0
      ? ((monthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
      : 0;

    // Get transaction statistics
    const transactions = await this.getTransactionStats();

    // Get average metrics
    const averageMetrics = await this.getAverageMetrics();

    // Get revenue by service type
    const byServiceType = await this.getRevenueByServiceType(monthStart, now);

    // Get refund statistics
    const refunds = await this.getRefundStats(monthStart, now);

    // Calculate projections
    const projections = await this.calculateProjections(monthRevenue, monthStart, now);

    return {
      revenue: {
        today: todayRevenue,
        thisWeek: weekRevenue,
        thisMonth: monthRevenue,
        lastMonth: lastMonthRevenue,
        yearToDate: yearRevenue,
        growth: {
          daily: dailyGrowth,
          weekly: weeklyGrowth,
          monthly: monthlyGrowth
        }
      },
      transactions,
      averageMetrics,
      byServiceType,
      refunds,
      projections
    };
  }

  async getPaymentReconciliation(): Promise<PaymentReconciliation> {
    // Get Stripe balance
    const stripeBalance = await stripe.balance.retrieve();

    // Get platform payment records
    const payments = await prisma.payment.findMany({
      where: {
        status: 'COMPLETED'
      },
      include: {
        booking: true
      }
    });

    // Get financial transactions
    const financialTransactions = await prisma.financialTransaction.findMany({
      where: {
        type: 'payment',
        status: 'completed'
      }
    });

    // Check for discrepancies
    const discrepancies: PaymentReconciliation['platformRecords']['discrepancies'] = [];
    
    for (const payment of payments) {
      if (payment.stripePaymentIntentId) {
        try {
          const stripePayment = await stripe.paymentIntents.retrieve(payment.stripePaymentIntentId);
          const stripeAmount = stripePayment.amount / 100; // Convert from cents
          const platformAmount = Number(payment.amount);
          
          if (Math.abs(stripeAmount - platformAmount) > 0.01) {
            discrepancies.push({
              paymentId: payment.id,
              stripeAmount,
              platformAmount,
              difference: stripeAmount - platformAmount,
              date: payment.createdAt
            });
          }
        } catch (error) {
          console.error(`Failed to retrieve Stripe payment: ${payment.stripePaymentIntentId}`, error);
        }
      }
    }

    const reconciled = financialTransactions.filter(t => t.reconciled).length;
    const unreconciled = financialTransactions.filter(t => !t.reconciled).length;

    // Get last reconciliation
    const lastReconciliation = await prisma.financialTransaction.findFirst({
      where: {
        reconciled: true
      },
      orderBy: {
        reconciledAt: 'desc'
      },
      select: {
        reconciledAt: true
      }
    });

    return {
      stripeBalance: {
        available: stripeBalance.available[0]?.amount / 100 || 0,
        pending: stripeBalance.pending[0]?.amount / 100 || 0,
        currency: stripeBalance.available[0]?.currency || 'usd'
      },
      platformRecords: {
        total: payments.length,
        reconciled,
        unreconciled,
        discrepancies
      },
      lastReconciliation: lastReconciliation?.reconciledAt || null,
      nextScheduled: new Date(Date.now() + 24 * 60 * 60 * 1000) // Next day
    };
  }

  async getRefunds(filters?: {
    startDate?: Date;
    endDate?: Date;
    status?: string;
  }): Promise<RefundDetails[]> {
    const where: any = {
      status: 'REFUNDED'
    };

    if (filters?.startDate && filters?.endDate) {
      where.updatedAt = {
        gte: filters.startDate,
        lte: filters.endDate
      };
    }

    const refundedPayments = await prisma.payment.findMany({
      where,
      include: {
        booking: {
          include: {
            user: true,
            cancellation: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    return refundedPayments.map(payment => ({
      id: payment.id,
      bookingId: payment.bookingId,
      paymentId: payment.id,
      amount: Number(payment.amount),
      reason: payment.booking.cancellation?.cancellationReason || 'No reason provided',
      status: payment.status,
      requestedAt: payment.booking.cancellation?.createdAt || payment.updatedAt,
      processedAt: payment.updatedAt,
      stripeRefundId: payment.metadata?.refundId as string || null,
      customer: {
        name: `${payment.booking.user.firstName} ${payment.booking.user.lastName}`,
        email: payment.booking.user.email
      }
    }));
  }

  async processRefund(
    paymentId: string,
    amount?: number,
    reason?: string,
    adminId: string
  ): Promise<{ success: boolean; refundId?: string; error?: string }> {
    try {
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: { booking: true }
      });

      if (!payment) {
        return { success: false, error: 'Payment not found' };
      }

      if (!payment.stripePaymentIntentId) {
        return { success: false, error: 'No Stripe payment intent found' };
      }

      // Create Stripe refund
      const refund = await stripe.refunds.create({
        payment_intent: payment.stripePaymentIntentId,
        amount: amount ? Math.round(amount * 100) : undefined, // Convert to cents
        reason: 'requested_by_customer',
        metadata: {
          adminId,
          reason: reason || 'Admin initiated refund'
        }
      });

      // Update payment status
      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: 'REFUNDED',
          metadata: {
            ...payment.metadata,
            refundId: refund.id,
            refundAmount: refund.amount / 100,
            refundedAt: new Date().toISOString(),
            refundedBy: adminId
          }
        }
      });

      // Create financial transaction
      await prisma.financialTransaction.create({
        data: {
          type: 'refund',
          category: 'booking',
          amount: refund.amount / 100,
          currency: refund.currency,
          status: 'completed',
          paymentId,
          bookingId: payment.bookingId,
          stripeId: refund.id,
          description: reason || 'Admin initiated refund',
          metadata: {
            adminId,
            originalPaymentId: payment.stripePaymentIntentId
          }
        }
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          adminId,
          action: 'refund_processed',
          resource: 'payment',
          resourceId: paymentId,
          details: {
            amount: refund.amount / 100,
            reason,
            stripeRefundId: refund.id
          }
        }
      });

      return { success: true, refundId: refund.id };
    } catch (error: any) {
      console.error('Refund processing error:', error);
      return { success: false, error: error.message };
    }
  }

  async reconcileTransaction(
    transactionId: string,
    adminId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const transaction = await prisma.financialTransaction.update({
        where: { id: transactionId },
        data: {
          reconciled: true,
          reconciledAt: new Date(),
          reconciledById: adminId
        }
      });

      await prisma.auditLog.create({
        data: {
          adminId,
          action: 'transaction_reconciled',
          resource: 'financial_transaction',
          resourceId: transactionId,
          details: {
            amount: transaction.amount,
            type: transaction.type
          }
        }
      });

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Helper methods

  private async getRevenueForPeriod(startDate: Date, endDate: Date): Promise<number> {
    const result = await prisma.payment.aggregate({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      _sum: {
        amount: true
      }
    });

    return Number(result._sum.amount || 0);
  }

  private async getTransactionStats() {
    const [total, pending, completed, failed, refunded] = await Promise.all([
      prisma.payment.count(),
      prisma.payment.count({ where: { status: 'PENDING' } }),
      prisma.payment.count({ where: { status: 'COMPLETED' } }),
      prisma.payment.count({ where: { status: 'FAILED' } }),
      prisma.payment.count({ where: { status: 'REFUNDED' } })
    ]);

    return { total, pending, completed, failed, refunded };
  }

  private async getAverageMetrics() {
    const now = new Date();
    const thirtyDaysAgo = subDays(now, 30);

    const bookingValue = await prisma.payment.aggregate({
      where: {
        status: 'COMPLETED',
        createdAt: { gte: thirtyDaysAgo }
      },
      _avg: {
        amount: true
      }
    });

    const dailyRevenue = await this.getRevenueForPeriod(thirtyDaysAgo, now) / 30;
    const weeklyRevenue = dailyRevenue * 7;
    const monthlyRevenue = dailyRevenue * 30;

    return {
      bookingValue: Number(bookingValue._avg.amount || 0),
      dailyRevenue,
      weeklyRevenue,
      monthlyRevenue
    };
  }

  private async getRevenueByServiceType(startDate: Date, endDate: Date) {
    const bookings = await prisma.booking.findMany({
      where: {
        payment: {
          status: 'COMPLETED',
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      },
      include: {
        payment: true
      }
    });

    const revenueByType: { [key: string]: { revenue: number; count: number } } = {};
    let totalRevenue = 0;

    bookings.forEach(booking => {
      const serviceType = booking.serviceType;
      const amount = Number(booking.payment!.amount);
      
      if (!revenueByType[serviceType]) {
        revenueByType[serviceType] = { revenue: 0, count: 0 };
      }
      
      revenueByType[serviceType].revenue += amount;
      revenueByType[serviceType].count++;
      totalRevenue += amount;
    });

    // Calculate percentages
    const result: FinancialMetrics['byServiceType'] = {};
    Object.entries(revenueByType).forEach(([type, data]) => {
      result[type] = {
        ...data,
        percentage: totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0
      };
    });

    return result;
  }

  private async getRefundStats(startDate: Date, endDate: Date) {
    const refunds = await prisma.payment.findMany({
      where: {
        status: 'REFUNDED',
        updatedAt: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    const totalRefunds = refunds.length;
    const refundAmount = refunds.reduce((sum, payment) => sum + Number(payment.amount), 0);

    const totalPayments = await prisma.payment.count({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    const refundRate = totalPayments > 0 ? (totalRefunds / totalPayments) * 100 : 0;

    return {
      total: totalRefunds,
      amount: refundAmount,
      rate: refundRate
    };
  }

  private async calculateProjections(currentMonthRevenue: number, monthStart: Date, now: Date) {
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysPassed = Math.ceil((now.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24));
    const dailyAverage = currentMonthRevenue / daysPassed;

    const endOfMonth = dailyAverage * daysInMonth;
    const endOfQuarter = endOfMonth * 3; // Simplified projection
    const endOfYear = dailyAverage * 365;

    return {
      endOfMonth,
      endOfQuarter,
      endOfYear
    };
  }

  async getCustomerLifetimeValue(days: number = 365): Promise<{
    average: number;
    bySegment: { [key: string]: number };
    topCustomers: Array<{
      customerId: string;
      name: string;
      email: string;
      totalRevenue: number;
      bookingCount: number;
    }>;
  }> {
    const startDate = subDays(new Date(), days);

    const customers = await prisma.user.findMany({
      where: {
        bookings: {
          some: {
            payment: {
              status: 'COMPLETED'
            }
          }
        }
      },
      include: {
        bookings: {
          where: {
            payment: {
              status: 'COMPLETED'
            },
            createdAt: {
              gte: startDate
            }
          },
          include: {
            payment: true
          }
        }
      }
    });

    let totalRevenue = 0;
    const customerRevenue: { [key: string]: { revenue: number; count: number; customer: any } } = {};

    customers.forEach(customer => {
      const revenue = customer.bookings.reduce((sum, booking) => 
        sum + Number(booking.payment!.amount), 0
      );
      
      customerRevenue[customer.id] = {
        revenue,
        count: customer.bookings.length,
        customer
      };
      
      totalRevenue += revenue;
    });

    // Calculate average CLV
    const averageCLV = customers.length > 0 ? totalRevenue / customers.length : 0;

    // Segment customers
    const segments: { [key: string]: number[] } = {
      high: [],
      medium: [],
      low: []
    };

    Object.values(customerRevenue).forEach(({ revenue }) => {
      if (revenue > averageCLV * 2) {
        segments.high.push(revenue);
      } else if (revenue > averageCLV * 0.5) {
        segments.medium.push(revenue);
      } else {
        segments.low.push(revenue);
      }
    });

    const bySegment = {
      high: segments.high.length > 0 
        ? segments.high.reduce((a, b) => a + b, 0) / segments.high.length 
        : 0,
      medium: segments.medium.length > 0
        ? segments.medium.reduce((a, b) => a + b, 0) / segments.medium.length
        : 0,
      low: segments.low.length > 0
        ? segments.low.reduce((a, b) => a + b, 0) / segments.low.length
        : 0
    };

    // Get top customers
    const topCustomers = Object.values(customerRevenue)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
      .map(({ revenue, count, customer }) => ({
        customerId: customer.id,
        name: `${customer.firstName} ${customer.lastName}`,
        email: customer.email,
        totalRevenue: revenue,
        bookingCount: count
      }));

    return {
      average: averageCLV,
      bySegment,
      topCustomers
    };
  }
}

export const adminFinancialService = new AdminFinancialService();