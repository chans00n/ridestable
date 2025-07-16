import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { BookingConfirmationService } from '../services/bookingConfirmation.service';
import { BookingModificationService } from '../services/bookingModification.service';
import { CancellationService } from '../services/cancellation.service';
import { ApiError } from '../utils/errors';
import { AuthRequest } from '../types/auth';

const confirmationService = new BookingConfirmationService();
const modificationService = new BookingModificationService();
const cancellationService = new CancellationService();

// Schemas
const modifyBookingSchema = z.object({
  changes: z.object({
    dateTime: z.object({
      newPickupTime: z.string().transform(str => new Date(str)),
      newReturnTime: z.string().transform(str => new Date(str)).optional()
    }).optional(),
    locations: z.object({
      newPickupAddress: z.string().optional(),
      newDropoffAddress: z.string().optional()
    }).optional(),
    serviceType: z.object({
      from: z.string(),
      to: z.string()
    }).optional(),
    enhancements: z.object({
      added: z.array(z.any()).optional(),
      removed: z.array(z.any()).optional()
    }).optional(),
    passengerCount: z.number().optional()
  }),
  reason: z.string().optional()
});

const cancelBookingSchema = z.object({
  reason: z.string().optional(),
  cancellationType: z.enum(['customer', 'driver', 'system']).optional()
});

export const bookingLifecycleController = {
  // Confirmation endpoints
  async confirmBooking(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const confirmation = await confirmationService.createConfirmation(id);
      
      res.json({
        status: 'success',
        data: confirmation
      });
    } catch (error) {
      next(error);
    }
  },

  async getConfirmation(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const confirmation = await confirmationService.getConfirmation(id, req.user!.id);
      
      if (!confirmation) {
        throw new ApiError('Confirmation not found', 404);
      }
      
      res.json({
        status: 'success',
        data: confirmation
      });
    } catch (error) {
      next(error);
    }
  },

  async resendConfirmation(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await confirmationService.resendConfirmation(id, req.user!.id);
      
      res.json({
        status: 'success',
        message: 'Confirmation email resent successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  // Modification endpoints
  async modifyBooking(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const validatedData = modifyBookingSchema.parse(req.body);
      
      const result = await modificationService.modifyBooking({
        bookingId: id,
        userId: req.user!.id,
        changes: validatedData.changes,
        reason: validatedData.reason
      });
      
      res.json({
        status: 'success',
        data: result,
        message: result.requiresPayment 
          ? 'Modification requires payment for price difference'
          : 'Modification pending processing'
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(new ApiError('Invalid modification data', 400, error.errors));
      }
      next(error);
    }
  },

  async applyModification(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { modificationId } = req.params;
      const updatedBooking = await modificationService.applyModification(modificationId);
      
      res.json({
        status: 'success',
        data: updatedBooking,
        message: 'Booking modified successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  async getModificationHistory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const history = await modificationService.getModificationHistory(id, req.user!.id);
      
      res.json({
        status: 'success',
        data: history
      });
    } catch (error) {
      next(error);
    }
  },

  // Cancellation endpoints
  async cancelBooking(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const validatedData = cancelBookingSchema.parse(req.body);
      
      const cancellation = await cancellationService.cancelBooking({
        bookingId: id,
        userId: req.user!.id,
        reason: validatedData.reason,
        cancellationType: validatedData.cancellationType
      });
      
      res.json({
        status: 'success',
        data: cancellation,
        message: 'Booking cancelled successfully'
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(new ApiError('Invalid cancellation data', 400, error.errors));
      }
      next(error);
    }
  },

  async getCancellationDetails(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const cancellation = await cancellationService.getCancellationDetails(id, req.user!.id);
      
      if (!cancellation) {
        throw new ApiError('Cancellation details not found', 404);
      }
      
      res.json({
        status: 'success',
        data: cancellation
      });
    } catch (error) {
      next(error);
    }
  },

  async getCancellationPolicy(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const policy = await cancellationService.getCancellationPolicy();
      
      res.json({
        status: 'success',
        data: policy
      });
    } catch (error) {
      next(error);
    }
  }
};