import { prisma } from '../config/database';
import { logger } from '../config/logger';
import { DEFAULT_PRICING_CONFIG } from '../config/pricing.config';
import { 
  PricingConfig, 
  BookingDetails, 
  PriceCalculationResult, 
  QuoteBreakdown,
  Surcharge,
  Discount,
  HOLIDAYS_2025,
  PEAK_HOURS,
  LATE_NIGHT_HOURS
} from '../types/pricing.types';
import { v4 as uuidv4 } from 'uuid';
import { addMinutes, format, isWithinInterval, isSameDay } from 'date-fns';

export class PricingEngineService {
  private config: PricingConfig;

  constructor() {
    this.config = DEFAULT_PRICING_CONFIG;
    this.loadConfigFromDatabase();
  }

  private async loadConfigFromDatabase() {
    try {
      const activeConfig = await prisma.pricingConfig.findFirst({
        where: {
          isActive: true,
          effectiveDate: { lte: new Date() },
          OR: [
            { expiryDate: null },
            { expiryDate: { gte: new Date() } }
          ]
        },
        orderBy: { effectiveDate: 'desc' }
      });

      if (activeConfig && activeConfig.config) {
        this.config = activeConfig.config as PricingConfig;
        logger.info('Loaded pricing config from database', { version: activeConfig.version });
      }
    } catch (error) {
      logger.error('Failed to load pricing config from database, using defaults', error);
    }
  }

  public async calculatePrice(booking: BookingDetails): Promise<PriceCalculationResult> {
    try {
      const warnings: string[] = [];
      
      // Validate booking details
      const validation = this.validateBooking(booking);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      let breakdown: QuoteBreakdown;

      switch (booking.serviceType) {
        case 'ONE_WAY':
          breakdown = await this.calculateOneWayPrice(booking);
          break;
        case 'ROUNDTRIP':
          breakdown = await this.calculateRoundtripPrice(booking);
          break;
        case 'HOURLY':
          breakdown = await this.calculateHourlyPrice(booking);
          break;
        default:
          return { success: false, error: 'Invalid service type' };
      }

      // Apply surcharges
      const surcharges = this.calculateSurcharges(booking);
      breakdown.surcharges = surcharges;

      // Apply discounts
      const discounts = this.calculateDiscounts(booking, breakdown.subtotal);
      breakdown.discounts = discounts;

      // Calculate final totals
      const surchargeTotal = surcharges.reduce((sum, s) => sum + s.amount, 0);
      const discountTotal = discounts.reduce((sum, d) => sum + d.amount, 0);
      
      breakdown.subtotal = breakdown.baseRate + breakdown.distanceCharge + breakdown.timeCharges + surchargeTotal - discountTotal;
      
      // Calculate taxes
      breakdown.taxes = this.calculateTaxes(booking, breakdown.subtotal);
      
      // Calculate total
      breakdown.total = breakdown.subtotal + breakdown.taxes.total + breakdown.gratuity;
      
      // Set quote validity (30 minutes)
      breakdown.validUntil = addMinutes(new Date(), 30);
      breakdown.bookingReference = `QT-${uuidv4().substring(0, 8).toUpperCase()}`;

      // Check for warnings
      if (booking.distanceInfo && booking.serviceType === 'ONE_WAY') {
        const miles = booking.distanceInfo.distance / 1609.34;
        if (miles > 80) {
          warnings.push(`Distance exceeds 80 miles. Additional driver rest time may be required.`);
        }
      }

      return {
        success: true,
        breakdown,
        warnings: warnings.length > 0 ? warnings : undefined
      };
    } catch (error) {
      logger.error('Price calculation error:', error);
      return { success: false, error: 'Failed to calculate price' };
    }
  }

  private validateBooking(booking: BookingDetails): { valid: boolean; error?: string } {
    if (!booking.pickupLocation || !booking.pickupDateTime) {
      return { valid: false, error: 'Pickup location and date/time are required' };
    }

    if (booking.serviceType === 'ONE_WAY' || booking.serviceType === 'ROUNDTRIP') {
      if (!booking.dropoffLocation) {
        return { valid: false, error: 'Dropoff location is required for this service type' };
      }
    }

    if (booking.serviceType === 'ROUNDTRIP' && !booking.returnDateTime) {
      return { valid: false, error: 'Return date/time is required for roundtrip service' };
    }

    if (booking.serviceType === 'HOURLY' && (!booking.durationHours || booking.durationHours < this.config.hourly.minimumHours)) {
      return { valid: false, error: `Minimum ${this.config.hourly.minimumHours} hours required for hourly service` };
    }

    // Check maximum distance for one-way
    if (booking.serviceType === 'ONE_WAY' && booking.distanceInfo) {
      const miles = booking.distanceInfo.distance / 1609.34;
      if (miles > this.config.oneWay.maximumDistance) {
        return { valid: false, error: `Distance exceeds maximum of ${this.config.oneWay.maximumDistance} miles` };
      }
    }

    return { valid: true };
  }

