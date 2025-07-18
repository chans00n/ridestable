import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  Calendar,
  MapPin,
  Clock,
  ChevronRight,
  Plus
} from 'lucide-react';
import { api } from '../services/api';
import { showToast } from '../components/ui/Toast';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { BookingDetailsModal } from '../components/ui/BookingDetailsModal';

interface Booking {
  id: string;
  bookingReference: string;
  serviceType: string;
  status: string;
  scheduledDateTime: string;
  pickupAddress: string;
  dropoffAddress: string;
  totalAmount: number;
  payment?: {
    status: string;
  };
}

export const Bookings: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [pastBookings, setPastBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await api.get('/dashboard', {
        params: {
          upcomingPage: 1,
          historyPage: 1,
          limit: 20
        }
      });
      
      const data = response.data.data;
      setUpcomingBookings(data.upcomingBookings.items);
      setPastBookings(data.bookingHistory.items);
    } catch (error) {
      showToast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-500/10 text-green-600 dark:text-green-400';
      case 'PENDING':
        return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400';
      case 'COMPLETED':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
      case 'CANCELLED':
        return 'bg-red-500/10 text-red-600 dark:text-red-400';
      default:
        return 'bg-gray-500/10 text-gray-600 dark:text-gray-400';
    }
  };

  const formatServiceType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const handleBookingClick = async (booking: Booking) => {
    try {
      // Fetch full booking details
      const response = await api.get(`/bookings/${booking.id}`);
      setSelectedBooking(response.data.data);
      setModalOpen(true);
    } catch (error) {
      showToast.error('Failed to load booking details');
    }
  };

  const BookingCard = ({ booking }: { booking: Booking }) => (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => handleBookingClick(booking)}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <p className="font-semibold text-foreground">
              {formatServiceType(booking.serviceType)}
            </p>
            <p className="text-sm text-muted-foreground">
              {booking.bookingReference}
            </p>
          </div>
          <Badge className={getStatusColor(booking.status)}>
            {booking.status}
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>
              {booking.scheduledDateTime && !isNaN(new Date(booking.scheduledDateTime).getTime())
                ? format(new Date(booking.scheduledDateTime), 'MMM d, yyyy')
                : 'Date not available'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>
              {booking.scheduledDateTime && !isNaN(new Date(booking.scheduledDateTime).getTime())
                ? format(new Date(booking.scheduledDateTime), 'h:mm a')
                : 'Time not available'}
            </span>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <p className="truncate">{booking.pickupAddress}</p>
              <p className="text-muted-foreground">to</p>
              <p className="truncate">{booking.dropoffAddress}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center mt-4 pt-4 border-t">
          <p className="font-semibold">
            ${typeof booking.totalAmount === 'number' 
              ? booking.totalAmount.toFixed(2) 
              : parseFloat(booking.totalAmount || '0').toFixed(2)}
          </p>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-0">
        <div className="px-4 py-6">
          <Skeleton className="h-8 w-32 mb-6" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-6 w-40 mb-2" />
                  <Skeleton className="h-4 w-32 mb-4" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <div className="px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-foreground">Your Trips</h1>
          <Button
            size="sm"
            onClick={() => navigate('/booking')}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Book
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'upcoming' | 'past')}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upcoming" className="space-y-4 mt-0">
            {upcomingBookings.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No upcoming trips</p>
                  <Button onClick={() => navigate('/booking')}>
                    Book a Ride
                  </Button>
                </CardContent>
              </Card>
            ) : (
              upcomingBookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))
            )}
          </TabsContent>
          
          <TabsContent value="past" className="space-y-4 mt-0">
            {pastBookings.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No past trips</p>
                </CardContent>
              </Card>
            ) : (
              pastBookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Booking Details Modal */}
      <BookingDetailsModal
        booking={selectedBooking}
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedBooking(null);
        }}
        onModify={(bookingId) => {
          setModalOpen(false);
          navigate(`/bookings/${bookingId}/modify`);
        }}
        onCancel={(bookingId) => {
          setModalOpen(false);
          navigate(`/bookings/${bookingId}/cancel`);
        }}
      />
    </div>
  );
};