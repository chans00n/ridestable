import React, { useState, useEffect } from 'react';
import { Car, Users, DollarSign, TrendingUp, RefreshCw } from 'lucide-react';
import { adminApi } from '@/services/adminApi';
import { showToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { DashboardMap } from '@/components/admin/DashboardMap';

interface DashboardMetrics {
  totalBookings: number;
  activeBookings: number;
  totalRevenue: number;
  newCustomers: number;
  bookingsTrend: number;
  revenueTrend: number;
  customersTrend: number;
  activeTrend: number;
}

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [bookingsForMap, setBookingsForMap] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mapDays, setMapDays] = useState(7);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    fetchMapBookings();
  }, [mapDays]);

  const fetchDashboardData = async () => {
    try {
      const response = await adminApi.get('/admin/dashboard/metrics');
      setMetrics(response.data.data);
    } catch (error) {
      showToast.error('Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  const fetchMapBookings = async () => {
    try {
      const response = await adminApi.get(`/admin/dashboard/map-bookings?days=${mapDays}`);
      setBookingsForMap(response.data.data || []);
    } catch (error) {
      showToast.error('Failed to load map data');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await adminApi.post('/admin/dashboard/refresh');
      await fetchDashboardData();
      await fetchMapBookings();
      showToast.success('Dashboard refreshed successfully');
    } catch (error) {
      showToast.error('Failed to refresh dashboard');
    } finally {
      setRefreshing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatTrend = (trend: number) => {
    const isPositive = trend >= 0;
    const icon = isPositive ? '↑' : '↓';
    const color = isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
    return (
      <span className={`${color} text-sm font-medium`}>
        {icon} {Math.abs(trend).toFixed(1)}%
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-semibold text-foreground">Dashboard Overview</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        
        {/* Metric Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative rounded-lg border border-border/50 p-6 overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-zinc-900/50 dark:via-zinc-900/90 dark:to-black">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent"></div>
            <div className="relative">
              {metrics?.bookingsTrend !== undefined && (
                <div className="absolute -top-2 right-0">
                  <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                    metrics.bookingsTrend >= 0 
                      ? 'bg-green-500/10 text-green-600 dark:text-green-400' 
                      : 'bg-red-500/10 text-red-600 dark:text-red-400'
                  }`}>
                    <TrendingUp className={`h-3 w-3 mr-1 ${metrics.bookingsTrend < 0 ? 'rotate-180' : ''}`} />
                    {metrics.bookingsTrend >= 0 ? '+' : ''}{metrics.bookingsTrend.toFixed(0)}%
                  </div>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Total Bookings</p>
                <p className="text-4xl font-bold text-foreground mt-1">
                  {metrics?.totalBookings || 0}
                </p>
                <div className="flex items-center mt-3 text-sm text-muted-foreground">
                  <Car className="h-4 w-4 mr-1.5" />
                  <span>All-time bookings count</span>
                </div>
              </div>
            </div>
          </div>

          <div className="relative rounded-lg border border-border/50 p-6 overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-zinc-900/50 dark:via-zinc-900/90 dark:to-black">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent"></div>
            <div className="relative">
              {metrics?.activeTrend !== undefined && (
                <div className="absolute -top-2 right-0">
                  <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                    metrics.activeTrend >= 0 
                      ? 'bg-green-500/10 text-green-600 dark:text-green-400' 
                      : 'bg-red-500/10 text-red-600 dark:text-red-400'
                  }`}>
                    <TrendingUp className={`h-3 w-3 mr-1 ${metrics.activeTrend < 0 ? 'rotate-180' : ''}`} />
                    {metrics.activeTrend >= 0 ? '+' : ''}{metrics.activeTrend.toFixed(0)}%
                  </div>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Active Bookings</p>
                <p className="text-4xl font-bold text-foreground mt-1">
                  {metrics?.activeBookings || 0}
                </p>
                <div className="flex items-center mt-3 text-sm text-muted-foreground">
                  <TrendingUp className="h-4 w-4 mr-1.5" />
                  <span>Currently in progress</span>
                </div>
              </div>
            </div>
          </div>

          <div className="relative rounded-lg border border-border/50 p-6 overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-zinc-900/50 dark:via-zinc-900/90 dark:to-black">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-transparent"></div>
            <div className="relative">
              {metrics?.revenueTrend !== undefined && (
                <div className="absolute -top-2 right-0">
                  <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                    metrics.revenueTrend >= 0 
                      ? 'bg-green-500/10 text-green-600 dark:text-green-400' 
                      : 'bg-red-500/10 text-red-600 dark:text-red-400'
                  }`}>
                    <TrendingUp className={`h-3 w-3 mr-1 ${metrics.revenueTrend < 0 ? 'rotate-180' : ''}`} />
                    {metrics.revenueTrend >= 0 ? '+' : ''}{metrics.revenueTrend.toFixed(0)}%
                  </div>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-4xl font-bold text-foreground mt-1">
                  {formatCurrency(metrics?.totalRevenue || 0)}
                </p>
                <div className="flex items-center mt-3 text-sm text-muted-foreground">
                  <DollarSign className="h-4 w-4 mr-1.5" />
                  <span>Lifetime earnings</span>
                </div>
              </div>
            </div>
          </div>

          <div className="relative rounded-lg border border-border/50 p-6 overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-zinc-900/50 dark:via-zinc-900/90 dark:to-black">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-transparent"></div>
            <div className="relative">
              {metrics?.customersTrend !== undefined && (
                <div className="absolute -top-2 right-0">
                  <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                    metrics.customersTrend >= 0 
                      ? 'bg-green-500/10 text-green-600 dark:text-green-400' 
                      : 'bg-red-500/10 text-red-600 dark:text-red-400'
                  }`}>
                    <TrendingUp className={`h-3 w-3 mr-1 ${metrics.customersTrend < 0 ? 'rotate-180' : ''}`} />
                    {metrics.customersTrend >= 0 ? '+' : ''}{metrics.customersTrend.toFixed(0)}%
                  </div>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">New Customers</p>
                <p className="text-4xl font-bold text-foreground mt-1">
                  {metrics?.newCustomers || 0}
                </p>
                <div className="flex items-center mt-3 text-sm text-muted-foreground">
                  <Users className="h-4 w-4 mr-1.5" />
                  <span>Joined this month</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trip Map Section */}
        <div className="mt-8">
          <div className="bg-card dark:bg-zinc-900 rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-foreground">Trip Activity Map</h2>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-muted-foreground">Show trips from:</span>
                <select
                  value={mapDays}
                  onChange={(e) => setMapDays(parseInt(e.target.value))}
                  className="px-3 py-1 bg-background border border-border rounded-md text-foreground text-sm"
                >
                  <option value="1">Today</option>
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                </select>
              </div>
            </div>
            
            <DashboardMap
              bookings={bookingsForMap}
              height="600px"
              className="w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}