import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireDriver } from '../middleware/driver';
import { driverController } from '../controllers/driver.controller';
import { validate } from '../middleware/validate';
import { z } from 'zod';

const router = Router();

// All driver routes require authentication and driver status
router.use(requireAuth);
router.use(requireDriver);

// Schedule endpoints
router.get('/schedule/today', driverController.getTodaySchedule);
router.get('/schedule/week', driverController.getWeekSchedule);

// Ride management
router.get('/rides/active', driverController.getActiveRide);
router.get('/rides/:rideId', driverController.getRideDetails);
router.post('/rides/:rideId/start', driverController.startRide);
router.post('/rides/:rideId/arrived-pickup', driverController.arrivedAtPickup);
router.post('/rides/:rideId/passenger-aboard', driverController.passengerAboard);
router.post('/rides/:rideId/arrived-destination', driverController.arrivedAtDestination);
router.post('/rides/:rideId/complete', driverController.completeRide);

// Location sharing
const locationUpdateSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  heading: z.number().min(0).max(360).optional(),
  speed: z.number().min(0).optional(),
});

router.post(
  '/location/update',
  validate(locationUpdateSchema),
  driverController.updateLocation
);

router.post('/location/share/:rideId', driverController.startLocationSharing);
router.delete('/location/share/:rideId', driverController.stopLocationSharing);

// Driver profile
router.get('/profile', driverController.getDriverProfile);
router.patch('/profile/vehicle', driverController.updateVehicleInfo);
router.patch('/profile/availability', driverController.updateAvailability);

// Earnings
router.get('/earnings/today', driverController.getTodayEarnings);
router.get('/earnings/week', driverController.getWeekEarnings);
router.get('/earnings/history', driverController.getEarningsHistory);

export default router;