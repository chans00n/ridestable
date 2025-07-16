import { api } from './api';
import type { BookingFormData } from '../types/booking-types';

export interface CreateBookingDto {
  serviceType: string;
  pickupAddress: string;
  pickupLatitude: number;
  pickupLongitude: number;
  dropoffAddress?: string;
  dropoffLatitude?: number;
  dropoffLongitude?: number;
  scheduledDateTime: string;
  returnDateTime?: string;
  durationHours?: number;
  specialInstructions?: string;
  contactPhone: string;
  gratuityPercentage?: number;
  gratuityAmount?: number;
  enhancementCost?: number;
}

export interface BookingResponse {
  id: string;
  status: string;
  totalAmount: number;
  createdAt: string;
}

export const bookingService = {
  async createBooking(data: BookingFormData & { serviceType: string; gratuityPercentage?: number; gratuityAmount?: number; enhancementCost?: number }): Promise<BookingResponse> {
    const dto: CreateBookingDto = {
      serviceType: data.serviceType.toUpperCase().replace('-', '_'),
      pickupAddress: data.pickupLocation.address,
      pickupLatitude: data.pickupLocation.lat,
      pickupLongitude: data.pickupLocation.lng,
      scheduledDateTime: data.pickupDateTime.toISOString(),
      contactPhone: data.contactPhone,
      specialInstructions: data.specialInstructions,
    };

    if (data.dropoffLocation) {
      dto.dropoffAddress = data.dropoffLocation.address;
      dto.dropoffLatitude = data.dropoffLocation.lat;
      dto.dropoffLongitude = data.dropoffLocation.lng;
    }

    if (data.returnDateTime) {
      dto.returnDateTime = data.returnDateTime.toISOString();
    }

    if (data.durationHours) {
      dto.durationHours = data.durationHours;
    }

    if (data.gratuityPercentage !== undefined) {
      dto.gratuityPercentage = data.gratuityPercentage;
    }

    if (data.gratuityAmount !== undefined) {
      dto.gratuityAmount = data.gratuityAmount;
    }

    if (data.enhancementCost !== undefined) {
      dto.enhancementCost = data.enhancementCost;
    }

    const response = await api.post<{ success: boolean; data: BookingResponse }>('/bookings', dto);
    return response.data.data;
  },

  async saveDraft(userId: string, data: Partial<BookingFormData>): Promise<void> {
    await api.post('/bookings/draft', {
      userId,
      formData: data,
    });
  },

  async getDraft(userId: string, serviceType: string): Promise<Partial<BookingFormData> | null> {
    try {
      const response = await api.get(`/bookings/draft/${userId}/${serviceType}`);
      return response.data.formData;
    } catch (error) {
      return null;
    }
  },

  async checkAvailability(dateTime: Date): Promise<boolean> {
    const response = await api.get('/bookings/availability', {
      params: {
        dateTime: dateTime.toISOString(),
      },
    });
    return response.data.available;
  },
};