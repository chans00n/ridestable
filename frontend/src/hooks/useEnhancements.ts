import { useState } from 'react';
import { api } from '../services/api';
import type { 
  EnhancementCalculationRequest, 
  EnhancementCalculationResponse,
  TripEnhancements,
  VehicleOption,
  EnhancementOption
} from '@stable-ride/shared';

export const useEnhancements = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateEnhancements = async (
    request: EnhancementCalculationRequest
  ): Promise<EnhancementCalculationResponse> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/enhancements/calculate', request);
      return response.data.data;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to calculate enhancements';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getEnhancementOptions = async (category?: string): Promise<EnhancementOption[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const params = category ? { category } : {};
      const response = await api.get('/enhancements/options', { params });
      return response.data.data;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to get enhancement options';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getVehicleOptions = async (): Promise<VehicleOption[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get('/enhancements/vehicles');
      return response.data.data;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to get vehicle options';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const upsertBookingEnhancements = async (
    bookingId: string,
    enhancements: Partial<TripEnhancements>
  ): Promise<any> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post(`/enhancements/bookings/${bookingId}`, enhancements);
      return response.data.data;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to update enhancements';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getBookingEnhancements = async (bookingId: string): Promise<any> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get(`/enhancements/bookings/${bookingId}`);
      return response.data.data;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to get booking enhancements';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    calculateEnhancements,
    getEnhancementOptions,
    getVehicleOptions,
    upsertBookingEnhancements,
    getBookingEnhancements,
    loading,
    error
  };
};