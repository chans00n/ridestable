import { Router } from 'express';
import { adminDashboardController } from '../controllers/adminDashboard.controller';
import { authenticateAdmin, authorizeAdmin } from '../middleware/adminAuth';
import { asyncHandler } from '../middleware/async';

const router = Router();

// All routes require authentication
router.use(authenticateAdmin);

// Get dashboard metrics
router.get(
  '/metrics',
  authorizeAdmin('analytics', 'read'),
  asyncHandler(adminDashboardController.getDashboardMetrics)
);

// Get revenue analytics
router.get(
  '/revenue',
  authorizeAdmin('analytics', 'read'),
  asyncHandler(adminDashboardController.getRevenueAnalytics)
);

// Get booking analytics
router.get(
  '/bookings',
  authorizeAdmin('analytics', 'read'),
  asyncHandler(adminDashboardController.getBookingAnalytics)
);

// Get customer analytics
router.get(
  '/customers',
  authorizeAdmin('analytics', 'read'),
  asyncHandler(adminDashboardController.getCustomerAnalytics)
);

// Refresh dashboard metrics (manual trigger)
router.post(
  '/refresh',
  authorizeAdmin('analytics', 'write'),
  asyncHandler(adminDashboardController.refreshDashboardMetrics)
);

// Get bookings for map display
router.get(
  '/map-bookings',
  authorizeAdmin('analytics', 'read'),
  asyncHandler(adminDashboardController.getBookingsForMap)
);

export default router;