import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { PaymentForm, PaymentSummary } from '../components/payment';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { showToast } from '../components/ui/Toast';
import { usePayment } from '../hooks/usePayment';
import { Skeleton } from '@/components/ui/skeleton';

interface BookingDetails {
  id: string;
  userId: string;
  serviceType: string;
  status: string;
  scheduledDateTime: string;
  pickupAddress: string;
  dropoffAddress: string;
  totalAmount: number;
  notes?: string;
}

export const PaymentPage: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createPaymentIntent } = usePayment();
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);

  useEffect(() => {
    const fetchBooking = async () => {
      if (!bookingId) {
        showToast.error('Invalid booking ID');
        navigate('/bookings');
        return;
      }

      try {
        const response = await api.get(`/bookings/${bookingId}`);
        const bookingData = response.data.data;
        
        // Verify booking belongs to user
        if (bookingData.userId !== user?.id) {
          showToast.error('Unauthorized access');
          navigate('/bookings');
          return;
        }

        // Check if payment already exists
        if (bookingData.payment && bookingData.payment.status === 'COMPLETED') {
          showToast.info('This booking has already been paid');
          navigate('/bookings');
          return;
        }

        setBooking(bookingData);
        
        // Create payment intent
        try {
          const paymentData = await createPaymentIntent({
            bookingId: bookingData.id,
            amount: typeof bookingData.totalAmount === 'string' ? parseFloat(bookingData.totalAmount) : bookingData.totalAmount
          });
          setClientSecret(paymentData.clientSecret);
          setPaymentId(paymentData.paymentId);
        } catch (error) {
          console.error('Failed to create payment intent:', error);
          showToast.error('Failed to initialize payment');
        }
      } catch (error) {
        console.error('Failed to fetch booking:', error);
        showToast.error('Failed to load booking details');
        navigate('/bookings');
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId, user?.id, navigate]);

  const handlePaymentSuccess = async (paymentId: string) => {
    showToast.success('Payment successful! Redirecting...');
    
    // Navigate to payment confirmation
    setTimeout(() => {
      navigate(`/payment/confirmation`, {
        state: {
          paymentId,
          bookingId,
          success: true
        }
      });
    }, 1500);
  };

  const handlePaymentError = (error: string) => {
    showToast.error(error);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <Skeleton className="h-8 w-64 mb-8" />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Payment Summary Skeleton */}
            <div className="order-2 lg:order-1">
              <div className="bg-card rounded-lg shadow-sm p-6 space-y-4">
                <Skeleton className="h-6 w-32" />
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
                <div className="pt-4 border-t space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-6 w-32" />
                </div>
              </div>
            </div>

            {/* Payment Form Skeleton */}
            <div className="order-1 lg:order-2">
              <div className="bg-card rounded-lg shadow-sm p-6">
                <Skeleton className="h-6 w-40 mb-4" />
                <div className="space-y-4">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!booking) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-8">Complete Your Payment</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Payment Summary */}
          <div className="order-2 lg:order-1">
            <PaymentSummary
              amount={booking.totalAmount}
              serviceType={booking.serviceType}
              pickupDate={booking.scheduledDateTime}
              pickupLocation={booking.pickupAddress}
              dropoffLocation={booking.dropoffAddress}
            />
          </div>

          {/* Payment Form */}
          <div className="order-1 lg:order-2">
            <div className="bg-card rounded-lg shadow-sm p-6">
              {clientSecret && paymentId ? (
                <PaymentForm 
                  clientSecret={clientSecret}
                  paymentId={paymentId}
                  amount={typeof booking.totalAmount === 'string' ? parseFloat(booking.totalAmount) : booking.totalAmount}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                />
              ) : (
                <div className="text-center py-8">
                  <Skeleton className="h-8 w-8 rounded-full mx-auto mb-4" />
                  <p className="text-muted-foreground">Initializing payment...</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Back to Bookings Link */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/bookings')}
            className="text-sm text-muted-foreground hover:text-foreground underline"
          >
            Cancel and return to bookings
          </button>
        </div>
      </div>
    </div>
  );
};