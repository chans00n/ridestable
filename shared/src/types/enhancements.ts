export interface TripProtection {
  enabled: boolean;
  cost: number; // $9 flat fee
  coverage: {
    cancellationReasons: string[];
    refundPercentage: number;
    timeLimits: {
      fullRefund: number; // 1 hour before pickup
      partialRefund: number; // 30 minutes before pickup
    };
  };
  termsAndConditions: string;
}

export interface LuggageServices {
  meetAndGreet: {
    enabled: boolean;
    cost: number; // $15 fee
    description: string;
    includes: string[]; // ["Driver will meet you at arrival", "Assistance with luggage", "Direct escort to vehicle"]
  };
  extraLuggage: {
    enabled: boolean;
    count: number;
    threshold: number; // More than 2 large bags
    costPerBag: number; // $5 per additional bag
  };
  specialHandling: {
    enabled: boolean;
    options: SpecialHandlingOption[];
  };
}

export interface SpecialHandlingOption {
  type: 'golf_clubs' | 'ski_equipment' | 'musical_instruments' | 'fragile_items';
  cost: number;
  requirements: string;
  selected?: boolean;
}

export interface FlightInformation {
  airline: string;
  flightNumber: string;
  departureAirport: string;
  arrivalAirport: string;
  scheduledArrival: Date | string;
  actualArrival?: Date | string;
  flightStatus?: 'on-time' | 'delayed' | 'cancelled' | 'landed';
  terminal?: string;
  gate?: string;
  baggageClaim?: string;
}

export interface SpecialRequests {
  vehiclePreferences: {
    type: 'standard' | 'luxury_sedan' | 'suv' | 'executive' | 'eco_friendly';
    features: string[]; // ['leather_seats', 'wifi', 'phone_charger', 'water']
    accessibility: AccessibilityOption[];
  };
  childSafety: {
    infantSeat: number; // 0-12 months
    toddlerSeat: number; // 1-3 years
    boosterSeat: number; // 4-8 years
  };
  customRequests: {
    temperature?: 'cool' | 'comfortable' | 'warm';
    music?: 'none' | 'soft' | 'customer_playlist';
    refreshments?: boolean;
    newspapers?: string[];
    stops?: AdditionalStop[];
    specialInstructions?: string;
  };
  businessNeeds: {
    wifiRequired?: boolean;
    quietRide?: boolean;
    workingSurface?: boolean;
    phoneConference?: boolean;
  };
}

export interface AccessibilityOption {
  type: 'wheelchair_accessible' | 'service_animal' | 'hearing_impaired' | 'visual_impaired';
  selected: boolean;
  details?: string;
}

export interface AdditionalStop {
  address: string;
  duration: number; // minutes
  purpose?: string;
}

export interface TripEnhancements {
  tripProtection?: TripProtection;
  luggageServices?: LuggageServices;
  flightInfo?: FlightInformation;
  specialRequests?: SpecialRequests;
  totalEnhancementCost: number;
}

export interface VehicleOption {
  id: string;
  type: 'standard' | 'luxury_sedan' | 'suv' | 'executive' | 'eco_friendly';
  name: string;
  description?: string;
  features?: string[];
  basePriceMultiplier: number;
  imageUrl?: string;
  isAvailable: boolean;
}

export interface EnhancementOption {
  id: string;
  category: 'protection' | 'luggage' | 'vehicle' | 'child_safety' | 'special_request';
  name: string;
  description?: string;
  cost: number;
  isActive: boolean;
  configuration?: any;
}

export interface EnhancementCalculationRequest {
  bookingAmount: number;
  serviceType: 'ONE_WAY' | 'ROUNDTRIP' | 'HOURLY';
  tripProtection?: boolean;
  luggageServices?: {
    meetAndGreet?: boolean;
    extraBags?: number;
    specialHandling?: string[];
  };
  vehicleUpgrade?: string;
  childSeats?: {
    infant?: number;
    toddler?: number;
    booster?: number;
  };
  additionalStops?: number;
}

export interface EnhancementCalculationResponse {
  tripProtectionCost: number;
  luggageServicesCost: number;
  vehicleUpgradeCost: number;
  childSeatsCost: number;
  totalEnhancementCost: number;
  breakdown: Array<{
    item: string;
    cost: number;
  }>;
}