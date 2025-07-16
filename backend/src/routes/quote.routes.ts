import { Router } from 'express';
import { quoteController } from '../controllers/quote.controller';
import { authenticate, optionalAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/async';
import { validate } from '../middleware/validate';
import { z } from 'zod';

const router = Router();

// Location schema
const locationSchema = z.object({
  address: z.string(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  placeId: z.string().optional(),
  isAirport: z.boolean().optional(),
  airportCode: z.string().optional(),
});

// Calculate quote schema
const calculateQuoteSchema = z.object({
  body: z.object({
    serviceType: z.enum(['ONE_WAY', 'ROUNDTRIP', 'HOURLY']),
    pickupLocation: locationSchema,
    dropoffLocation: locationSchema.optional(),
    pickupDateTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'Invalid pickup date/time',
    }),
    returnDateTime: z.string().optional().refine((val) => !val || !isNaN(Date.parse(val)), {
      message: 'Invalid return date/time',
    }),
    durationHours: z.number().min(2).max(24).optional(),
    specialInstructions: z.string().optional(),
    corporateAccount: z.boolean().optional(),
  }).refine((data) => {
    // Validate service-specific requirements
    if ((data.serviceType === 'ONE_WAY' || data.serviceType === 'ROUNDTRIP') && !data.dropoffLocation) {
      return false;
    }
    if (data.serviceType === 'ROUNDTRIP' && !data.returnDateTime) {
      return false;
    }
    if (data.serviceType === 'HOURLY' && !data.durationHours) {
      return false;
    }
    return true;
  }, {
    message: 'Missing required fields for selected service type',
  }),
});

// Update quote schema
const updateQuoteSchema = z.object({
  body: z.object({
    serviceType: z.enum(['ONE_WAY', 'ROUNDTRIP', 'HOURLY']).optional(),
    pickupLocation: locationSchema.optional(),
    dropoffLocation: locationSchema.optional(),
    pickupDateTime: z.string().optional(),
    returnDateTime: z.string().optional(),
    durationHours: z.number().min(2).max(24).optional(),
    specialInstructions: z.string().optional(),
    corporateAccount: z.boolean().optional(),
  }),
});

// Validate pricing schema
const validatePricingSchema = z.object({
  body: z.object({
    quoteId: z.string(),
    bookingDetails: z.object({
      serviceType: z.enum(['ONE_WAY', 'ROUNDTRIP', 'HOURLY']),
      pickupLocation: locationSchema,
      dropoffLocation: locationSchema.optional(),
      pickupDateTime: z.string(),
      returnDateTime: z.string().optional(),
      durationHours: z.number().optional(),
      specialInstructions: z.string().optional(),
      corporateAccount: z.boolean().optional(),
    }),
  }),
});

// Routes
// Calculate a new quote (authentication optional for guest quotes)
router.post(
  '/calculate',
  optionalAuth,
  validate(calculateQuoteSchema),
  asyncHandler(quoteController.calculateQuote)
);

// Get user's recent quotes (requires authentication)
router.get(
  '/user/recent',
  authenticate,
  asyncHandler(quoteController.getRecentQuotes)
);

// Get quote by ID (authentication optional)
router.get(
  '/:id',
  optionalAuth,
  asyncHandler(quoteController.getQuote)
);

// Update existing quote (authentication optional)
router.post(
  '/:id/update',
  optionalAuth,
  validate(updateQuoteSchema),
  asyncHandler(quoteController.updateQuote)
);

// Lock quote for booking (requires authentication)
router.post(
  '/:id/lock',
  authenticate,
  asyncHandler(quoteController.lockQuote)
);

// Validate pricing for checkout
router.post(
  '/validate',
  validate(validatePricingSchema),
  asyncHandler(quoteController.validatePricing)
);

export default router;