import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Mail, 
  MessageSquare,
  User,
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/badge';
import { adminApi } from '@/services/adminApi';
import { showToast } from '@/components/ui/Toast';
import { format } from 'date-fns';
import CustomerDetailsModal from '@/components/admin/CustomerDetailsModal';

interface Customer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  emailVerified: boolean;
  createdAt: string;
  _count: {
    bookings: number;
    paymentMethods: number;
  };
  totalRevenue: number;
  lastBookingDate?: string;
  notificationPreferences?: {
    emailEnabled: boolean;
    smsEnabled: boolean;
  };
}

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    emailVerified: '',
    hasBookings: '',
    minBookings: '',
    minRevenue: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    fetchCustomers();
  }, [pagination.page, searchTerm]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (searchTerm) {
        params.append('search', searchTerm);
      }

      // Add filters
      if (filters.emailVerified) {
        params.append('emailVerified', filters.emailVerified);
      }
      if (filters.hasBookings) {
        params.append('hasBookings', filters.hasBookings);
      }
      if (filters.minBookings) {
        params.append('minBookings', filters.minBookings);
      }
      if (filters.minRevenue) {
        params.append('minRevenue', filters.minRevenue);
      }

      const response = await adminApi.get(`/admin/customers?${params}`);
      
      setCustomers(response.data.data || []);
      setPagination(response.data.pagination || {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
      });
    } catch (error) {
      showToast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await adminApi.get('/admin/customers/export', {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `customers-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      showToast.error('Failed to export customers');
    }
  };

  const handleApplyFilters = () => {
    setPagination({ ...pagination, page: 1 });
    fetchCustomers();
  };

  const handleResetFilters = () => {
    setFilters({
      emailVerified: '',
      hasBookings: '',
      minBookings: '',
      minRevenue: ''
    });
    setPagination({ ...pagination, page: 1 });
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
          <h1 className="text-2xl font-semibold text-foreground">Customer Management</h1>
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
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 bg-muted/50 dark:bg-zinc-800/50 rounded-lg p-4 border border-border">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Email Verified
                </label>
                <select
                  value={filters.emailVerified}
                  onChange={(e) => setFilters({ ...filters, emailVerified: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground"
                >
                  <option value="">All</option>
                  <option value="true">Verified</option>
                  <option value="false">Not Verified</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Has Bookings
                </label>
                <select
                  value={filters.hasBookings}
                  onChange={(e) => setFilters({ ...filters, hasBookings: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground"
                >
                  <option value="">All</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Min Bookings
                </label>
                <Input
                  type="number"
                  placeholder="0"
                  value={filters.minBookings}
                  onChange={(e) => setFilters({ ...filters, minBookings: e.target.value })}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Min Revenue
                </label>
                <Input
                  type="number"
                  placeholder="0"
                  value={filters.minRevenue}
                  onChange={(e) => setFilters({ ...filters, minRevenue: e.target.value })}
                />
              </div>
            </div>
            
            <div className="mt-4 flex justify-end space-x-2">
              <Button variant="outline" onClick={handleResetFilters}>
                Reset
              </Button>
              <Button onClick={handleApplyFilters}>
                Apply Filters
              </Button>
            </div>
          </div>
        )}

        {/* Customers Table */}
        <div className="mt-6 bg-card dark:bg-zinc-900 shadow-sm overflow-hidden sm:rounded-md border border-border">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : customers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64">
              <User className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No customers found</p>
              <p className="text-sm text-muted-foreground mt-2">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/50 dark:bg-zinc-800/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Bookings
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Revenue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {customers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-muted/50 dark:hover:bg-zinc-800/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-foreground">
                              {customer.firstName} {customer.lastName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              ID: {customer.id.slice(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-foreground">{customer.email}</div>
                        <div className="text-sm text-muted-foreground">{customer.phone || 'No phone'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {customer.emailVerified ? (
                            <Badge className="bg-green-500/10 text-green-600 dark:text-green-400">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          ) : (
                            <Badge className="bg-muted text-muted-foreground">
                              <XCircle className="h-3 w-3 mr-1" />
                              Unverified
                            </Badge>
                          )}
                          {customer.notificationPreferences?.smsEnabled && (
                            <Badge variant="outline">SMS</Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-foreground">{customer._count.bookings}</div>
                        {customer.lastBookingDate && (
                          <div className="text-xs text-muted-foreground">
                            Last: {format(new Date(customer.lastBookingDate), 'MMM d')}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                        {formatCurrency(customer.totalRevenue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {format(new Date(customer.createdAt), 'MMM d, yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedCustomer(customer.id);
                            setShowDetailsModal(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} customers
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

        {/* Customer Details Modal */}
        {showDetailsModal && selectedCustomer && (
          <CustomerDetailsModal
            customerId={selectedCustomer}
            onClose={() => {
              setShowDetailsModal(false);
              setSelectedCustomer(null);
            }}
            onUpdate={fetchCustomers}
          />
        )}
      </div>
    </div>
  );
}