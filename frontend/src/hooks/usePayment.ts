import { useState } from 'react';
import { api } from '../services/api';
import { requestDeduplicator } from '../utils/requestDeduplicator';

interface CreatePaymentIntentParams {
  bookingId: string;
  amount: number;
  paymentMethodId?: string;
  savePaymentMethod?: boolean;
}

interface PaymentIntentResponse {
  paymentId: string;
  clientSecret: string;
  amount: number;
  currency: string;
}

interface PaymentMethod {
  id: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
  created: number;
}

export const usePayment = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPaymentIntent = async (params: CreatePaymentIntentParams): Promise<PaymentIntentResponse> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await requestDeduplicator.deduplicate(
        'POST',
        '/payments/intent',
        params,
        () => api.post('/payments/intent', params)
      );
      return response.data.data;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to create payment';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const confirmPayment = async (paymentId: string, paymentMethodId?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post(`/payments/${paymentId}/confirm`, {
        paymentMethodId,
      });
      return response.data.data;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to confirm payment';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getPayment = async (paymentId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get(`/payments/${paymentId}`);
      return response.data.data;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to get payment details';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getPaymentByBooking = async (bookingId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get(`/payments/booking/${bookingId}`);
      return response.data.data;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to get payment details';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const refundPayment = async (paymentId: string, amount?: number, reason?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post(`/payments/${paymentId}/refund`, {
        amount,
        reason,
      });
      return response.data.data;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to process refund';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getPaymentMethods = async (): Promise<PaymentMethod[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get('/payments/methods/list');
      return response.data.data;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to get payment methods';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const addPaymentMethod = async (paymentMethodId: string, setAsDefault?: boolean) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/payments/methods/add', {
        paymentMethodId,
        setAsDefault,
      });
      return response.data.data;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to add payment method';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const removePaymentMethod = async (paymentMethodId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      await api.delete(`/payments/methods/${paymentMethodId}`);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to remove payment method';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    createPaymentIntent,
    confirmPayment,
    getPayment,
    getPaymentByBooking,
    refundPayment,
    getPaymentMethods,
    addPaymentMethod,
    removePaymentMethod,
    loading,
    error,
  };
};