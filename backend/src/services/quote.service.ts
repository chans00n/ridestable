import { prisma } from '../config/database';
import { logger } from '../config/logger';
import { pricingEngine } from './pricingEngine.service';
import { mapsService } from './maps.service';
import { AppError } from '../middleware/error';
import { 
  BookingDetails, 
  LocationInfo, 
  QuoteBreakdown,
  DistanceInfo 
} from '../types/pricing.types';
import type { ServiceType, Quote } from '@prisma/client';

interface CreateQuoteParams {
  userId?: string;
  serviceType: ServiceType;
  pickupLocation: LocationInfo;
  dropoffLocation?: LocationInfo;
  pickupDateTime: Date;
  returnDateTime?: Date;
  durationHours?: number;
  specialInstructions?: string;
  corporateAccount?: boolean;
}

interface QuoteWithDistance extends QuoteBreakdown {
  distance?: number;
  duration?: number;
  distanceText?: string;
  durationText?: string;
}

export class QuoteService {
  async createQuote(params: CreateQuoteParams): Promise<QuoteWithDistance> {
    try {
      // Check if user is a returning customer
      let isReturningCustomer = false;
      if (params.userId) {
        const previousBookings = await prisma.booking.count({
          where: {
            userId: params.userId,
            status: 'COMPLETED'
          }
        });
        isReturningCustomer = previousBookings > 0;
      }

      // Get distance information if needed
      let distanceInfo: DistanceInfo | undefined;
      if (params.dropoffLocation && (params.serviceType === 'ONE_WAY' || params.serviceType === 'ROUNDTRIP')) {
        try {
          const distanceResult = await mapsService.calculateDistance(
            { lat: params.pickupLocation.lat, lng: params.pickupLocation.lng },
            { lat: params.dropoffLocation.lat, lng: params.dropoffLocation.lng }
          );
          distanceInfo = distanceResult;
        } catch (error) {
          logger.error('Failed to calculate distance:', error);
          throw new AppError(500, 'Unable to calculate route distance');
        }
      }

      // Prepare booking details for pricing engine
      const bookingDetails: BookingDetails = {
        serviceType: params.serviceType,
        pickupLocation: params.pickupLocation,
        dropoffLocation: params.dropoffLocation,
        pickupDateTime: params.pickupDateTime,
        returnDateTime: params.returnDateTime,
        durationHours: params.durationHours,
        distanceInfo,
        specialInstructions: params.specialInstructions,
        corporateAccount: params.corporateAccount,
        isReturningCustomer
      };

      // Calculate price
      const priceResult = await pricingEngine.calculatePrice(bookingDetails);
      
      if (!priceResult.success || !priceResult.breakdown) {
        throw new AppError(400, priceResult.error || 'Failed to calculate price');
      }

      // Save quote to database
      const quote = await prisma.quote.create({
        data: {
          userId: params.userId,
          serviceType: params.serviceType,
          pickupLocation: params.pickupLocation,
          dropoffLocation: params.dropoffLocation || undefined,
          pickupDateTime: params.pickupDateTime,
          returnDateTime: params.returnDateTime,
          durationHours: params.durationHours,
          distance: distanceInfo ? distanceInfo.distance / 1609.34 : undefined, // Convert to miles
          duration: distanceInfo ? Math.round(distanceInfo.duration / 60) : undefined, // Convert to minutes
          breakdown: priceResult.breakdown,
          totalAmount: priceResult.breakdown.total,
          validUntil: priceResult.breakdown.validUntil,
        }
      });

      logger.info('Quote created', { 
        quoteId: quote.id, 
        userId: params.userId,
        total: priceResult.breakdown.total,
        reference: priceResult.breakdown.bookingReference
      });

      // Return quote with distance information
      const result: QuoteWithDistance = {
        ...priceResult.breakdown,
        distance: distanceInfo?.distance,
        duration: distanceInfo?.duration,
        distanceText: distanceInfo?.distanceText,
        durationText: distanceInfo?.durationText
      };

      return result;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Quote creation error:', error);
      throw new AppError(500, 'Failed to create quote');
    }
  }

  async getQuote(quoteId: string, userId?: string): Promise<Quote | null> {
    try {
      const quote = await prisma.quote.findFirst({
        where: {
          id: quoteId,
          ...(userId ? { userId } : {}),
        }
      });

      if (!quote) {
        return null;
      }

      // Check if quote is still valid
      if (new Date() > quote.validUntil) {
        throw new AppError(400, 'Quote has expired');
      }

      return quote;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Get quote error:', error);
      throw new AppError(500, 'Failed to retrieve quote');
    }
  }

  async updateQuote(
    quoteId: string, 
    updates: Partial<CreateQuoteParams>,
    userId?: string
  ): Promise<QuoteWithDistance> {
    try {
      // Get existing quote
      const existingQuote = await this.getQuote(quoteId, userId);
      if (!existingQuote) {
        throw new AppError(404, 'Quote not found');
      }

      // Merge with existing data
      const params: CreateQuoteParams = {
        userId: existingQuote.userId || undefined,
        serviceType: updates.serviceType || existingQuote.serviceType,
        pickupLocation: updates.pickupLocation || existingQuote.pickupLocation as LocationInfo,
        dropoffLocation: updates.dropoffLocation || existingQuote.dropoffLocation as LocationInfo,
        pickupDateTime: updates.pickupDateTime || existingQuote.pickupDateTime,
        returnDateTime: updates.returnDateTime || existingQuote.returnDateTime || undefined,
        durationHours: updates.durationHours || existingQuote.durationHours || undefined,
        specialInstructions: updates.specialInstructions,
        corporateAccount: updates.corporateAccount,
      };

      // Create new quote with updated parameters
      return this.createQuote(params);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Update quote error:', error);
      throw new AppError(500, 'Failed to update quote');
    }
  }

  async lockQuote(quoteId: string, userId?: string): Promise<void> {
    try {
      const quote = await this.getQuote(quoteId, userId);
      if (!quote) {
        throw new AppError(404, 'Quote not found');
      }

      if (quote.lockedAt) {
        throw new AppError(400, 'Quote is already locked');
      }

      await prisma.quote.update({
        where: { id: quoteId },
        data: { lockedAt: new Date() }
      });

      logger.info('Quote locked', { quoteId, userId });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Lock quote error:', error);
      throw new AppError(500, 'Failed to lock quote');
    }
  }

  async getRecentQuotes(userId: string, limit: number = 5): Promise<Quote[]> {
    try {
      const quotes = await prisma.quote.findMany({
        where: {
          userId,
          validUntil: { gte: new Date() }
        },
        orderBy: { createdAt: 'desc' },
        take: limit
      });

      return quotes;
    } catch (error) {
      logger.error('Get recent quotes error:', error);
      throw new AppError(500, 'Failed to retrieve recent quotes');
    }
  }

  async cleanupExpiredQuotes(): Promise<number> {
    try {
      const result = await prisma.quote.deleteMany({
        where: {
          validUntil: { lt: new Date() },
          bookingId: null, // Don't delete quotes associated with bookings
        }
      });

      if (result.count > 0) {
        logger.info(`Cleaned up ${result.count} expired quotes`);
      }

      return result.count;
    } catch (error) {
      logger.error('Cleanup expired quotes error:', error);
      return 0;
    }
  }
}

export const quoteService = new QuoteService();