  private async calculateOneWayPrice(booking: BookingDetails): Promise<QuoteBreakdown> {
    const baseRate = this.config.oneWay.baseRate;
    let distanceCharge = 0;

    if (booking.distanceInfo) {
      const miles = booking.distanceInfo.distance / 1609.34;
      distanceCharge = miles * this.config.oneWay.perMileRate;
    }

    const subtotal = Math.max(baseRate + distanceCharge, this.config.oneWay.minimumFare);

    return {
      baseRate,
      distanceCharge,
      timeCharges: 0,
      surcharges: [],
      discounts: [],
      subtotal,
      taxes: { salesTax: 0, total: 0 },
      gratuity: 0,
      total: subtotal,
      validUntil: new Date(),
      bookingReference: '',
    };
  }

  private async calculateRoundtripPrice(booking: BookingDetails): Promise<QuoteBreakdown> {
    // First calculate as one-way
    const oneWayCalc = await this.calculateOneWayPrice(booking);
    
    // Apply roundtrip multiplier
    let baseRate = oneWayCalc.baseRate * this.config.roundtrip.multiplier;
    let distanceCharge = oneWayCalc.distanceCharge * this.config.roundtrip.multiplier;
    
    // Calculate wait time if applicable
    let timeCharges = 0;
    if (booking.pickupDateTime && booking.returnDateTime) {
      const pickupTime = new Date(booking.pickupDateTime);
      const returnTime = new Date(booking.returnDateTime);
      const waitHours = (returnTime.getTime() - pickupTime.getTime()) / (1000 * 60 * 60);
      
      // Charge for wait time over 2 hours
      if (waitHours > 2) {
        timeCharges = (waitHours - 2) * this.config.roundtrip.waitTimeRate;
      }
    }

    // Check for same-day discount
    let sameDayDiscount = 0;
    if (booking.pickupDateTime && booking.returnDateTime) {
      if (isSameDay(new Date(booking.pickupDateTime), new Date(booking.returnDateTime))) {
        sameDayDiscount = (baseRate + distanceCharge) * this.config.roundtrip.sameDayDiscount;
      }
    }

    const subtotal = baseRate + distanceCharge + timeCharges - sameDayDiscount;

    return {
      baseRate,
      distanceCharge,
      timeCharges,
      surcharges: [],
      discounts: sameDayDiscount > 0 ? [{
        type: 'same_day',
        name: 'Same Day Roundtrip',
        amount: sameDayDiscount,
        percentage: this.config.roundtrip.sameDayDiscount * 100,
        description: 'Discount for same-day return'
      }] : [],
      subtotal,
      taxes: { salesTax: 0, total: 0 },
      gratuity: 0,
      total: subtotal,
      validUntil: new Date(),
      bookingReference: '',
    };
  }

  private async calculateHourlyPrice(booking: BookingDetails): Promise<QuoteBreakdown> {
    const hours = booking.durationHours || this.config.hourly.minimumHours;
    
    // Calculate base hourly rate
    let baseRate = 0;
    let overtimeHours = 0;
    
    if (hours <= 8) {
      baseRate = hours * this.config.hourly.baseHourlyRate;
    } else {
      baseRate = 8 * this.config.hourly.baseHourlyRate;
      overtimeHours = hours - 8;
      baseRate += overtimeHours * this.config.hourly.overtimeRate;
    }

    // Calculate excess mileage charges
    let distanceCharge = 0;
    if (booking.distanceInfo) {
      const miles = booking.distanceInfo.distance / 1609.34;
      const includedMiles = hours * this.config.hourly.includedMiles;
      
      if (miles > includedMiles) {
        const excessMiles = miles - includedMiles;
        distanceCharge = excessMiles * this.config.hourly.excessMileRate;
      }
    }

    const subtotal = baseRate + distanceCharge;

    return {
      baseRate,
      distanceCharge,
      timeCharges: 0,
      surcharges: [],
      discounts: [],
      subtotal,
      taxes: { salesTax: 0, total: 0 },
      gratuity: 0,
      total: subtotal,
      validUntil: new Date(),
      bookingReference: '',
    };
  }

