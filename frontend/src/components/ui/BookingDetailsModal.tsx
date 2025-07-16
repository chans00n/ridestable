import React from 'react';
import { 
  MapPinIcon, 
  CalendarIcon, 
  ClockIcon,
  CreditCardIcon,
  UserIcon,
  PhoneIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilIcon,
  ArrowTopRightOnSquareIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface BookingDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
  onModify?: (bookingId: string) => void;
  onCancel?: (bookingId: string) => void;
  onRebook?: (bookingId: string) => void;
  onReview?: (bookingId: string) => void;
  onViewLocation?: (address: string, title: string) => void;
  onViewRoute?: (pickup: string, dropoff: string) => void;
}

export const BookingDetailsModal: React.FC<BookingDetailsModalProps> = ({
  isOpen,
  onClose,
  booking,
  onModify,
  onCancel,
  onRebook,
  onReview,
  onViewLocation,
  onViewRoute
}) => {
  if (!booking) return null;

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'secondary';
      case 'CONFIRMED':
        return 'default';
      case 'IN_PROGRESS':
        return 'default';
      case 'COMPLETED':
        return 'secondary';
      case 'CANCELLED':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const formatDateTime = (dateTime: string) => {
    return format(new Date(dateTime), 'PPP p');
  };

  const getDirectionsUrl = (pickup: string, dropoff: string) => {
    const encodedPickup = encodeURIComponent(pickup);
    const encodedDropoff = encodeURIComponent(dropoff);
    return `https://www.google.com/maps/dir/?api=1&origin=${encodedPickup}&destination=${encodedDropoff}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            <DocumentTextIcon className="h-6 w-6 text-primary" />
            <div>
              <span>Booking Details</span>
              <p className="text-sm text-muted-foreground font-normal">Reference: {booking.bookingReference}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Content */}
        <div className="space-y-6">
          {/* Status and Service Type */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Badge variant={getStatusVariant(booking.status)}>
                {booking.status}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {booking.serviceType?.replace('_', ' ') || 'N/A'}
              </span>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">
                ${Number(booking.totalAmount || booking.amount || 0).toFixed(2)}
              </p>
              <p className="text-sm text-muted-foreground">Total Amount</p>
            </div>
          </div>

          {/* Trip Information */}
          <div className="bg-muted rounded-lg p-4">
            <h3 className="font-semibold mb-3 flex items-center">
              <MapPinIcon className="h-5 w-5 mr-2 text-primary" />
              Trip Information
            </h3>
            <div className="space-y-3">
              {/* Pickup Location */}
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-3 h-3 bg-primary rounded-full mt-1.5"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Pickup Location</p>
                  <p className="text-foreground">{booking.pickupAddress}</p>
                  {onViewLocation && (
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => onViewLocation(booking.pickupAddress, 'Pickup Location')}
                      className="h-auto p-0 text-primary hover:text-primary/80 text-sm mt-1"
                    >
                      View on Map
                    </Button>
                  )}
                </div>
              </div>

              {/* Dropoff Location */}
              {booking.dropoffAddress && booking.dropoffAddress !== booking.pickupAddress && (
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-3 h-3 bg-destructive rounded-full mt-1.5"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">Dropoff Location</p>
                    <p className="text-foreground">{booking.dropoffAddress}</p>
                    {onViewRoute && (
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => onViewRoute(booking.pickupAddress, booking.dropoffAddress)}
                        className="h-auto p-0 text-primary hover:text-primary/80 text-sm mt-1"
                      >
                        View Route
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Get Directions */}
              {booking.dropoffAddress && booking.dropoffAddress !== booking.pickupAddress && (
                <div className="pt-2">
                  <a
                    href={getDirectionsUrl(booking.pickupAddress, booking.dropoffAddress)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-primary hover:text-primary/80 text-sm"
                  >
                    <ArrowTopRightOnSquareIcon className="h-4 w-4 mr-1" />
                    Get Directions
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Schedule Information */}
          <div className="bg-muted rounded-lg p-4">
            <h3 className="font-semibold mb-3 flex items-center">
              <CalendarIcon className="h-5 w-5 mr-2 text-primary" />
              Schedule
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pickup Date & Time</p>
                <p className="text-foreground">{formatDateTime(booking.scheduledDateTime || booking.date)}</p>
              </div>
              {booking.returnDateTime && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Return Date & Time</p>
                  <p className="text-foreground">{formatDateTime(booking.returnDateTime)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Customer Information */}
          <div className="bg-muted rounded-lg p-4">
            <h3 className="font-semibold mb-3 flex items-center">
              <UserIcon className="h-5 w-5 mr-2 text-primary" />
              Customer Information
            </h3>
            <div className="space-y-3">
              {/* Customer Name */}
              {booking.user && (booking.user.firstName || booking.user.lastName) && (
                <div className="flex items-center space-x-2">
                  <UserIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground font-medium">
                    {booking.user.firstName} {booking.user.lastName}
                  </span>
                </div>
              )}
              
              {/* Email */}
              {booking.user?.email && (
                <div className="flex items-center space-x-2">
                  <EnvelopeIcon className="h-4 w-4 text-muted-foreground" />
                  <a 
                    href={`mailto:${booking.user.email}`}
                    className="text-primary hover:text-primary/80 transition-colors"
                  >
                    {booking.user.email}
                  </a>
                </div>
              )}
              
              {/* Phone */}
              {(booking.user?.phone || booking.contactPhone) && (
                <div className="flex items-center space-x-2">
                  <PhoneIcon className="h-4 w-4 text-muted-foreground" />
                  <a 
                    href={`tel:${booking.user?.phone || booking.contactPhone}`}
                    className="text-primary hover:text-primary/80 transition-colors"
                  >
                    {booking.user?.phone || booking.contactPhone}
                  </a>
                </div>
              )}
              
              {/* User ID for reference */}
              {booking.user?.id && (
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-muted-foreground">Customer ID:</span>
                  <span className="text-xs text-foreground font-mono">{booking.user.id}</span>
                </div>
              )}
            </div>
          </div>

          {/* Special Instructions */}
          {booking.notes && (
            <div className="bg-muted rounded-lg p-4">
              <h3 className="font-semibold mb-3 flex items-center">
                <DocumentTextIcon className="h-5 w-5 mr-2 text-primary" />
                Special Instructions
              </h3>
              <p className="text-foreground">{booking.notes}</p>
            </div>
          )}

          {/* Payment Information */}
          <div className="bg-muted rounded-lg p-4">
            <h3 className="font-semibold mb-3 flex items-center">
              <CreditCardIcon className="h-5 w-5 mr-2 text-primary" />
              Payment Information
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Amount:</span>
                <span className="font-semibold text-foreground">
                  ${Number(booking.totalAmount || booking.amount || 0).toFixed(2)}
                </span>
              </div>
              {booking.status === 'CANCELLED' && booking.cancellationReason && (
                <div className="mt-2 p-2 bg-destructive/10 rounded border border-destructive/20">
                  <p className="text-sm font-medium text-destructive">Cancellation Reason:</p>
                  <p className="text-sm text-destructive/80">{booking.cancellationReason}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <div className="flex flex-wrap gap-2 justify-end w-full">
            {/* Modify Button */}
            {booking.canModify && onModify && (
              <Button onClick={() => onModify(booking.id)}>
                <PencilIcon className="h-4 w-4 mr-2" />
                Modify Booking
              </Button>
            )}

            {/* Cancel Button */}
            {booking.canCancel && onCancel && (
              <Button
                variant="destructive"
                onClick={() => onCancel(booking.id)}
              >
                <XCircleIcon className="h-4 w-4 mr-2" />
                Cancel Booking
              </Button>
            )}

            {/* Rebook Button */}
            {booking.canRebook && onRebook && (
              <Button
                variant="default"
                onClick={() => onRebook(booking.id)}
                className="bg-primary hover:bg-primary/90"
              >
                <CalendarIcon className="h-4 w-4 mr-2" />
                Book Again
              </Button>
            )}

            {/* Review Button */}
            {booking.canReview && onReview && (
              <Button
                variant="default"
                onClick={() => onReview(booking.id)}
                className="bg-primary hover:bg-primary/90"
              >
                <CheckCircleIcon className="h-4 w-4 mr-2" />
                Write Review
              </Button>
            )}

            {/* Close Button */}
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};