export interface PricingConfig {
  oneWay: {
    baseRate: number;          // $25 base
    perMileRate: number;       // $2.50 per mile
    minimumFare: number;       // $35 minimum
    maximumDistance: number;   // 100 mile limit
  };
  roundtrip: {
    multiplier: number;        // 1.8x one-way rate
    waitTimeRate: number;      // $30/hour for wait time
    sameDayDiscount: number;   // 10% discount if return same day
  };
  hourly: {
    baseHourlyRate: number;    // $75/hour
    minimumHours: number;      // 2 hour minimum
    overtimeRate: number;      // $90/hour after 8 hours
    includedMiles: number;     // 30 miles per hour included
    excessMileRate: number;    // $1.50 per excess mile
  };
  surcharges: {
    airport: number;           // $15 airport pickup/dropoff
    lateNight: number;         // $20 between 10 PM - 6 AM
    holiday: number;           // $25 on holidays
    peakHours: number;         // $15 during rush hours
    tolls: 'included' | 'added' | 'estimated';
  };
  discounts: {
    corporateRate: number;     // 15% corporate discount
    loyaltyDiscount: number;   // 10% for returning customers
    advanceBooking: number;    // 5% for 48+ hours advance
  };
  taxes: {
    salesTaxRate: number;      // 8.375% for Las Vegas
    airportFeeRate: number;    // 2% for airport trips
  };
}

export interface DistanceInfo {
  distance: number;     // in meters
  duration: number;     // in seconds
  distanceText: string;
  durationText: string;
}

export interface LocationInfo {
  address: string;
  lat: number;
  lng: number;
  placeId?: string;
  isAirport?: boolean;
}

export interface BookingDetails {
  serviceType: 'ONE_WAY' | 'ROUNDTRIP' | 'HOURLY';
  pickupLocation: LocationInfo;
  dropoffLocation?: LocationInfo;
  pickupDateTime: Date;
  returnDateTime?: Date;
  durationHours?: number;
  distanceInfo?: DistanceInfo;
  specialInstructions?: string;
  corporateAccount?: boolean;
  isReturningCustomer?: boolean;
}

export interface Surcharge {
  type: string;
  name: string;
  amount: number;
  description?: string;
}

export interface Discount {
  type: string;
  name: string;
  amount: number;
  percentage?: number;
  description?: string;
}

export interface QuoteBreakdown {
  baseRate: number;
  distanceCharge: number;
  timeCharges: number;
  surcharges: Surcharge[];
  discounts: Discount[];
  subtotal: number;
  taxes: {
    salesTax: number;
    airportFee?: number;
    total: number;
  };
  gratuity: number;
  total: number;
  validUntil: Date;
  bookingReference: string;
}

export interface PriceCalculationResult {
  success: boolean;
  breakdown?: QuoteBreakdown;
  error?: string;
  warnings?: string[];
}

// Holiday dates for 2025 (expand this list as needed)
export const HOLIDAYS_2025 = [
  '2025-01-01', // New Year's Day
  '2025-05-26', // Memorial Day
  '2025-07-04', // Independence Day
  '2025-09-01', // Labor Day
  '2025-11-27', // Thanksgiving
  '2025-11-28', // Black Friday
  '2025-12-24', // Christmas Eve
  '2025-12-25', // Christmas Day
  '2025-12-31', // New Year's Eve
];

// Peak hours definition
export const PEAK_HOURS = {
  morning: { start: 7, end: 9 },   // 7 AM - 9 AM
  evening: { start: 17, end: 19 }, // 5 PM - 7 PM
  days: [1, 2, 3, 4, 5], // Monday to Friday (0 = Sunday)
};

// Late night hours
export const LATE_NIGHT_HOURS = {
  start: 22, // 10 PM
  end: 6,    // 6 AM
};