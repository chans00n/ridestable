import { prisma } from '../config/database';
import { logger } from '../config/logger';
import { AppError } from '../middleware/error';
import type { Prisma, TripEnhancement, VehicleOption, EnhancementOption } from '@prisma/client';
import type { 
  EnhancementCalculationRequest, 
  EnhancementCalculationResponse,
  TripEnhancements,
  LuggageServices,
  FlightInformation,
  SpecialRequests
} from '@stable-ride/shared';

export class EnhancementService {
  // Cost constants
  private readonly TRIP_PROTECTION_COST = 9.00;
  private readonly MEET_AND_GREET_COST = 15.00;
  private readonly EXTRA_BAG_COST = 5.00;
  private readonly CHILD_SEAT_COST = 15.00;
  private readonly SPECIAL_HANDLING_COST = 10.00;
  private readonly ADDITIONAL_STOP_COST = 10.00;

  /**
   * Calculate enhancement costs
   */
  async calculateEnhancementCosts(
    request: EnhancementCalculationRequest
  ): Promise<EnhancementCalculationResponse> {
    const breakdown: Array<{ item: string; cost: number }> = [];
    let tripProtectionCost = 0;
    let luggageServicesCost = 0;
    let vehicleUpgradeCost = 0;
    let childSeatsCost = 0;
    let additionalStopsCost = 0;

    // Trip protection
    if (request.tripProtection) {
      tripProtectionCost = this.TRIP_PROTECTION_COST;
      breakdown.push({ item: 'Trip Protection', cost: tripProtectionCost });
    }

    // Luggage services
    if (request.luggageServices) {
      if (request.luggageServices.meetAndGreet) {
        luggageServicesCost += this.MEET_AND_GREET_COST;
        breakdown.push({ item: 'Meet & Greet Service', cost: this.MEET_AND_GREET_COST });
      }

      if (request.luggageServices.extraBags && request.luggageServices.extraBags > 2) {
        const extraBagsCost = (request.luggageServices.extraBags - 2) * this.EXTRA_BAG_COST;
        luggageServicesCost += extraBagsCost;
        breakdown.push({ 
          item: `Extra Luggage (${request.luggageServices.extraBags - 2} bags)`, 
          cost: extraBagsCost 
        });
      }

      if (request.luggageServices.specialHandling?.length) {
        const specialHandlingCost = request.luggageServices.specialHandling.length * this.SPECIAL_HANDLING_COST;
        luggageServicesCost += specialHandlingCost;
        breakdown.push({ 
          item: `Special Handling (${request.luggageServices.specialHandling.join(', ')})`, 
          cost: specialHandlingCost 
        });
      }
    }

    // Vehicle upgrade
    if (request.vehicleUpgrade) {
      vehicleUpgradeCost = await this.calculateVehicleUpgradeCost(
        'standard',
        request.vehicleUpgrade,
        request.bookingAmount
      );
      if (vehicleUpgradeCost > 0) {
        breakdown.push({ 
          item: `Vehicle Upgrade to ${request.vehicleUpgrade.replace('_', ' ')}`, 
          cost: vehicleUpgradeCost 
        });
      }
    }

    // Child seats
    if (request.childSeats) {
      let totalSeats = 0;
      if (request.childSeats.infant) {
        totalSeats += request.childSeats.infant;
        breakdown.push({ 
          item: `Infant Seat (${request.childSeats.infant})`, 
          cost: request.childSeats.infant * this.CHILD_SEAT_COST 
        });
      }
      if (request.childSeats.toddler) {
        totalSeats += request.childSeats.toddler;
        breakdown.push({ 
          item: `Toddler Seat (${request.childSeats.toddler})`, 
          cost: request.childSeats.toddler * this.CHILD_SEAT_COST 
        });
      }
      if (request.childSeats.booster) {
        totalSeats += request.childSeats.booster;
        breakdown.push({ 
          item: `Booster Seat (${request.childSeats.booster})`, 
          cost: request.childSeats.booster * this.CHILD_SEAT_COST 
        });
      }
      childSeatsCost = totalSeats * this.CHILD_SEAT_COST;
    }

    // Additional stops
    if (request.additionalStops && request.additionalStops > 0) {
      additionalStopsCost = request.additionalStops * this.ADDITIONAL_STOP_COST;
      breakdown.push({ 
        item: `Additional Stops (${request.additionalStops})`, 
        cost: additionalStopsCost 
      });
    }

    const totalEnhancementCost = 
      tripProtectionCost + 
      luggageServicesCost + 
      vehicleUpgradeCost + 
      childSeatsCost +
      additionalStopsCost;

    return {
      tripProtectionCost,
      luggageServicesCost,
      vehicleUpgradeCost,
      childSeatsCost,
      totalEnhancementCost,
      breakdown
    };
  }

