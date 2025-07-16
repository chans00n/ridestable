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