import { Router } from 'express';
import { adminBookingController } from '../controllers/adminBooking.controller';
import { authenticateAdmin, authorizeAdmin } from '../middleware/adminAuth';
import { asyncHandler } from '../middleware/async';

const router = Router();

// All routes require authentication
router.use(authenticateAdmin);

// Search and list bookings
router.get(
  '/',
  authorizeAdmin('bookings', 'read'),
  asyncHandler(adminBookingController.searchBookings)
);

// Get booking statistics
router.get(
  '/statistics',
  authorizeAdmin('bookings', 'read'),
  asyncHandler(adminBookingController.getBookingStatistics)
);

// Export bookings
router.get(
  '/export',
  authorizeAdmin('bookings', 'export'),
  asyncHandler(adminBookingController.exportBookings)
);

// Get single booking details
router.get(
  '/:bookingId',
  authorizeAdmin('bookings', 'read'),
  asyncHandler(adminBookingController.getBookingDetails)
);

// Modify booking
router.put(
  '/:bookingId',
  authorizeAdmin('bookings', 'write'),
  asyncHandler(adminBookingController.modifyBooking)
);

// Cancel booking
router.post(
  '/:bookingId/cancel',
  authorizeAdmin('bookings', 'write'),
  asyncHandler(adminBookingController.cancelBooking)
);

// Process refund
router.post(
  '/:bookingId/refund',
  authorizeAdmin('payments', 'refund'),
  asyncHandler(adminBookingController.processRefund)
);

export default router;