  /**
   * Calculate vehicle upgrade cost
   */
  private async calculateVehicleUpgradeCost(
    baseVehicle: string,
    preferredVehicle: string,
    bookingAmount: number
  ): Promise<number> {
    if (baseVehicle === preferredVehicle) return 0;

    // Fixed upgrade pricing
    const upgradePricing: Record<string, number> = {
      'standard_to_luxury_sedan': 25,
      'standard_to_suv': 15,
      'standard_to_executive': 35,
      'standard_to_eco_friendly': 0,
      'luxury_sedan_to_executive': 20,
      'suv_to_executive': 25,
    };

    const upgradeKey = `${baseVehicle}_to_${preferredVehicle}`;
    return upgradePricing[upgradeKey] || 0;
  }

  /**
   * Create or update trip enhancements for a booking
   */
  async upsertTripEnhancements(
    bookingId: string,
    enhancements: Partial<TripEnhancements>
  ): Promise<TripEnhancement> {
    try {
      // Calculate total cost
      const calculationRequest: EnhancementCalculationRequest = {
        bookingAmount: 0, // We'll get this from the booking
        serviceType: 'ONE_WAY', // We'll get this from the booking
        tripProtection: enhancements.tripProtection?.enabled,
        luggageServices: enhancements.luggageServices ? {
          meetAndGreet: enhancements.luggageServices.meetAndGreet.enabled,
          extraBags: enhancements.luggageServices.extraLuggage.count,
          specialHandling: enhancements.luggageServices.specialHandling.options
            .filter(opt => opt.selected)
            .map(opt => opt.type)
        } : undefined,
        vehicleUpgrade: enhancements.specialRequests?.vehiclePreferences.type,
        childSeats: enhancements.specialRequests?.childSafety ? {
          infant: enhancements.specialRequests.childSafety.infantSeat,
          toddler: enhancements.specialRequests.childSafety.toddlerSeat,
          booster: enhancements.specialRequests.childSafety.boosterSeat
        } : undefined
      };

      // Get booking details
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId }
      });

      if (!booking) {
        throw new AppError(404, 'Booking not found');
      }

      calculationRequest.bookingAmount = booking.totalAmount.toNumber();
      calculationRequest.serviceType = booking.serviceType;

      const costs = await this.calculateEnhancementCosts(calculationRequest);

      const enhancementData: Prisma.TripEnhancementCreateInput = {
        booking: { connect: { id: bookingId } },
        tripProtection: enhancements.tripProtection?.enabled || false,
        meetAndGreet: enhancements.luggageServices?.meetAndGreet.enabled || false,
        luggageAssistance: enhancements.luggageServices as any,
        flightInfo: enhancements.flightInfo as any,
        specialRequests: enhancements.specialRequests as any,
        vehiclePreferences: enhancements.specialRequests?.vehiclePreferences as any,
        childSeatRequests: enhancements.specialRequests?.childSafety as any,
        totalEnhancementCost: costs.totalEnhancementCost
      };

      const tripEnhancement = await prisma.tripEnhancement.upsert({
        where: { bookingId },
        create: enhancementData,
        update: {
          tripProtection: enhancements.tripProtection?.enabled || false,
          meetAndGreet: enhancements.luggageServices?.meetAndGreet.enabled || false,
          luggageAssistance: enhancements.luggageServices as any,
          flightInfo: enhancements.flightInfo as any,
          specialRequests: enhancements.specialRequests as any,
          vehiclePreferences: enhancements.specialRequests?.vehiclePreferences as any,
          childSeatRequests: enhancements.specialRequests?.childSafety as any,
          totalEnhancementCost: costs.totalEnhancementCost
        }
      });

      logger.info('Trip enhancements updated', { 
        bookingId, 
        enhancementId: tripEnhancement.id,
        totalCost: costs.totalEnhancementCost 
      });

      return tripEnhancement;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to upsert trip enhancements', error);
      throw new AppError(500, 'Failed to update trip enhancements');
    }
  }

  /**
   * Get trip enhancements for a booking
   */
  async getTripEnhancements(bookingId: string): Promise<TripEnhancement | null> {
    return await prisma.tripEnhancement.findUnique({
      where: { bookingId }
    });
  }

  /**
   * Get available vehicle options
   */
  async getVehicleOptions(): Promise<VehicleOption[]> {
    return await prisma.vehicleOption.findMany({
      where: { isAvailable: true },
      orderBy: { basePriceMultiplier: 'asc' }
    });
  }

  /**
   * Get enhancement options by category
   */
  async getEnhancementOptions(category?: string): Promise<EnhancementOption[]> {
    const where: Prisma.EnhancementOptionWhereInput = {
      isActive: true
    };

    if (category) {
      where.category = category.toUpperCase() as any;
    }

    return await prisma.enhancementOption.findMany({
      where,
      orderBy: { cost: 'asc' }
    });
  }

  /**
   * Seed default vehicle options
   */
  async seedVehicleOptions(): Promise<void> {
    const vehicleOptions = [
      {
        type: 'STANDARD' as const,
        name: 'Standard Sedan',
        description: 'Comfortable sedan for up to 3 passengers',
        features: ['Air conditioning', 'Radio', 'USB charging'],
        basePriceMultiplier: 1.0,
        imageUrl: '/images/vehicles/standard-sedan.jpg'
      },
      {
        type: 'LUXURY_SEDAN' as const,
        name: 'Luxury Sedan',
        description: 'Premium sedan with luxury amenities',
        features: ['Leather seats', 'Climate control', 'Premium sound', 'WiFi', 'Water bottles'],
        basePriceMultiplier: 1.25,
        imageUrl: '/images/vehicles/luxury-sedan.jpg'
      },
      {
        type: 'SUV' as const,
        name: 'SUV',
        description: 'Spacious SUV for up to 6 passengers',
        features: ['Extra luggage space', 'All-wheel drive', 'Third row seating'],
        basePriceMultiplier: 1.15,
        imageUrl: '/images/vehicles/suv.jpg'
      },
      {
        type: 'EXECUTIVE' as const,
        name: 'Executive',
        description: 'Top-tier luxury vehicle for VIP experience',
        features: ['Executive seating', 'Privacy glass', 'Champagne service', 'Newspaper', 'WiFi'],
        basePriceMultiplier: 1.5,
        imageUrl: '/images/vehicles/executive.jpg'
      },
      {
        type: 'ECO_FRIENDLY' as const,
        name: 'Eco-Friendly',
        description: 'Hybrid or electric vehicle',
        features: ['Zero emissions', 'Quiet ride', 'USB charging', 'Eco-conscious'],
        basePriceMultiplier: 1.0,
        imageUrl: '/images/vehicles/eco-friendly.jpg'
      }
    ];

    for (const option of vehicleOptions) {
      await prisma.vehicleOption.upsert({
        where: { type: option.type },
        create: option,
        update: option
      });
    }

    logger.info('Vehicle options seeded successfully');
  }

  /**
   * Seed default enhancement options
   */
  async seedEnhancementOptions(): Promise<void> {
    const enhancementOptions = [
      {
        category: 'PROTECTION' as const,
        name: 'Trip Protection',
        description: 'Cancel for any reason up to 1 hour before pickup',
        cost: 9.00,
        configuration: {
          refundPercentage: 100,
          timeLimits: {
            fullRefund: 60, // minutes
            partialRefund: 30
          }
        }
      },
      {
        category: 'LUGGAGE' as const,
        name: 'Meet & Greet Service',
        description: 'Driver will meet you at arrival gate with sign',
        cost: 15.00,
        configuration: {
          includes: [
            'Personal greeting at arrival gate',
            'Assistance with luggage',
            'Direct escort to vehicle'
          ]
        }
      },
      {
        category: 'LUGGAGE' as const,
        name: 'Extra Luggage',
        description: 'Additional luggage beyond 2 large bags',
        cost: 5.00,
        configuration: {
          pricePerBag: true
        }
      },
      {
        category: 'CHILD_SAFETY' as const,
        name: 'Child Car Seat',
        description: 'Age-appropriate child safety seat',
        cost: 15.00,
        configuration: {
          types: ['infant', 'toddler', 'booster']
        }
      },
      {
        category: 'SPECIAL_REQUEST' as const,
        name: 'Special Handling',
        description: 'Special care for sports equipment or fragile items',
        cost: 10.00,
        configuration: {
          types: ['golf_clubs', 'ski_equipment', 'musical_instruments', 'fragile_items']
        }
      }
    ];

    for (const option of enhancementOptions) {
      await prisma.enhancementOption.create({
        data: option
      });
    }

    logger.info('Enhancement options seeded successfully');
  }
}

export const enhancementService = new EnhancementService();