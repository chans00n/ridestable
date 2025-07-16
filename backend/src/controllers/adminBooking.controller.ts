import { Request, Response, NextFunction } from 'express';
import { adminBookingService } from '../services/adminBooking.service';
import { AdminAuthRequest } from '../types/admin';
import { AppError } from '../utils/errors';
import { z } from 'zod';
import { BookingStatus, ServiceType } from '@prisma/client';

const searchBookingsSchema = z.object({
  dateRange: z.tuple([z.string(), z.string()]).optional(),
  status: z.array(z.nativeEnum(BookingStatus)).optional(),
  serviceType: z.array(z.nativeEnum(ServiceType)).optional(),
  customerEmail: z.string().optional(),
  bookingReference: z.string().optional(),
  amountRange: z.tuple([z.number(), z.number()]).optional(),
  showCancelled: z.boolean().optional(),
  showCompleted: z.boolean().optional(),
  showPending: z.boolean().optional()
});

const modifyBookingSchema = z.object({
  updates: z.object({
    scheduledDateTime: z.string().datetime().optional(),
    pickupAddress: z.string().optional(),
    dropoffAddress: z.string().optional(),
    notes: z.string().optional()
  }),
  priceDifference: z.number().optional(),
  reason: z.string()
});

const cancelBookingSchema = z.object({
  reason: z.string().min(1),
  refundAmount: z.number().min(0),
  sendNotification: z.boolean().default(true)
});

const refundSchema = z.object({
  amount: z.number().positive(),
  reason: z.string().min(1)
});

export class AdminBookingController {
  async searchBookings(req: AdminAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.admin) {
        throw new AppError('Unauthorized', 401);
      }

      const {
        page = '1',
        limit = '20',
        sortBy = 'createdAt',
        sortOrder = 'desc',
        ...filters
      } = req.query;

      // Parse date range if provided
      if (filters.dateRange && typeof filters.dateRange === 'string') {
        const [start, end] = filters.dateRange.split(',');
        filters.dateRange = [new Date(start), new Date(end)];
      }

      // Parse arrays
      if (filters.status && typeof filters.status === 'string') {
        filters.status = filters.status.split(',');
      }
      if (filters.serviceType && typeof filters.serviceType === 'string') {
        filters.serviceType = filters.serviceType.split(',');
      }

      // Parse amount range
      if (filters.amountRange && typeof filters.amountRange === 'string') {
        const [min, max] = filters.amountRange.split(',').map(Number);
        filters.amountRange = [min, max];
      }

      const result = await adminBookingService.searchBookings(
        filters as any,
        parseInt(page as string),
        parseInt(limit as string),
        {
          field: sortBy as string,
          order: sortOrder as 'asc' | 'desc'
        }
      );

      res.json({
        status: 'success',
        data: result.data,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getBookingDetails(req: AdminAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.admin) {
        throw new AppError('Unauthorized', 401);
      }

      const { bookingId } = req.params;
      const booking = await adminBookingService.getBookingDetails(bookingId);

      res.json({
        status: 'success',
        data: booking
      });
    } catch (error) {
      next(error);
    }
  }

  async modifyBooking(req: AdminAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.admin) {
        throw new AppError('Unauthorized', 401);
      }

      const { bookingId } = req.params;
      const validatedData = modifyBookingSchema.parse(req.body);

      const updatedBooking = await adminBookingService.modifyBooking(
        bookingId,
        validatedData,
        req.admin.id
      );

      res.json({
        status: 'success',
        data: updatedBooking
      });
    } catch (error) {
      next(error);
    }
  }

  async cancelBooking(req: AdminAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.admin) {
        throw new AppError('Unauthorized', 401);
      }

      const { bookingId } = req.params;
      const validatedData = cancelBookingSchema.parse(req.body);

      const cancellation = await adminBookingService.cancelBooking(
        bookingId,
        validatedData,
        req.admin.id
      );

      res.json({
        status: 'success',
        data: cancellation
      });
    } catch (error) {
      next(error);
    }
  }

  async processRefund(req: AdminAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.admin) {
        throw new AppError('Unauthorized', 401);
      }

      const { bookingId } = req.params;
      const validatedData = refundSchema.parse(req.body);

      const refund = await adminBookingService.processRefund(
        bookingId,
        validatedData,
        req.admin.id
      );

      res.json({
        status: 'success',
        data: refund
      });
    } catch (error) {
      next(error);
    }
  }

  async exportBookings(req: AdminAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.admin) {
        throw new AppError('Unauthorized', 401);
      }

      const { format = 'csv', ...filters } = req.query;

      // Parse filters similar to searchBookings
      if (filters.dateRange && typeof filters.dateRange === 'string') {
        const [start, end] = filters.dateRange.split(',');
        filters.dateRange = [new Date(start), new Date(end)];
      }

      const exportData = await adminBookingService.exportBookings(
        filters as any,
        format as 'csv' | 'excel'
      );

      const filename = `bookings-export-${new Date().toISOString().split('T')[0]}.${format}`;
      
      res.setHeader('Content-Type', format === 'csv' ? 'text/csv' : 'application/vnd.ms-excel');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(exportData);
    } catch (error) {
      next(error);
    }
  }

  async getBookingStatistics(req: AdminAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.admin) {
        throw new AppError('Unauthorized', 401);
      }

      const { days = '30' } = req.query;
      const stats = await adminBookingService.getBookingStatistics(
        parseInt(days as string)
      );

      res.json({
        status: 'success',
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }
}

export const adminBookingController = new AdminBookingController();