  private calculateSurcharges(booking: BookingDetails): Surcharge[] {
    const surcharges: Surcharge[] = [];

    // Airport surcharge
    if (booking.pickupLocation.isAirport || booking.dropoffLocation?.isAirport) {
      surcharges.push({
        type: 'airport',
        name: 'Airport Fee',
        amount: this.config.surcharges.airport,
        description: 'Airport pickup/dropoff surcharge'
      });
    }

    // Late night surcharge
    if (this.isLateNight(booking.pickupDateTime)) {
      surcharges.push({
        type: 'late_night',
        name: 'Late Night',
        amount: this.config.surcharges.lateNight,
        description: 'Service between 10 PM - 6 AM'
      });
    }

    // Holiday surcharge
    if (this.isHoliday(booking.pickupDateTime)) {
      surcharges.push({
        type: 'holiday',
        name: 'Holiday',
        amount: this.config.surcharges.holiday,
        description: 'Holiday service surcharge'
      });
    }

    // Peak hours surcharge
    if (this.isPeakHours(booking.pickupDateTime)) {
      surcharges.push({
        type: 'peak_hours',
        name: 'Peak Hours',
        amount: this.config.surcharges.peakHours,
        description: 'Rush hour surcharge'
      });
    }

    return surcharges;
  }

  private calculateDiscounts(booking: BookingDetails, subtotal: number): Discount[] {
    const discounts: Discount[] = [];

    // Corporate discount
    if (booking.corporateAccount) {
      const amount = subtotal * this.config.discounts.corporateRate;
      discounts.push({
        type: 'corporate',
        name: 'Corporate Account',
        amount,
        percentage: this.config.discounts.corporateRate * 100,
        description: 'Corporate account discount'
      });
    }

    // Loyalty discount
    if (booking.isReturningCustomer && !booking.corporateAccount) {
      const amount = subtotal * this.config.discounts.loyaltyDiscount;
      discounts.push({
        type: 'loyalty',
        name: 'Loyalty Discount',
        amount,
        percentage: this.config.discounts.loyaltyDiscount * 100,
        description: 'Returning customer discount'
      });
    }

    // Advance booking discount
    const hoursInAdvance = (new Date(booking.pickupDateTime).getTime() - Date.now()) / (1000 * 60 * 60);
    if (hoursInAdvance >= 48) {
      const amount = subtotal * this.config.discounts.advanceBooking;
      discounts.push({
        type: 'advance_booking',
        name: 'Advance Booking',
        amount,
        percentage: this.config.discounts.advanceBooking * 100,
        description: '48+ hours advance booking'
      });
    }

    return discounts;
  }

  private calculateTaxes(booking: BookingDetails, subtotal: number): { salesTax: number; airportFee?: number; total: number } {
    const salesTax = subtotal * this.config.taxes.salesTaxRate;
    let airportFee = 0;
    
    if (booking.pickupLocation.isAirport || booking.dropoffLocation?.isAirport) {
      airportFee = subtotal * this.config.taxes.airportFeeRate;
    }

    return {
      salesTax,
      airportFee: airportFee > 0 ? airportFee : undefined,
      total: salesTax + airportFee
    };
  }

  private isLateNight(dateTime: Date): boolean {
    const hour = new Date(dateTime).getHours();
    return hour >= LATE_NIGHT_HOURS.start || hour < LATE_NIGHT_HOURS.end;
  }

  private isHoliday(dateTime: Date): boolean {
    const dateStr = format(new Date(dateTime), 'yyyy-MM-dd');
    return HOLIDAYS_2025.includes(dateStr);
  }

  private isPeakHours(dateTime: Date): boolean {
    const date = new Date(dateTime);
    const hour = date.getHours();
    const dayOfWeek = date.getDay();

    // Check if it's a weekday
    if (!PEAK_HOURS.days.includes(dayOfWeek)) {
      return false;
    }

    // Check morning peak hours
    if (hour >= PEAK_HOURS.morning.start && hour < PEAK_HOURS.morning.end) {
      return true;
    }

    // Check evening peak hours
    if (hour >= PEAK_HOURS.evening.start && hour < PEAK_HOURS.evening.end) {
      return true;
    }

    return false;
  }

  public async updateConfig(newConfig: PricingConfig): Promise<void> {
    this.config = newConfig;
    logger.info('Pricing config updated');
  }
}

export const pricingEngine = new PricingEngineService();