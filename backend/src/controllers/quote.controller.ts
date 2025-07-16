import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { quoteService } from '../services/quote.service';
import { AppError } from '../middleware/error';
import { logger } from '../config/logger';
import type { ServiceType } from '@prisma/client';

export const quoteController = {
  // Calculate a new quote
  async calculateQuote(req: AuthRequest, res: Response) {
    const { 
      serviceType,
      pickupLocation,
      dropoffLocation,
      pickupDateTime,
      returnDateTime,
      durationHours,
      specialInstructions,
      corporateAccount 
    } = req.body;

    // Validate required fields
    if (!serviceType || !pickupLocation || !pickupDateTime) {
      throw new AppError(400, 'Missing required fields');
    }

    // Validate service type specific requirements
    if ((serviceType === 'ONE_WAY' || serviceType === 'ROUNDTRIP') && !dropoffLocation) {
      throw new AppError(400, 'Dropoff location is required for this service type');
    }

    if (serviceType === 'ROUNDTRIP' && !returnDateTime) {
      throw new AppError(400, 'Return date/time is required for roundtrip service');
    }

    if (serviceType === 'HOURLY' && !durationHours) {
      throw new AppError(400, 'Duration is required for hourly service');
    }

    try {
      const quote = await quoteService.createQuote({
        userId: req.user?.id,
        serviceType: serviceType as ServiceType,
        pickupLocation,
        dropoffLocation,
        pickupDateTime: new Date(pickupDateTime),
        returnDateTime: returnDateTime ? new Date(returnDateTime) : undefined,
        durationHours,
        specialInstructions,
        corporateAccount: corporateAccount || false,
      });

      logger.info('Quote calculated', { 
        userId: req.user?.id,
        serviceType,
        total: quote.total 
      });

      res.json({
        success: true,
        quote
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Quote calculation error:', error);
      throw new AppError(500, 'Failed to calculate quote');
    }
  },

  // Get an existing quote by ID
  async getQuote(req: AuthRequest, res: Response) {
    const { id } = req.params;

    if (!id) {
      throw new AppError(400, 'Quote ID is required');
    }

    const quote = await quoteService.getQuote(id, req.user?.id);
    
    if (!quote) {
      throw new AppError(404, 'Quote not found');
    }

    res.json({
      success: true,
      quote
    });
  },

  // Update an existing quote
  async updateQuote(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const updates = req.body;

    if (!id) {
      throw new AppError(400, 'Quote ID is required');
    }

    try {
      const updatedQuote = await quoteService.updateQuote(id, updates, req.user?.id);
      
      res.json({
        success: true,
        quote: updatedQuote
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Quote update error:', error);
      throw new AppError(500, 'Failed to update quote');
    }
  },

  // Lock a quote for booking
  async lockQuote(req: AuthRequest, res: Response) {
    const { id } = req.params;

    if (!id) {
      throw new AppError(400, 'Quote ID is required');
    }

    await quoteService.lockQuote(id, req.user?.id);
    
    res.json({
      success: true,
      message: 'Quote locked successfully'
    });
  },

  // Get user's recent quotes
  async getRecentQuotes(req: AuthRequest, res: Response) {
    if (!req.user?.id) {
      throw new AppError(401, 'Authentication required');
    }

    const limit = parseInt(req.query.limit as string) || 5;
    const quotes = await quoteService.getRecentQuotes(req.user.id, limit);
    
    res.json({
      success: true,
      quotes
    });
  },

  // Validate pricing for a booking (used during checkout)
  async validatePricing(req: Request, res: Response) {
    const { quoteId, bookingDetails } = req.body;

    if (!quoteId || !bookingDetails) {
      throw new AppError(400, 'Quote ID and booking details are required');
    }

    try {
      // Get the original quote
      const originalQuote = await quoteService.getQuote(quoteId);
      if (!originalQuote) {
        throw new AppError(404, 'Quote not found');
      }

      // Recalculate with current details
      const currentQuote = await quoteService.createQuote({
        serviceType: bookingDetails.serviceType,
        pickupLocation: bookingDetails.pickupLocation,
        dropoffLocation: bookingDetails.dropoffLocation,
        pickupDateTime: new Date(bookingDetails.pickupDateTime),
        returnDateTime: bookingDetails.returnDateTime ? new Date(bookingDetails.returnDateTime) : undefined,
        durationHours: bookingDetails.durationHours,
        specialInstructions: bookingDetails.specialInstructions,
        corporateAccount: bookingDetails.corporateAccount,
      });

      // Check if price has changed significantly (more than 5%)
      const priceDifference = Math.abs(currentQuote.total - originalQuote.totalAmount.toNumber());
      const percentChange = (priceDifference / originalQuote.totalAmount.toNumber()) * 100;
      
      if (percentChange > 5) {
        res.json({
          success: false,
          valid: false,
          message: 'Price has changed significantly. Please review the new quote.',
          originalPrice: originalQuote.totalAmount,
          currentPrice: currentQuote.total,
          percentChange: percentChange.toFixed(2)
        });
      } else {
        res.json({
          success: true,
          valid: true,
          message: 'Pricing is valid',
          price: currentQuote.total
        });
      }
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Pricing validation error:', error);
      throw new AppError(500, 'Failed to validate pricing');
    }
  }
};