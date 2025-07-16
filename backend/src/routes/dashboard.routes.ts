import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Main dashboard
router.get('/', dashboardController.getDashboard);

// Bookings
router.get('/bookings/upcoming', dashboardController.getUpcomingBookings);
router.get('/bookings/history', dashboardController.getBookingHistory);
router.post('/bookings/:bookingId/rebook', dashboardController.rebookTrip);

// Saved Locations
router.get('/locations', dashboardController.getSavedLocations);
router.post('/locations', dashboardController.saveLocation);
router.put('/locations/:id', dashboardController.updateLocation);
router.delete('/locations/:id', dashboardController.deleteLocation);

// Notification Preferences
router.get('/notifications/preferences', dashboardController.getNotificationPreferences);
router.put('/notifications/preferences', dashboardController.updateNotificationPreferences);
router.get('/notifications/history', dashboardController.getNotificationHistory);

export default router;