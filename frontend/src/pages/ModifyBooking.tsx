import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar as CalendarIcon, MapPin as MapPinIcon, Truck as TruckIcon } from 'lucide-react';
import { format } from 'date-fns';
import { api } from '../services/api';
import { showToast } from '../components/ui/Toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
    modificationDeadline: string;
  };
}

interface ModificationChanges {
  dateTime?: {
    newPickupTime: Date;
  };
  locations?: {
    newPickupAddress?: string;
    newDropoffAddress?: string;
  };
  serviceType?: {
    from: string;
    to: string;
  };
}

export const ModifyBooking: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [changes, setChanges] = useState<ModificationChanges>({});
  const [reason, setReason] = useState('');
  const [calculating, setCalculating] = useState(false);
  const [priceDifference, setPriceDifference] = useState<number | null>(null);

  // Form states
  const [newPickupDate, setNewPickupDate] = useState('');
  const [newPickupTime, setNewPickupTime] = useState('');
  const [newPickupAddress, setNewPickupAddress] = useState('');
  const [newDropoffAddress, setNewDropoffAddress] = useState('');
  const [newServiceType, setNewServiceType] = useState('');

  useEffect(() => {
    if (bookingId) {
      fetchBookingDetails();
    }
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      const response = await api.get(`/bookings/${bookingId}`);
      const bookingData = response.data.data;
      setBooking(bookingData);
      
      // Initialize form with current values
      const pickupDate = new Date(bookingData.scheduledDateTime);
      setNewPickupDate(format(pickupDate, 'yyyy-MM-dd'));
      setNewPickupTime(format(pickupDate, 'HH:mm'));
      setNewPickupAddress(bookingData.pickupAddress);
      setNewDropoffAddress(bookingData.dropoffAddress);
      setNewServiceType(bookingData.serviceType);
    } catch (error) {
      showToast.error('Failed to load booking details');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const hasChanges = () => {
    if (!booking) return false;
    
    const originalDate = new Date(booking.scheduledDateTime);
    const newDate = new Date(`${newPickupDate}T${newPickupTime}`);
    
    return (
      newDate.getTime() !== originalDate.getTime() ||
      newPickupAddress !== booking.pickupAddress ||
      newDropoffAddress !== booking.dropoffAddress ||
      newServiceType !== booking.serviceType
    );
  };

  const buildChanges = (): ModificationChanges => {
    const changes: ModificationChanges = {};
    
    if (booking) {
      const originalDate = new Date(booking.scheduledDateTime);
      const newDate = new Date(`${newPickupDate}T${newPickupTime}`);
      
      if (newDate.getTime() !== originalDate.getTime()) {
        changes.dateTime = { newPickupTime: newDate };
      }
      
      if (newPickupAddress !== booking.pickupAddress || newDropoffAddress !== booking.dropoffAddress) {
        changes.locations = {};
        if (newPickupAddress !== booking.pickupAddress) {
          changes.locations.newPickupAddress = newPickupAddress;
        }
        if (newDropoffAddress !== booking.dropoffAddress) {
          changes.locations.newDropoffAddress = newDropoffAddress;
        }
      }
      
      if (newServiceType !== booking.serviceType) {
        changes.serviceType = {
          from: booking.serviceType,
          to: newServiceType
        };
      }
    }
    
    return changes;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!hasChanges()) {
      showToast.error('No changes detected');
      return;
    }
    
    setCalculating(true);
    
    try {
      const modificationData = {
        changes: buildChanges(),
        reason
      };
      
      const response = await api.post(`/bookings/${bookingId}/modify`, modificationData);
      const result = response.data.data;
      
      if (result.requiresPayment) {
        // Navigate to payment page for price difference
        navigate(`/bookings/${bookingId}/modify/payment`, {
          state: {
            modificationId: result.modification.id,
            priceDifference: result.priceDifference,
            modificationFee: result.modificationFee,
            newTotal: result.newTotal
          }
        });
      } else {
        // Apply modification directly
        await api.post(`/bookings/modifications/${result.modification.id}/apply`);
        showToast.success('Booking modified successfully');
        navigate('/dashboard');
      }
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Failed to modify booking');
    } finally {
      setCalculating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-card shadow rounded-lg">
            {/* Header Skeleton */}
            <div className="px-6 py-4 border-b border-border">
              <Skeleton className="h-8 w-48 mb-1" />
              <Skeleton className="h-4 w-32" />
            </div>

            <div className="p-6 space-y-6">
              {/* Current Booking Details Skeleton */}
              <div className="bg-muted rounded-lg p-4">
                <Skeleton className="h-5 w-32 mb-3" />
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Skeleton className="h-4 w-4 mr-2" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                  <div className="flex items-center">
                    <Skeleton className="h-4 w-4 mr-2" />
                    <Skeleton className="h-4 w-64" />
                  </div>
                  <div className="flex items-center">
                    <Skeleton className="h-4 w-4 mr-2" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
              </div>

              {/* Date and Time Skeleton */}
              <div>
                <Skeleton className="h-6 w-32 mb-3" />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-10 w-full rounded-md" />
                  </div>
                  <div>
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-10 w-full rounded-md" />
                  </div>
                </div>
              </div>

              {/* Locations Skeleton */}
              <div>
                <Skeleton className="h-6 w-24 mb-3" />
                <div className="space-y-4">
                  <div>
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-10 w-full rounded-md" />
                  </div>
                  <div>
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-10 w-full rounded-md" />
                  </div>
                </div>
              </div>

              {/* Service Type Skeleton */}
              <div>
                <Skeleton className="h-6 w-28 mb-3" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>

              {/* Reason Skeleton */}
              <div>
                <Skeleton className="h-4 w-64 mb-1" />
                <Skeleton className="h-24 w-full rounded-md" />
              </div>

              {/* Notice Skeleton */}
              <Skeleton className="h-16 w-full rounded-md" />

              {/* Actions Skeleton */}
              <div className="flex justify-between">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-32" />
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

  const canModify = booking.confirmation && new Date() < new Date(booking.confirmation.modificationDeadline);

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-card shadow rounded-lg">
          <div className="px-6 py-4 border-b border-border">
            <h1 className="text-2xl font-bold text-foreground">Modify Booking</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Reference: {booking.confirmation?.bookingReference}
            </p>
          </div>

          {!canModify ? (
            <div className="p-6">
              <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4">
                <p className="text-destructive">
                  This booking cannot be modified. The modification deadline has passed.
                </p>
                <p className="mt-2 text-sm text-destructive/80">
                  Modifications are allowed up to 2 hours before pickup time.
                </p>
              </div>
              <Button
                onClick={() => navigate('/dashboard')}
                variant="outline"
                className="mt-4"
              >
                Back to Dashboard
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Current Booking Details */}
              <div className="bg-muted rounded-lg p-4">
                <h3 className="font-medium text-foreground mb-3">Current Booking</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-muted-foreground">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {format(new Date(booking.scheduledDateTime), 'PPpp')}
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <MapPinIcon className="h-4 w-4 mr-2" />
                    {booking.pickupAddress} → {booking.dropoffAddress}
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <TruckIcon className="h-4 w-4 mr-2" />
                    {booking.serviceType.replace('_', ' ')}
                  </div>
                </div>
              </div>

              {/* Date and Time */}
              <div>
                <h3 className="text-lg font-medium text-foreground mb-3">Date & Time</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground">
                      Pickup Date
                    </label>
                    <input
                      type="date"
                      value={newPickupDate}
                      onChange={(e) => setNewPickupDate(e.target.value)}
                      min={format(new Date(), 'yyyy-MM-dd')}
                      className="mt-1 block w-full rounded-md border-border bg-background text-foreground shadow-sm focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground">
                      Pickup Time
                    </label>
                    <input
                      type="time"
                      value={newPickupTime}
                      onChange={(e) => setNewPickupTime(e.target.value)}
                      className="mt-1 block w-full rounded-md border-border bg-background text-foreground shadow-sm focus:ring-primary focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Locations */}
              <div>
                <h3 className="text-lg font-medium text-foreground mb-3">Locations</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground">
                      Pickup Address
                    </label>
                    <input
                      type="text"
                      value={newPickupAddress}
                      onChange={(e) => setNewPickupAddress(e.target.value)}
                      className="mt-1 block w-full rounded-md border-border bg-background text-foreground shadow-sm focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground">
                      Dropoff Address
                    </label>
                    <input
                      type="text"
                      value={newDropoffAddress}
                      onChange={(e) => setNewDropoffAddress(e.target.value)}
                      className="mt-1 block w-full rounded-md border-border bg-background text-foreground shadow-sm focus:ring-primary focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Service Type */}
              <div>
                <h3 className="text-lg font-medium text-foreground mb-3">Service Type</h3>
                <select
                  value={newServiceType}
                  onChange={(e) => setNewServiceType(e.target.value)}
                  className="block w-full rounded-md border-border bg-background text-foreground shadow-sm focus:ring-primary focus:border-primary"
                >
                  <option value="ONE_WAY">One Way</option>
                  <option value="ROUNDTRIP">Round Trip</option>
                  <option value="HOURLY">Hourly</option>
                </select>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-foreground">
                  Reason for Modification (Optional)
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-border bg-background text-foreground shadow-sm focus:ring-primary focus:border-primary"
                  placeholder="Please provide a reason for this modification..."
                />
              </div>

              {/* Notice */}
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-md p-4">
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  <strong>Note:</strong> Modifications may incur additional fees. Major changes 
                  (date/time or service type) include a $10 modification fee.
                </p>
              </div>

              {/* Actions */}
              <div className="flex justify-between">
                <Button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!hasChanges() || calculating}
                >
                  {calculating ? 'Calculating...' : 'Review Changes'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};