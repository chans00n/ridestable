import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { usePayment } from '../../hooks/usePayment';
import { toast } from 'react-hot-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface PaymentDetails {
  paymentId: string;
  status: string;
  amount: number;
  currency: string;
  receiptUrl?: string;
  booking: {
    id: string;
    scheduledDateTime: string;
    pickupAddress: string;
    dropoffAddress: string;
    serviceType: string;
    status: string;
    totalAmount: number;
  };
}

export const PaymentConfirmation: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { getPayment, loading } = usePayment();
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  // Check for payment info from state first, then URL params
  const statePaymentId = location.state?.paymentId;
  const paymentIntentId = searchParams.get('payment_intent');
  const paymentId = statePaymentId || searchParams.get('payment_id');

  useEffect(() => {
    // Prevent multiple fetches
    if (hasFetched || !paymentId) return;

    const fetchPaymentDetails = async () => {
      if (!paymentId && !paymentIntentId) {
        setError('Invalid payment confirmation link');
        return;
      }

      try {
        setHasFetched(true);
        const payment = await getPayment(paymentId);
        setPaymentDetails(payment);

        if (payment.status === 'COMPLETED') {
          toast.success('Payment successful!');
        } else if (payment.status === 'FAILED') {
          toast.error('Payment failed. Please try again.');
        }
      } catch (err: any) {
        // Check if it's a rate limit error
        if (err.response?.status === 429) {
          setError('Too many requests. Please wait a moment and refresh the page.');
          toast.error('Too many requests. Please try again in a moment.');
        } else {
          setError('Failed to load payment details');
          toast.error('Failed to load payment details');
        }
      }
    };

    fetchPaymentDetails();
  }, [paymentId, hasFetched, getPayment, paymentIntentId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            {/* Status Header Skeleton */}
            <div className="p-6 bg-muted/50">
              <Skeleton className="h-16 w-16 rounded-full mx-auto mb-4" />
              <Skeleton className="h-8 w-48 mx-auto mb-2" />
              <Skeleton className="h-4 w-64 mx-auto" />
            </div>

            {/* Payment Details Skeleton */}
            <div className="p-6 space-y-6">
              <div>
                <Skeleton className="h-6 w-32 mb-4" />
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <Skeleton className="h-6 w-40 mb-4" />
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                </div>
              </div>

              {/* Actions Skeleton */}
              <div className="border-t pt-6 space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8">
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="mt-4 text-xl font-semibold">Error</h2>
              <p className="mt-2 text-muted-foreground">{error}</p>
              <Button asChild className="mt-6">
                <Link to="/dashboard">
                  Go to Bookings
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!paymentDetails) {
    return null;
  }

  const isSuccess = paymentDetails.status === 'COMPLETED';

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <Card className="overflow-hidden">
          {/* Status Header */}
          <div className={`p-6 ${isSuccess ? 'bg-green-500/10' : 'bg-destructive/10'}`}>
            <div className="flex items-center justify-center">
              {isSuccess ? (
                <svg className="h-16 w-16 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="h-16 w-16 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <h1 className="mt-4 text-2xl font-bold text-center">
              {isSuccess ? 'Payment Successful!' : 'Payment Failed'}
            </h1>
            <p className="mt-2 text-center text-muted-foreground">
              {isSuccess
                ? 'Your booking has been confirmed.'
                : 'There was an issue processing your payment.'}
            </p>
          </div>

          {/* Payment Details */}
          <CardContent className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-4">Payment Details</h2>
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Amount Paid:</dt>
                  <dd className="font-medium">
                    ${paymentDetails.amount.toFixed(2)} {paymentDetails.currency.toUpperCase()}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Payment Status:</dt>
                  <dd className="font-medium">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      isSuccess
                        ? 'bg-green-500/20 text-green-600 dark:text-green-400'
                        : 'bg-destructive/20 text-destructive'
                    }`}>
                      {paymentDetails.status}
                    </span>
                  </dd>
                </div>
              </dl>
            </div>

            <div className="border-t pt-6">
              <h2 className="text-lg font-semibold mb-4">Booking Information</h2>
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Service Type:</dt>
                  <dd className="font-medium">
                    {paymentDetails.booking.serviceType.replace('_', ' ')}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Pickup Location:</dt>
                  <dd className="font-medium text-right max-w-[200px]">
                    {paymentDetails.booking.pickupAddress}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Dropoff Location:</dt>
                  <dd className="font-medium text-right max-w-[200px]">
                    {paymentDetails.booking.dropoffAddress}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Pickup Date & Time:</dt>
                  <dd className="font-medium">
                    {new Date(paymentDetails.booking.scheduledDateTime).toLocaleString()}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Actions */}
            <div className="border-t pt-6 space-y-3">
              {isSuccess && paymentDetails.receiptUrl && (
                <Button variant="outline" className="w-full" asChild>
                  <a
                    href={paymentDetails.receiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View Receipt
                  </a>
                </Button>
              )}
              
              <Button className="w-full" asChild>
                <Link to="/dashboard">
                  View My Bookings
                </Link>
              </Button>

              {!isSuccess && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate(-1)}
                >
                  Try Again
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            A confirmation email has been sent to your registered email address.
          </p>
          <p className="mt-2">
            Need help? <a href="mailto:support@stableride.com" className="text-primary hover:underline">Contact Support</a>
          </p>
        </div>
      </div>
    </div>
  );
};