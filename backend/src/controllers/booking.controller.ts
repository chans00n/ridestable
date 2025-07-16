import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { bookingService } from '../services/booking.service';
import { AppError } from '../middleware/error';
import { AuthRequest } from '../middleware/auth';

// Validation schemas
const createBookingSchema = z.object({
  serviceType: z.string(),
  pickupAddress: z.string(),
  pickupLatitude: z.number(),
  pickupLongitude: z.number(),
  dropoffAddress: z.string().optional(),
  dropoffLatitude: z.number().optional(),
  dropoffLongitude: z.number().optional(),
  scheduledDateTime: z.string().datetime(),
  returnDateTime: z.string().datetime().optional(),
  durationHours: z.number().positive().optional(),
  specialInstructions: z.string().optional(),
  contactPhone: z.string(),
  quoteId: z.string().optional(),
  gratuityPercentage: z.number().min(0).max(100).optional(),
  gratuityAmount: z.number().min(0).optional(),
  enhancementCost: z.number().min(0).optional()
});

const updateBookingSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  notes: z.string().optional()
});

export class BookingController {
  /**
   * Create a new booking
   */
  async createBooking(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const validatedData = createBookingSchema.parse(req.body);
      const userId = req.user!.id;

      const booking = await bookingService.createBooking({
        ...validatedData,
        userId,
        scheduledDateTime: new Date(validatedData.scheduledDateTime),
        returnDateTime: validatedData.returnDateTime ? new Date(validatedData.returnDateTime) : undefined
      });

      res.status(201).json({
        success: true,
        data: {
          id: booking.id,
          status: booking.status,
          totalAmount: booking.totalAmount,
          createdAt: booking.createdAt
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(new AppError(400, 'Invalid booking data'));
      }
      next(error);
    }
  }

  /**
   * Get booking by ID
   */
  async getBooking(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { bookingId } = req.params;
      const userId = req.user!.id;

      const booking = await bookingService.getBooking(bookingId, userId);

      if (!booking) {
        return next(new AppError(404, 'Booking not found'));
      }

      res.status(200).json({
        success: true,
        data: booking
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user's bookings
   */
  async getUserBookings(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { status, limit = 10, offset = 0 } = req.query;

      const result = await bookingService.getUserBookings(
        userId,
        status as any,
        parseInt(limit as string),
        parseInt(offset as string)
      );

      res.status(200).json({
        success: true,
        data: result.bookings,
        total: result.total
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update booking
   */
  async updateBooking(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { bookingId } = req.params;
      const userId = req.user!.id;
      const validatedData = updateBookingSchema.parse(req.body);

      const booking = await bookingService.updateBooking(
        bookingId,
        userId,
        validatedData
      );

      res.status(200).json({
        success: true,
        data: booking
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(new AppError(400, 'Invalid update data'));
      }
      next(error);
    }
  }

  /**
   * Cancel booking
   */
  async cancelBooking(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { bookingId } = req.params;
      const userId = req.user!.id;

      const booking = await bookingService.cancelBooking(bookingId, userId);

      res.status(200).json({
        success: true,
        data: booking,
        message: 'Booking cancelled successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

export const bookingController = new BookingController();