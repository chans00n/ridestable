import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { enhancementService } from '../services/enhancement.service';
import { AppError } from '../middleware/error';
import { AuthRequest } from '../middleware/auth';
import { Decimal } from '@prisma/client/runtime/library';

// Validation schemas
const calculateEnhancementsSchema = z.object({
  bookingAmount: z.number().positive(),
  serviceType: z.enum(['ONE_WAY', 'ROUNDTRIP', 'HOURLY']),
  tripProtection: z.boolean().optional(),
  luggageServices: z.object({
    meetAndGreet: z.boolean().optional(),
    extraBags: z.number().min(0).optional(),
    specialHandling: z.array(z.string()).optional()
  }).optional(),
  vehicleUpgrade: z.string().optional(),
  childSeats: z.object({
    infant: z.number().min(0).optional(),
    toddler: z.number().min(0).optional(),
    booster: z.number().min(0).optional()
  }).optional()
});

const upsertEnhancementsSchema = z.object({
  tripProtection: z.object({
    enabled: z.boolean(),
    cost: z.number(),
    coverage: z.object({
      cancellationReasons: z.array(z.string()),
      refundPercentage: z.number(),
      timeLimits: z.object({
        fullRefund: z.number(),
        partialRefund: z.number()
      })
    }),
    termsAndConditions: z.string()
  }).optional(),
  luggageServices: z.object({
    meetAndGreet: z.object({
      enabled: z.boolean(),
      cost: z.number(),
      description: z.string(),
      includes: z.array(z.string())
    }),
    extraLuggage: z.object({
      enabled: z.boolean(),
      count: z.number().min(0),
      threshold: z.number(),
      costPerBag: z.number()
    }),
    specialHandling: z.object({
      enabled: z.boolean(),
      options: z.array(z.object({
        type: z.enum(['golf_clubs', 'ski_equipment', 'musical_instruments', 'fragile_items']),
        cost: z.number(),
        requirements: z.string(),
        selected: z.boolean()
      }))
    })
  }).optional(),
  flightInfo: z.object({
    airline: z.string(),
    flightNumber: z.string(),
    departureAirport: z.string(),
    arrivalAirport: z.string(),
    scheduledArrival: z.string(),
    terminal: z.string().optional(),
    gate: z.string().optional()
  }).optional(),
  specialRequests: z.object({
    vehiclePreferences: z.object({
      type: z.enum(['standard', 'luxury_sedan', 'suv', 'executive', 'eco_friendly']),
      features: z.array(z.string()),
      accessibility: z.array(z.string())
    }),
    childSafety: z.object({
      infantSeat: z.number().min(0),
      toddlerSeat: z.number().min(0),
      boosterSeat: z.number().min(0)
    }),
    customRequests: z.object({
      temperature: z.enum(['cool', 'comfortable', 'warm']).optional(),
      music: z.enum(['none', 'soft', 'customer_playlist']).optional(),
      refreshments: z.boolean().optional(),
      specialInstructions: z.string().optional()
    }).optional(),
    businessNeeds: z.object({
      wifiRequired: z.boolean().optional(),
      quietRide: z.boolean().optional(),
      phoneConference: z.boolean().optional()
    }).optional()
  }).optional(),
  totalEnhancementCost: z.number()
});

// Helper function to convert Decimal fields to numbers
const convertDecimalFields = (obj: any): any => {
  if (!obj) return obj;
  
  const converted = { ...obj };
  
  if (converted.totalEnhancementCost instanceof Decimal) {
    converted.totalEnhancementCost = converted.totalEnhancementCost.toNumber();
  }
  
  if (converted.basePriceMultiplier instanceof Decimal) {
    converted.basePriceMultiplier = converted.basePriceMultiplier.toNumber();
  }
  
  if (converted.cost instanceof Decimal) {
    converted.cost = converted.cost.toNumber();
  }
  
  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => convertDecimalFields(item));
  }
  
  return converted;
};

export class EnhancementController {
  /**
   * Calculate enhancement costs
   */
  async calculateEnhancements(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const validatedData = calculateEnhancementsSchema.parse(req.body);
      
      const calculation = await enhancementService.calculateEnhancementCosts(validatedData);
      
      res.status(200).json({
        success: true,
        data: calculation
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(new AppError(400, 'Invalid calculation data'));
      }
      next(error);
    }
  }

  /**
   * Get enhancement options
   */
  async getEnhancementOptions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { category } = req.query;
      
      const options = await enhancementService.getEnhancementOptions(category as string);
      
      res.status(200).json({
        success: true,
        data: options.map(option => convertDecimalFields(option))
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get vehicle options
   */
  async getVehicleOptions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const vehicles = await enhancementService.getVehicleOptions();
      
      res.status(200).json({
        success: true,
        data: vehicles.map(vehicle => convertDecimalFields(vehicle))
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add or update enhancements for a booking
   */
  async upsertBookingEnhancements(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { bookingId } = req.params;
      const validatedData = upsertEnhancementsSchema.parse(req.body);
      
      // Verify booking belongs to user
      const booking = await prisma.booking.findFirst({
        where: {
          id: bookingId,
          userId: req.user!.id
        }
      });
      
      if (!booking) {
        return next(new AppError(404, 'Booking not found'));
      }
      
      const enhancements = await enhancementService.upsertTripEnhancements(
        bookingId,
        validatedData
      );
      
      res.status(200).json({
        success: true,
        data: convertDecimalFields(enhancements)
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(new AppError(400, 'Invalid enhancement data'));
      }
      next(error);
    }
  }

  /**
   * Get enhancements for a booking
   */
  async getBookingEnhancements(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { bookingId } = req.params;
      
      // Verify booking belongs to user
      const booking = await prisma.booking.findFirst({
        where: {
          id: bookingId,
          userId: req.user!.id
        }
      });
      
      if (!booking) {
        return next(new AppError(404, 'Booking not found'));
      }
      
      const enhancements = await enhancementService.getTripEnhancements(bookingId);
      
      res.status(200).json({
        success: true,
        data: enhancements ? convertDecimalFields(enhancements) : null
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Seed default options (admin only)
   */
  async seedOptions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // In production, this would require admin authentication
      await enhancementService.seedVehicleOptions();
      await enhancementService.seedEnhancementOptions();
      
      res.status(200).json({
        success: true,
        message: 'Enhancement options seeded successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

// Import prisma here to avoid circular dependency
import { prisma } from '../config/database';

export const enhancementController = new EnhancementController();