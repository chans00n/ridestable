import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Edit, 
  XCircle, 
  RefreshCw,
  Calendar,
  MapPin,
  User,
  DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/badge';
import { adminApi } from '@/services/adminApi';
import { showToast } from '@/components/ui/Toast';
import BookingDetailsModal from '@/components/admin/BookingDetailsModal';
import BookingFilters from '@/components/admin/BookingFilters';

interface Booking {
  id: string;
  serviceType: string;
  status: string;
  scheduledDateTime: string;
  pickupAddress: string;
  dropoffAddress: string;
  totalAmount: number;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
  };
  payment?: {
    status: string;
  };
  confirmation?: {
    bookingReference: string;
  };
}

export default function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<any>({
    showCancelled: false,
    showCompleted: false,
    showPending: true
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    fetchBookings();
  }, [pagination.page, filters]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...filters
      });

      if (searchTerm) {
        params.append('customerEmail', searchTerm);
      }

      const response = await adminApi.get(`/admin/bookings?${params}`);
      
      setBookings(response.data.data || []);
      setPagination(response.data.pagination || {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
      });
    } catch (error) {
      showToast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await adminApi.get('/admin/bookings/export', {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `bookings-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      showToast.error('Failed to export bookings');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusStyles: Record<string, string> = {
      PENDING: 'bg-muted text-muted-foreground',
      CONFIRMED: 'bg-primary/10 text-primary dark:bg-primary/20',
      IN_PROGRESS: 'bg-primary/10 text-primary dark:bg-primary/20',
      COMPLETED: 'bg-muted text-muted-foreground',
      CANCELLED: 'bg-destructive/10 text-destructive dark:bg-destructive/20'
    };

    return (
      <Badge className={statusStyles[status] || 'bg-muted text-muted-foreground'}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-foreground">Bookings Management</h1>
          <Button onClick={handleExport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="mt-6 flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by email or booking reference..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && fetchBookings()}
                className="pl-10"
              />
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button
            variant="outline"
            onClick={fetchBookings}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {showFilters && (
          <BookingFilters
            filters={filters}
            onFiltersChange={(newFilters) => {
              setFilters(newFilters);
              setPagination({ ...pagination, page: 1 });
            }}
          />
        )}

        {/* Bookings Table */}
        <div className="mt-6 bg-card dark:bg-zinc-900 shadow-sm overflow-hidden sm:rounded-md border border-border">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : bookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64">
              <p className="text-muted-foreground">No bookings found</p>
              <p className="text-sm text-muted-foreground mt-2">Try adjusting your filters or search criteria</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {bookings.map((booking) => (
                <li key={booking.id}>
                  <div className="px-4 py-4 sm:px-6 hover:bg-muted/50 dark:hover:bg-zinc-800">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <p className="text-sm font-medium text-foreground truncate">
                              {booking.confirmation?.bookingReference || booking.id.slice(0, 8)}
                            </p>
                            {getStatusBadge(booking.status)}
                            <Badge variant="outline">{booking.serviceType.replace('_', ' ')}</Badge>
                          </div>
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium text-foreground">
                              {formatCurrency(booking.totalAmount)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-1" />
                            {booking.user.firstName} {booking.user.lastName} ({booking.user.email})
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {format(new Date(booking.scheduledDateTime), 'MMM d, yyyy h:mm a')}
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {booking.pickupAddress.split(',')[0]}
                          </div>
                          <div className="flex items-center">
                            <DollarSign className="h-4 w-4 mr-1" />
                            Payment: {booking.payment?.status || 'N/A'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="ml-4 flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedBooking(booking);
                            setShowDetailsModal(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={booking.status === 'CANCELLED' || booking.status === 'COMPLETED'}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={booking.status === 'CANCELLED'}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} results
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                disabled={pagination.page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                disabled={pagination.page === pagination.totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Booking Details Modal */}
        {showDetailsModal && selectedBooking && (
          <BookingDetailsModal
            booking={selectedBooking}
            onClose={() => {
              setShowDetailsModal(false);
              setSelectedBooking(null);
            }}
            onUpdate={fetchBookings}
          />
        )}
      </div>
    </div>
  );
}