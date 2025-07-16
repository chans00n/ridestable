import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CalendarIcon, 
  ClockIcon, 
  MapPinIcon, 
  CreditCardIcon,
  ChartBarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon as PendingIcon,
  PencilIcon,
  EyeIcon,
  EllipsisVerticalIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { showToast } from '../components/ui/Toast';
import { Pagination } from '../components/ui/Pagination';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardTable } from '../components/DashboardTable';
import { Button } from '@/components/ui/button';
import { LocationModal } from '../components/ui/LocationModal';
import { RouteModal } from '../components/ui/RouteModal';
import { BookingDetailsModal } from '../components/ui/BookingDetailsModal';
import { Skeleton } from '@/components/ui/skeleton';

interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface DashboardData {
  upcomingBookings: PaginatedData<any>;
  bookingHistory: PaginatedData<any>;
  savedLocations: PaginatedData<any>;
  paymentMethods: any[];
  preferences: any;
  stats: {
    totalBookings: number;
    completedTrips: number;
    totalSpent: number;
    favoriteServiceType: string | null;
  };
}

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [upcomingPage, setUpcomingPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const limit = 10;
  const [locationModal, setLocationModal] = useState<{ isOpen: boolean; address: string; title?: string }>({ isOpen: false, address: '' });
  const [routeModal, setRouteModal] = useState<{ isOpen: boolean; pickupAddress: string; dropoffAddress: string }>({ isOpen: false, pickupAddress: '', dropoffAddress: '' });
  const [bookingDetailsModal, setBookingDetailsModal] = useState<{ isOpen: boolean; booking: any }>({ isOpen: false, booking: null });

  useEffect(() => {
    fetchDashboardData();
  }, [upcomingPage, historyPage]);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/dashboard', {
        params: {
          upcomingPage,
          historyPage,
          limit
        }
      });
      setDashboardData(response.data.data);
    } catch (error) {
      showToast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleModifyBooking = (bookingId: string) => {
    navigate(`/bookings/${bookingId}/modify`);
  };

  const handleCancelBooking = (bookingId: string) => {
    navigate(`/bookings/${bookingId}/cancel`);
  };

  const handleRebookTrip = async (bookingId: string) => {
    try {
      const response = await api.post(`/dashboard/bookings/${bookingId}/rebook`);
      // Navigate to booking page with pre-filled data
      navigate('/book/new', { state: response.data.data });
    } catch (error) {
      showToast.error('Failed to rebook trip');
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Skeleton */}
          <div className="mb-8">
            <Skeleton className="h-9 w-64 mb-2" />
            <Skeleton className="h-5 w-48" />
          </div>

          {/* Stats Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Skeleton className="h-10 w-10 rounded" />
                  <div className="ml-4">
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-7 w-16" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Skeleton className="h-10 w-10 rounded" />
                  <div className="ml-4">
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-7 w-16" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Skeleton className="h-10 w-10 rounded" />
                  <div className="ml-4">
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-7 w-20" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Skeleton className="h-10 w-10 rounded" />
                  <div className="ml-4">
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs Skeleton */}
          <Card className="p-6">
            <div className="mb-6">
              <Skeleton className="h-10 w-full max-w-md" />
            </div>
            
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-4">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-10 w-32" />
              </div>
              
              {/* Table Skeleton */}
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
              
              {/* Pagination Skeleton */}
              <div className="pt-6">
                <Skeleton className="h-10 w-full max-w-sm mx-auto" />
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="mt-2 text-muted-foreground">
            Manage your bookings and preferences
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <ChartBarIcon className="h-10 w-10 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm text-muted-foreground">Total Bookings</p>
                  <p className="text-2xl font-semibold">
                    {dashboardData.stats.totalBookings}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CalendarIcon className="h-10 w-10 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm text-muted-foreground">Completed Trips</p>
                  <p className="text-2xl font-semibold">
                    {dashboardData.stats.completedTrips}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CreditCardIcon className="h-10 w-10 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm text-muted-foreground">Total Spent</p>
                  <p className="text-2xl font-semibold">
                    ${dashboardData.stats.totalSpent.toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <MapPinIcon className="h-10 w-10 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm text-muted-foreground">Favorite Service</p>
                  <p className="text-lg font-semibold">
                    {dashboardData.stats.favoriteServiceType?.replace('_', ' ') || 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Card className="p-6">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'upcoming' | 'history')}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="upcoming">Upcoming Bookings</TabsTrigger>
              <TabsTrigger value="history">Booking History</TabsTrigger>
            </TabsList>
            
            <TabsContent value="upcoming" className="space-y-6 mt-6">
              <div className="flex justify-between items-center pb-4">
                <h2 className="text-lg font-semibold text-foreground">Upcoming Bookings</h2>
                <Button onClick={() => navigate('/booking')}>
                  Book New Ride
                </Button>
              </div>
              
              <DashboardTable
                data={dashboardData.upcomingBookings.items}
                type="upcoming"
                onViewDetails={(booking) => setBookingDetailsModal({ isOpen: true, booking })}
                onViewLocation={(address, title) => setLocationModal({ isOpen: true, address, title })}
                onViewRoute={(pickup, dropoff) => setRouteModal({ isOpen: true, pickupAddress: pickup, dropoffAddress: dropoff })}
                onModifyBooking={handleModifyBooking}
                onCancelBooking={handleCancelBooking}
                onRebookTrip={handleRebookTrip}
                onReview={(bookingId) => {
                  // TODO: Implement review functionality
                  console.log('Review functionality not yet implemented');
                }}
              />
              <div className="pt-6">
                <Pagination
                  currentPage={upcomingPage}
                  totalPages={dashboardData.upcomingBookings.totalPages}
                  onPageChange={setUpcomingPage}
                  showInfo={true}
                  totalItems={dashboardData.upcomingBookings.total}
                  itemsPerPage={limit}
                  className=""
                />
              </div>
            </TabsContent>
            
            <TabsContent value="history" className="space-y-6 mt-6">
              <div className="pb-4">
                <h2 className="text-lg font-semibold text-foreground">Booking History</h2>
              </div>
              
              <DashboardTable
                data={dashboardData.bookingHistory.items}
                type="history"
                onViewDetails={(booking) => setBookingDetailsModal({ isOpen: true, booking })}
                onViewLocation={(address, title) => setLocationModal({ isOpen: true, address, title })}
                onViewRoute={(pickup, dropoff) => setRouteModal({ isOpen: true, pickupAddress: pickup, dropoffAddress: dropoff })}
                onModifyBooking={handleModifyBooking}
                onCancelBooking={handleCancelBooking}
                onRebookTrip={handleRebookTrip}
                onReview={(bookingId) => {
                  // TODO: Implement review functionality
                  console.log('Review functionality not yet implemented');
                }}
              />
              <div className="pt-6">
                <Pagination
                  currentPage={historyPage}
                  totalPages={dashboardData.bookingHistory.totalPages}
                  onPageChange={setHistoryPage}
                  showInfo={true}
                  totalItems={dashboardData.bookingHistory.total}
                  itemsPerPage={limit}
                  className=""
                />
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>

      {/* Location Modal */}
      <LocationModal
        isOpen={locationModal.isOpen}
        onClose={() => setLocationModal({ isOpen: false, address: '' })}
        address={locationModal.address}
        title={locationModal.title}
      />

      {/* Route Modal */}
      <RouteModal
        isOpen={routeModal.isOpen}
        onClose={() => setRouteModal({ isOpen: false, pickupAddress: '', dropoffAddress: '' })}
        pickupAddress={routeModal.pickupAddress}
        dropoffAddress={routeModal.dropoffAddress}
      />

      {/* Booking Details Modal */}
      <BookingDetailsModal
        isOpen={bookingDetailsModal.isOpen}
        onClose={() => setBookingDetailsModal({ isOpen: false, booking: null })}
        booking={bookingDetailsModal.booking}
        onModify={handleModifyBooking}
        onCancel={handleCancelBooking}
        onRebook={handleRebookTrip}
        onReview={() => {
          // TODO: Implement review functionality
          console.log('Review functionality not yet implemented');
        }}
        onViewLocation={(address, title) => {
          setBookingDetailsModal({ isOpen: false, booking: null });
          setLocationModal({ isOpen: true, address, title });
        }}
        onViewRoute={(pickup, dropoff) => {
          setBookingDetailsModal({ isOpen: false, booking: null });
          setRouteModal({ isOpen: true, pickupAddress: pickup, dropoffAddress: dropoff });
        }}
      />
    </div>
  );
};