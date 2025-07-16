import { Request, Response } from 'express';
import { mapsService } from '../services/maps.service';
import { prisma } from '../config/database';
import { AppError } from '../middleware/error';
import { AuthRequest } from '../middleware/auth';
import { logger } from '../config/logger';

export const locationController = {
  // Address autocomplete
  async searchLocations(req: Request, res: Response) {
    const { input, sessionToken } = req.body;

    if (!input || input.trim().length < 3) {
      throw new AppError(400, 'Search input must be at least 3 characters');
    }

    const results = await mapsService.autocomplete(input, sessionToken);
    res.json({ results });
  },

  // Geocode address to coordinates
  async geocodeAddress(req: Request, res: Response) {
    const { address, placeId } = req.body;

    if (!address && !placeId) {
      throw new AppError(400, 'Either address or placeId is required');
    }

    const result = placeId 
      ? await mapsService.geocodeFromPlaceId(placeId)
      : await mapsService.geocode(address);

    // Check if location is within service area
    if (!mapsService.isWithinServiceArea(result.lat, result.lng)) {
      throw new AppError(400, 'Location is outside our service area');
    }

    res.json({ 
      location: {
        ...result,
        isAirport: result.isAirport,
        airportCode: result.airportCode
      } 
    });
  },

  // Reverse geocode coordinates to address
  async reverseGeocode(req: Request, res: Response) {
    const { lat, lng } = req.body;

    if (!lat || !lng) {
      throw new AppError(400, 'Latitude and longitude are required');
    }

    const result = await mapsService.reverseGeocode(lat, lng);

    // Check if location is within service area
    if (!mapsService.isWithinServiceArea(lat, lng)) {
      throw new AppError(400, 'Location is outside our service area');
    }

    res.json({ 
      location: {
        ...result,
        isAirport: result.isAirport,
        airportCode: result.airportCode
      } 
    });
  },

  // Get user's saved locations
  async getUserLocations(req: AuthRequest, res: Response) {
    const userId = req.user!.id;

    const locations = await prisma.location.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ locations });
  },

  // Save a new location for user
  async saveLocation(req: AuthRequest, res: Response) {
    const userId = req.user!.id;
    const { 
      address, 
      lat, 
      lng, 
      placeId, 
      name 
    } = req.body;

    if (!address || !lat || !lng) {
      throw new AppError(400, 'Address, latitude, and longitude are required');
    }

    if (!mapsService.isWithinServiceArea(lat, lng)) {
      throw new AppError(400, 'Location is outside our service area');
    }

    // Check if user already has a location with the same name
    if (name) {
      const existing = await prisma.location.findFirst({
        where: { userId, name },
      });

      if (existing) {
        // Update existing location
        const updated = await prisma.location.update({
          where: { id: existing.id },
          data: {
            address,
            latitude: lat,
            longitude: lng,
          },
        });

        return res.json({ 
          location: updated
        });
      }
    }

    // Create new location
    const location = await prisma.location.create({
      data: {
        userId,
        address,
        latitude: lat,
        longitude: lng,
        name: name || address,
      },
    });

    logger.info(`User ${userId} saved new location: ${address}`);
    res.status(201).json({ 
      location
    });
  },

  // Update a saved location
  async updateLocation(req: AuthRequest, res: Response) {
    const userId = req.user!.id;
    const { id } = req.params;
    const { name } = req.body;

    const location = await prisma.location.findFirst({
      where: { id, userId },
    });

    if (!location) {
      throw new AppError(404, 'Location not found');
    }

    const updated = await prisma.location.update({
      where: { id },
      data: {
        name,
      },
    });

    res.json({ 
      location: updated
    });
  },

  // Delete a saved location
  async deleteLocation(req: AuthRequest, res: Response) {
    const userId = req.user!.id;
    const { id } = req.params;

    const location = await prisma.location.findFirst({
      where: { id, userId },
    });

    if (!location) {
      throw new AppError(404, 'Location not found');
    }

    await prisma.location.delete({
      where: { id },
    });

    logger.info(`User ${userId} deleted location: ${location.address}`);
    res.status(204).send();
  },

  // Calculate distance between two locations
  async calculateDistance(req: Request, res: Response) {
    const { origin, destination } = req.body;

    if (!origin || !destination) {
      throw new AppError(400, 'Origin and destination are required');
    }

    if (!origin.lat || !origin.lng || !destination.lat || !destination.lng) {
      throw new AppError(400, 'Valid coordinates are required for both locations');
    }

    const distance = await mapsService.calculateDistance(origin, destination);
    res.json({ distance });
  },
};