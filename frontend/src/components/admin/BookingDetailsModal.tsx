import React, { useState, useEffect } from 'react';
import { X, User, Calendar, MapPin, DollarSign, FileText, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { format } from 'date-fns';
import { api } from '@/services/api';
import { showToast } from '@/components/ui/Toast';
import { MapPreview } from '@/components/maps/MapPreview';
import type { BookingLocation } from '@/types/booking-types';

interface BookingDetailsModalProps {
  booking: any;
  onClose: () => void;
  onUpdate: () => void;
}

export default function BookingDetailsModal({ booking, onClose, onUpdate }: BookingDetailsModalProps) {
  const [bookingDetails, setBookingDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pickupLocation, setPickupLocation] = useState<BookingLocation | null>(null);
  const [dropoffLocation, setDropoffLocation] = useState<BookingLocation | null>(null);
  const [geocoding, setGeocoding] = useState(false);

  useEffect(() => {
    fetchBookingDetails();
  }, [booking.id]);

  const fetchBookingDetails = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await api.get(`/admin/bookings/${booking.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookingDetails(response.data.data);
      
      // Geocode addresses for map display
      geocodeAddresses(response.data.data);
    } catch (error) {
      showToast.error('Failed to load booking details');
    } finally {
      setLoading(false);
    }
  };

  const geocodeAddresses = async (details: any) => {
    if (!details.pickupAddress && !details.dropoffAddress) return;
    
    setGeocoding(true);
    try {
      // Geocode pickup address
      if (details.pickupAddress) {
        try {
          const pickupResponse = await api.post('/locations/geocode', { 
            address: details.pickupAddress 
          });
          if (pickupResponse.data.location) {
            setPickupLocation({
              address: details.pickupAddress,
              lat: pickupResponse.data.location.lat,
              lng: pickupResponse.data.location.lng,
              placeId: pickupResponse.data.location.placeId
            });
          }
        } catch (error) {
          console.error('Failed to geocode pickup address:', error);
        }
      }

      // Geocode dropoff address
      if (details.dropoffAddress) {
        try {
          const dropoffResponse = await api.post('/locations/geocode', { 
            address: details.dropoffAddress 
          });
          if (dropoffResponse.data.location) {
            setDropoffLocation({
              address: details.dropoffAddress,
              lat: dropoffResponse.data.location.lat,
              lng: dropoffResponse.data.location.lng,
              placeId: dropoffResponse.data.location.placeId
            });
          }
        } catch (error) {
          console.error('Failed to geocode dropoff address:', error);
        }
      }
    } finally {
      setGeocoding(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;

    try {
      const token = localStorage.getItem('adminToken');
      await api.post(`/admin/bookings/${booking.id}/cancel`, {
        reason: 'Admin cancellation',
        refundAmount: bookingDetails.totalAmount,
        sendNotification: true
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      showToast.success('Booking cancelled successfully');
      onUpdate();
      onClose();
    } catch (error) {
      showToast.error('Failed to cancel booking');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading || !bookingDetails) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-card dark:bg-zinc-900 rounded-lg p-6 border border-border">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-card dark:bg-zinc-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-border">
        <div className="sticky top-0 bg-card dark:bg-zinc-900 border-b border-border px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">
            Booking Details - {bookingDetails.confirmation?.bookingReference || bookingDetails.id.slice(0, 8)}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status and Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                bookingDetails.status === 'CONFIRMED' ? 'bg-primary/10 text-primary' :
                bookingDetails.status === 'PENDING' ? 'bg-muted text-muted-foreground' :
                bookingDetails.status === 'CANCELLED' ? 'bg-destructive/10 text-destructive' :
                'bg-muted text-muted-foreground'
              }`}>
                {bookingDetails.status}
              </span>
              <span className="text-sm text-muted-foreground">
                Created {format(new Date(bookingDetails.createdAt), 'MMM d, yyyy h:mm a')}
              </span>
            </div>
            <div className="space-x-2">
              {bookingDetails.status !== 'CANCELLED' && bookingDetails.status !== 'COMPLETED' && (
                <>
                  <Button variant="outline" size="sm">
                    Modify
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleCancel}>
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Customer Information */}
          <div className="bg-muted/50 dark:bg-zinc-800/50 rounded-lg p-4 border border-border">
            <h3 className="font-medium mb-3 flex items-center text-foreground">
              <User className="h-5 w-5 mr-2 text-muted-foreground" />
              Customer Information
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Name:</span>
                <span className="ml-2 font-medium text-foreground">
                  {bookingDetails.user.firstName} {bookingDetails.user.lastName}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Email:</span>
                <span className="ml-2 font-medium text-foreground">{bookingDetails.user.email}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Phone:</span>
                <span className="ml-2 font-medium text-foreground">{bookingDetails.user.phone || 'N/A'}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Customer ID:</span>
                <span className="ml-2 font-medium text-foreground">{bookingDetails.user.id}</span>
              </div>
            </div>
          </div>

          {/* Trip Details */}
          <div className="bg-muted/50 dark:bg-zinc-800/50 rounded-lg p-4 border border-border">
            <h3 className="font-medium mb-3 flex items-center text-foreground">
              <MapPin className="h-5 w-5 mr-2 text-muted-foreground" />
              Trip Details
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Service Type:</span>
                  <span className="ml-2 font-medium text-foreground">{bookingDetails.serviceType.replace('_', ' ')}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Pickup Time:</span>
                  <span className="ml-2 font-medium text-foreground">
                    {format(new Date(bookingDetails.scheduledDateTime), 'MMM d, yyyy h:mm a')}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Pickup Location:</span>
                  <p className="mt-1 font-medium text-foreground">{bookingDetails.pickupAddress}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Dropoff Location:</span>
                  <p className="mt-1 font-medium text-foreground">{bookingDetails.dropoffAddress}</p>
                </div>
                {bookingDetails.notes && (
                  <div>
                    <span className="text-muted-foreground">Notes:</span>
                    <p className="mt-1 text-foreground">{bookingDetails.notes}</p>
                  </div>
                )}
              </div>
              
              {/* Map Preview */}
              <div className="relative">
                {geocoding ? (
                  <div className="flex items-center justify-center h-[300px] bg-muted/20 dark:bg-zinc-900/50 rounded-lg">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                      <p className="text-sm text-muted-foreground">Loading map...</p>
                    </div>
                  </div>
                ) : (pickupLocation || dropoffLocation) ? (
                  <MapPreview
                    pickup={pickupLocation || undefined}
                    dropoff={dropoffLocation || undefined}
                    height="300px"
                    className="w-full"
                  />
                ) : (
                  <div className="flex items-center justify-center h-[300px] bg-muted/20 dark:bg-zinc-900/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Map unavailable</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="bg-muted/50 dark:bg-zinc-800/50 rounded-lg p-4 border border-border">
            <h3 className="font-medium mb-3 flex items-center text-foreground">
              <DollarSign className="h-5 w-5 mr-2 text-muted-foreground" />
              Payment Information
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Amount:</span>
                <span className="font-medium text-foreground">{formatCurrency(bookingDetails.totalAmount)}</span>
              </div>
              {bookingDetails.payment && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payment Status:</span>
                    <span className={`font-medium ${
                      bookingDetails.payment.status === 'COMPLETED' ? 'text-green-600 dark:text-green-400' :
                      bookingDetails.payment.status === 'PENDING' ? 'text-yellow-600 dark:text-yellow-400' :
                      'text-red-600 dark:text-red-400'
                    }`}>
                      {bookingDetails.payment.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payment ID:</span>
                    <span className="font-mono text-xs text-foreground">{bookingDetails.payment.id}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Enhancements */}
          {bookingDetails.enhancements && (
            <div className="bg-muted/50 dark:bg-zinc-800/50 rounded-lg p-4 border border-border">
              <h3 className="font-medium mb-3 text-foreground">Enhancements</h3>
              <div className="space-y-2 text-sm">
                {bookingDetails.enhancements.tripProtection && (
                  <div className="flex justify-between">
                    <span className="text-foreground">Trip Protection</span>
                    <span className="text-green-600 dark:text-green-400">✓</span>
                  </div>
                )}
                {bookingDetails.enhancements.meetAndGreet && (
                  <div className="flex justify-between">
                    <span className="text-foreground">Meet & Greet Service</span>
                    <span className="text-green-600 dark:text-green-400">✓</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Activity History */}
          <div className="bg-muted/50 dark:bg-zinc-800/50 rounded-lg p-4 border border-border">
            <h3 className="font-medium mb-3 flex items-center text-foreground">
              <Clock className="h-5 w-5 mr-2 text-muted-foreground" />
              Activity History
            </h3>
            <div className="space-y-2 text-sm">
              {bookingDetails.modifications?.map((mod: any, index: number) => (
                <div key={index} className="flex justify-between py-2 border-b border-border last:border-0">
                  <span className="text-foreground">{mod.modificationType.replace('_', ' ')}</span>
                  <span className="text-muted-foreground">
                    {format(new Date(mod.createdAt), 'MMM d, h:mm a')}
                  </span>
                </div>
              ))}
              {bookingDetails.notifications?.map((notif: any, index: number) => (
                <div key={index} className="flex justify-between py-2 border-b border-border last:border-0">
                  <span className="text-foreground">{notif.type.replace('_', ' ')}</span>
                  <span className="text-muted-foreground">
                    {format(new Date(notif.createdAt), 'MMM d, h:mm a')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}