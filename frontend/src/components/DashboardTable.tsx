import React from 'react';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  CalendarIcon,
  PencilIcon,
  EyeIcon,
  XCircleIcon,
  MapPinIcon,
  EllipsisVerticalIcon,
  CheckCircleIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { generateICSFile, downloadICSFile, createBookingCalendarEvent } from '@/utils/calendar';
import { api } from '@/services/api';

interface DashboardTableProps {
  data: any[];
  type: 'upcoming' | 'history';
  onViewDetails: (booking: any) => void;
  onViewLocation: (address: string, title: string) => void;
  onViewRoute: (pickup: string, dropoff: string) => void;
  onModifyBooking: (bookingId: string) => void;
  onCancelBooking: (bookingId: string) => void;
  onRebookTrip: (bookingId: string) => void;
  onReview: (bookingId: string) => void;
}

export const DashboardTable: React.FC<DashboardTableProps> = ({
  data,
  type,
  onViewDetails,
  onViewLocation,
  onViewRoute,
  onModifyBooking,
  onCancelBooking,
  onRebookTrip,
  onReview
}) => {
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

  const handleDownloadCalendar = (booking: any) => {
    const event = createBookingCalendarEvent(booking);
    const icsContent = generateICSFile(event);
    const filename = `stable-ride-booking-${booking.confirmation?.bookingReference || booking.id}.ics`;
    downloadICSFile(icsContent, filename);
  };

  const handleDownloadReceipt = async (booking: any) => {
    try {
      // Generate the receipt on the server
      const response = await api.post(`/receipts/bookings/${booking.id}/generate`);
      
      // Download the receipt
      const link = document.createElement('a');
      link.href = response.data.data.url;
      link.download = response.data.data.filename;
      link.click();
    } catch (error) {
      console.error('Error downloading receipt:', error);
    }
  };

  const renderActions = (booking: any) => {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="p-2 hover:bg-accent rounded-md">
            <EllipsisVerticalIcon className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onViewDetails(booking)}>
            <EyeIcon className="mr-2 h-4 w-4" />
            View Details
          </DropdownMenuItem>
          
          {type === 'upcoming' && (
            <>
              <DropdownMenuItem onClick={() => onViewLocation(booking.pickupAddress, 'Pickup Location')}>
                <MapPinIcon className="mr-2 h-4 w-4" />
                View Location
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => handleDownloadCalendar(booking)}>
                <ArrowDownTrayIcon className="mr-2 h-4 w-4" />
                Download Calendar
              </DropdownMenuItem>
            </>
          )}

          {booking.confirmation && (
            <DropdownMenuItem onClick={() => handleDownloadReceipt(booking)}>
              <ArrowDownTrayIcon className="mr-2 h-4 w-4" />
              Download Receipt
            </DropdownMenuItem>
          )}
          
          {type === 'history' && booking.pickupAddress && booking.dropoffAddress && (
            <DropdownMenuItem onClick={() => onViewRoute(booking.pickupAddress, booking.dropoffAddress)}>
              <MapPinIcon className="mr-2 h-4 w-4" />
              View Route
            </DropdownMenuItem>
          )}
          
          {booking.canModify && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onModifyBooking(booking.id)}>
                <PencilIcon className="mr-2 h-4 w-4" />
                Modify Booking
              </DropdownMenuItem>
            </>
          )}
          
          {booking.canCancel && (
            <DropdownMenuItem 
              onClick={() => onCancelBooking(booking.id)}
              className="text-red-600 focus:text-red-600"
            >
              <XCircleIcon className="mr-2 h-4 w-4" />
              Cancel Booking
            </DropdownMenuItem>
          )}
          
          {booking.canRebook && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onRebookTrip(booking.id)}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                Book Again
              </DropdownMenuItem>
            </>
          )}
          
          {booking.canReview && (
            <DropdownMenuItem 
              onClick={() => onReview(booking.id)}
              className="text-green-600 focus:text-green-600"
            >
              <CheckCircleIcon className="mr-2 h-4 w-4" />
              Write Review
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {type === 'upcoming' ? 'No upcoming bookings' : 'No booking history'}
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Reference</TableHead>
            <TableHead>Customer</TableHead>
            {type === 'upcoming' ? (
              <>
                <TableHead>Service Type</TableHead>
                <TableHead>Scheduled Time</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </>
            ) : (
              <>
                <TableHead>Date</TableHead>
                <TableHead>Service Type</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </>
            )}
            <TableHead className="w-16">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((booking) => (
            <TableRow key={booking.id}>
              <TableCell className="font-medium">
                {booking.bookingReference}
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <div className="font-medium text-foreground">
                    {booking.user?.firstName} {booking.user?.lastName}
                  </div>
                  {booking.user?.email && (
                    <div className="text-sm text-muted-foreground truncate max-w-xs">
                      {booking.user.email}
                    </div>
                  )}
                </div>
              </TableCell>
              {type === 'upcoming' ? (
                <>
                  <TableCell>
                    {booking.serviceType?.replace('_', ' ') || 'N/A'}
                  </TableCell>
                  <TableCell>
                    {booking.scheduledDateTime ? format(new Date(booking.scheduledDateTime), 'PPp') : 'N/A'}
                  </TableCell>
                  <TableCell>
                    ${Number(booking.totalAmount || 0).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(booking.status)}>
                      {booking.status}
                    </Badge>
                  </TableCell>
                </>
              ) : (
                <>
                  <TableCell>
                    {booking.date ? format(new Date(booking.date), 'PPP') : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {booking.serviceType?.replace('_', ' ') || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground max-w-xs truncate" title={booking.route}>
                      {booking.route}
                    </div>
                  </TableCell>
                  <TableCell>
                    ${Number(booking.amount || 0).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(booking.status)}>
                      {booking.status}
                    </Badge>
                  </TableCell>
                </>
              )}
              <TableCell>
                {renderActions(booking)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};