import { Router } from 'express';
import { locationController } from '../controllers/location.controller';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/async';
import { validate } from '../middleware/validate';
import { z } from 'zod';

const router = Router();

// Validation schemas
const searchSchema = z.object({
  body: z.object({
    input: z.string().min(3, 'Search input must be at least 3 characters'),
    sessionToken: z.string().optional(),
  }),
});

const geocodeSchema = z.object({
  body: z.object({
    address: z.string().optional(),
    placeId: z.string().optional(),
  }).refine(data => data.address || data.placeId, {
    message: 'Either address or placeId is required',
  }),
});

const reverseGeocodeSchema = z.object({
  body: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
});

const saveLocationSchema = z.object({
  body: z.object({
    address: z.string(),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    placeId: z.string().optional(),
    type: z.enum(['home', 'work', 'custom']).optional(),
    name: z.string().optional(),
    instructions: z.string().optional(),
  }),
});

const updateLocationSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    instructions: z.string().optional(),
    type: z.enum(['home', 'work', 'custom']).optional(),
  }),
});

const distanceSchema = z.object({
  body: z.object({
    origin: z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    }),
    destination: z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    }),
  }),
});

// Public routes
router.post(
  '/search',
  validate(searchSchema),
  asyncHandler(locationController.searchLocations)
);

router.post(
  '/geocode',
  validate(geocodeSchema),
  asyncHandler(locationController.geocodeAddress)
);

router.post(
  '/reverse',
  validate(reverseGeocodeSchema),
  asyncHandler(locationController.reverseGeocode)
);

router.post(
  '/distance',
  validate(distanceSchema),
  asyncHandler(locationController.calculateDistance)
);

// Protected routes
router.get(
  '/user',
  authenticate,
  asyncHandler(locationController.getUserLocations)
);

router.post(
  '/user',
  authenticate,
  validate(saveLocationSchema),
  asyncHandler(locationController.saveLocation)
);

router.put(
  '/user/:id',
  authenticate,
  validate(updateLocationSchema),
  asyncHandler(locationController.updateLocation)
);

router.delete(
  '/user/:id',
  authenticate,
  asyncHandler(locationController.deleteLocation)
);

export default router;