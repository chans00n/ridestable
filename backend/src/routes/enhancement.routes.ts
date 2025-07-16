import { Router } from 'express';
import { enhancementController } from '../controllers/enhancement.controller';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/async';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Calculate enhancement costs
router.post(
  '/calculate',
  asyncHandler(enhancementController.calculateEnhancements)
);

// Get enhancement options
router.get(
  '/options',
  asyncHandler(enhancementController.getEnhancementOptions)
);

// Get vehicle options
router.get(
  '/vehicles',
  asyncHandler(enhancementController.getVehicleOptions)
);

// Booking-specific enhancement routes
router.post(
  '/bookings/:bookingId',
  asyncHandler(enhancementController.upsertBookingEnhancements)
);

router.get(
  '/bookings/:bookingId',
  asyncHandler(enhancementController.getBookingEnhancements)
);

// Admin routes (in production, these would require admin auth)
router.post(
  '/seed',
  asyncHandler(enhancementController.seedOptions)
);

export default router;