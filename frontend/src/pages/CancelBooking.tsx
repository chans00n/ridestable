import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ExclamationTriangleIcon, 
  CalendarIcon, 
  MapPinIcon,
  ShieldCheckIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import { format, differenceInHours } from 'date-fns';
import { api } from '../services/api';
import { showToast } from '../components/ui/Toast';
import { Skeleton } from '@/components/ui/skeleton';

interface BookingDetails {
  id: string;
  serviceType: string;
  scheduledDateTime: string;
  pickupAddress: string;
  dropoffAddress: string;
  totalAmount: number;
  status: string;
  confirmation?: {
    bookingReference: string;
  };
  enhancements?: {
    tripProtection: boolean;
  };
  payment?: {
    amount: number;
    status: string;
  };
}

interface CancellationPolicy {
  timeframes: {
    fullRefund: number;
    partialRefund: number;
    noRefund: number;
  };
  tripProtectionOverride: boolean;
  cancellationFees: {
    standard: number;
    lastMinute: number;
  };
}

interface RefundCalculation {
  refundAmount: number;
  cancellationFee: number;
  refundPercentage: number;
  reason: string;
}

export const CancelBooking: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [policy, setPolicy] = useState<CancellationPolicy | null>(null);
  const [reason, setReason] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [refundCalculation, setRefundCalculation] = useState<RefundCalculation | null>(null);

  useEffect(() => {
    if (bookingId) {
      fetchData();
    }
  }, [bookingId]);

  const fetchData = async () => {
    try {
      const [bookingResponse, policyResponse] = await Promise.all([
        api.get(`/bookings/${bookingId}`),
        api.get('/bookings/cancellation-policy')
      ]);
      
      setBooking(bookingResponse.data.data);
      setPolicy(policyResponse.data.data);
      
      // Calculate refund immediately
      calculateRefund(bookingResponse.data.data, policyResponse.data.data);
    } catch (error) {
      showToast.error('Failed to load booking details');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const calculateRefund = (bookingData: BookingDetails, policyData: CancellationPolicy) => {
    const hoursUntilPickup = differenceInHours(
      new Date(bookingData.scheduledDateTime),
      new Date()
    );
    
    const paidAmount = bookingData.payment?.amount || 0;
    let refundPercentage = 0;
    let cancellationFee = 0;
    let refundReason = '';
    
    const hasTripProtection = bookingData.enhancements?.tripProtection || false;
    
    if (hasTripProtection && policyData.tripProtectionOverride) {
      refundPercentage = 100;
      cancellationFee = 5; // Small processing fee
      refundReason = 'Trip protection provides full refund minus processing fee';
    } else if (hoursUntilPickup >= policyData.timeframes.fullRefund) {
      refundPercentage = 100;
      cancellationFee = policyData.cancellationFees.standard;
      refundReason = `Full refund (cancelled ${hoursUntilPickup} hours before pickup)`;
    } else if (hoursUntilPickup >= policyData.timeframes.partialRefund) {
      refundPercentage = 50;
      cancellationFee = policyData.cancellationFees.standard;
      refundReason = `50% refund (cancelled ${hoursUntilPickup} hours before pickup)`;
    } else {
      refundPercentage = 0;
      cancellationFee = policyData.cancellationFees.lastMinute;
      refundReason = 'No refund (cancelled less than 2 hours before pickup)';
    }
    
    const grossRefund = (paidAmount * refundPercentage) / 100;
    const refundAmount = Math.max(0, grossRefund - cancellationFee);
    
    setRefundCalculation({
      refundAmount,
      cancellationFee,
      refundPercentage,
      reason: refundReason
    });
  };

  const handleCancel = async () => {
    if (!reason.trim()) {
      showToast.error('Please provide a reason for cancellation');
      return;
    }
    
    setConfirming(true);
    
    try {
      const response = await api.post(`/bookings/${bookingId}/cancel`, {
        reason,
        cancellationType: 'customer'
      });
      
      showToast.success('Booking cancelled successfully');
      
      // Show cancellation details
      navigate(`/bookings/${bookingId}/cancellation-confirmation`, {
        state: {
          cancellation: response.data.data,
          refundCalculation
        }
      });
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Failed to cancel booking');
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-card shadow rounded-lg">
            {/* Header Skeleton */}
            <div className="px-6 py-4 border-b border-border">
              <div className="flex items-center">
                <Skeleton className="h-6 w-6 mr-2" />
                <Skeleton className="h-8 w-48" />
              </div>
              <Skeleton className="h-4 w-32 mt-1" />
            </div>

            <div className="p-6 space-y-6">
              {/* Booking Details Skeleton */}
              <div className="bg-muted rounded-lg p-4">
                <Skeleton className="h-5 w-32 mb-3" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>

              {/* Refund Calculation Skeleton */}
              <div className="bg-primary/10 rounded-lg p-4">
                <Skeleton className="h-5 w-40 mb-3" />
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-6 w-24" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Policy Skeleton */}
              <div className="border rounded-lg p-4">
                <Skeleton className="h-5 w-40 mb-2" />
                <div className="space-y-1">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>

              {/* Reason Dropdown Skeleton */}
              <div>
                <Skeleton className="h-4 w-48 mb-2" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>

              {/* Actions Skeleton */}
              <div className="flex justify-between">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-32" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!booking || !policy || !refundCalculation) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-card shadow rounded-lg">
          {/* Header */}
          <div className="px-6 py-4 border-b border-border">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-6 w-6 text-destructive mr-2" />
              <h1 className="text-2xl font-bold text-foreground">Cancel Booking</h1>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Reference: {booking.confirmation?.bookingReference}
            </p>
          </div>

          <div className="p-6 space-y-6">
            {/* Booking Details */}
            <div className="bg-muted rounded-lg p-4">
              <h3 className="font-medium text-foreground mb-3">Booking Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center text-muted-foreground">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  {format(new Date(booking.scheduledDateTime), 'PPpp')}
                </div>
                <div className="flex items-center text-muted-foreground">
                  <MapPinIcon className="h-4 w-4 mr-2" />
                  {booking.pickupAddress} → {booking.dropoffAddress}
                </div>
                {booking.enhancements?.tripProtection && (
                  <div className="flex items-center text-green-600">
                    <ShieldCheckIcon className="h-4 w-4 mr-2" />
                    Trip Protection Active
                  </div>
                )}
              </div>
            </div>

            {/* Refund Calculation */}
            <div className="bg-primary/10 rounded-lg p-4">
              <h3 className="font-medium text-foreground mb-3">Refund Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Original Amount:</span>
                  <span className="font-medium">${Number(booking.totalAmount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Refund Percentage:</span>
                  <span className="font-medium">{refundCalculation.refundPercentage}%</span>
                </div>
                {refundCalculation.cancellationFee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Cancellation Fee:</span>
                    <span className="font-medium text-destructive">
                      -${refundCalculation.cancellationFee.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="border-t pt-3">
                  <div className="flex justify-between">
                    <span className="font-medium text-foreground">Refund Amount:</span>
                    <span className="text-lg font-bold text-green-600">
                      ${refundCalculation.refundAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {refundCalculation.reason}
                </p>
              </div>
            </div>

            {/* Cancellation Policy */}
            <div className="border rounded-lg p-4">
              <h3 className="font-medium text-foreground mb-2">Cancellation Policy</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• {policy.timeframes.fullRefund}+ hours before: 100% refund minus ${policy.cancellationFees.standard} fee</li>
                <li>• {policy.timeframes.partialRefund}-{policy.timeframes.fullRefund} hours before: 50% refund minus ${policy.cancellationFees.standard} fee</li>
                <li>• Less than {policy.timeframes.partialRefund} hours: No refund</li>
                {booking.enhancements?.tripProtection && (
                  <li className="text-green-600">• Trip Protection: Full refund minus $5 processing fee</li>
                )}
              </ul>
            </div>

            {/* Cancellation Reason */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Reason for Cancellation <span className="text-destructive">*</span>
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="block w-full rounded-md border-input bg-background text-foreground shadow-sm focus:ring-ring focus:border-ring"
                required
              >
                <option value="">Select a reason...</option>
                <option value="change_of_plans">Change of plans</option>
                <option value="found_alternative">Found alternative transportation</option>
                <option value="medical_emergency">Medical emergency</option>
                <option value="weather">Weather conditions</option>
                <option value="pricing">Pricing concerns</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Warning */}
            <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4">
              <div className="flex">
                <ExclamationTriangleIcon className="h-5 w-5 text-destructive mr-2" />
                <div>
                  <h4 className="text-sm font-medium text-destructive">
                    This action cannot be undone
                  </h4>
                  <p className="mt-1 text-sm text-destructive/90">
                    Once you cancel this booking, you will need to create a new booking if you change your mind.
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            {!showConfirmation ? (
              <div className="flex justify-between">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-4 py-2 border border-border rounded-md text-foreground hover:bg-accent hover:text-accent-foreground"
                >
                  Keep Booking
                </button>
                <button
                  onClick={() => setShowConfirmation(true)}
                  disabled={!reason}
                  className="px-6 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel Booking
                </button>
              </div>
            ) : (
              <div className="bg-muted rounded-lg p-4">
                <p className="text-center text-foreground mb-4">
                  Are you sure you want to cancel this booking?
                </p>
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => setShowConfirmation(false)}
                    className="px-4 py-2 border border-border rounded-md text-foreground hover:bg-accent hover:text-accent-foreground"
                  >
                    No, Keep It
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={confirming}
                    className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                  >
                    {confirming ? 'Cancelling...' : 'Yes, Cancel It'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};