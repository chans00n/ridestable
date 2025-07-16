export type ServiceTypeId = 'one-way' | 'roundtrip' | 'hourly';

export interface ServiceType {
  id: ServiceTypeId;
  name: string;
  description: string;
  icon: string;
  features: string[];
  startingPrice: string;
}

export interface BookingLocation {
  id?: string;
  address: string;
  lat: number;
  lng: number;
  placeId?: string;
  instructions?: string;
  type?: 'home' | 'work' | 'custom';
  name?: string;
  isAirport?: boolean;
  airportCode?: string;
}

export interface BookingFormData {
  serviceType: ServiceTypeId;
  pickupLocation: BookingLocation;
  dropoffLocation?: BookingLocation;
  pickupDateTime: Date;
  returnDateTime?: Date;
  durationHours?: number;
  specialInstructions?: string;
  contactPhone: string;
  samePickupLocation?: boolean;
}

export interface BookingDraft {
  id?: string;
  userId: string;
  formData: Partial<BookingFormData>;
  createdAt: Date;
  updatedAt: Date;
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
  validUntil: string;
  bookingReference: string;
  distance?: number;
  duration?: number;
  distanceText?: string;
  durationText?: string;
}