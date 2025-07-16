import { PricingConfig } from '../types/pricing.types';

export const DEFAULT_PRICING_CONFIG: PricingConfig = {
  oneWay: {
    baseRate: 25.00,
    perMileRate: 2.50,
    minimumFare: 35.00,
    maximumDistance: 100, // miles
  },
  roundtrip: {
    multiplier: 1.8,
    waitTimeRate: 30.00, // per hour
    sameDayDiscount: 0.10, // 10%
  },
  hourly: {
    baseHourlyRate: 75.00,
    minimumHours: 2,
    overtimeRate: 90.00,
    includedMiles: 30,
    excessMileRate: 1.50,
  },
  surcharges: {
    airport: 15.00,
    lateNight: 20.00,
    holiday: 25.00,
    peakHours: 15.00,
    tolls: 'estimated',
  },
  discounts: {
    corporateRate: 0.15, // 15%
    loyaltyDiscount: 0.10, // 10%
    advanceBooking: 0.05, // 5%
  },
  taxes: {
    salesTaxRate: 0.08375, // 8.375% for Las Vegas
    airportFeeRate: 0.02, // 2% for airport trips
  },
};