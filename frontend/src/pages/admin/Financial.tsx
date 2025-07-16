import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  CreditCard, 
  RefreshCw,
  Download,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import { adminApi } from '@/services/adminApi';
import { showToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { format } from 'date-fns';
import { PaymentReconciliation } from '@/components/admin/PaymentReconciliation';
import { RefundManagement } from '@/components/admin/RefundManagement';

interface FinancialMetrics {
  revenue: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    lastMonth: number;
    yearToDate: number;
    growth: {
      daily: number;
      weekly: number;
      monthly: number;
    };
  };
  transactions: {
    total: number;
    pending: number;
    completed: number;
    failed: number;
    refunded: number;
  };
  averageMetrics: {
    bookingValue: number;
    dailyRevenue: number;
    weeklyRevenue: number;
    monthlyRevenue: number;
  };
  byServiceType: {
    [key: string]: {
      revenue: number;
      count: number;
      percentage: number;
    };
  };
  refunds: {
    total: number;
    amount: number;
    rate: number;
  };
  projections: {
    endOfMonth: number;
    endOfQuarter: number;
    endOfYear: number;
  };
}

export default function FinancialDashboard() {
  const [metrics, setMetrics] = useState<FinancialMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'reconciliation' | 'refunds'>('overview');

  useEffect(() => {
    fetchFinancialMetrics();
  }, []);

  const fetchFinancialMetrics = async () => {
    try {
      const response = await adminApi.get('/admin/financial/metrics');
      setMetrics(response.data.data);
    } catch (error) {
      showToast.error('Failed to load financial metrics');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchFinancialMetrics();
    setRefreshing(false);
    showToast.success('Financial data refreshed');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatTrend = (value: number) => {
    const isPositive = value >= 0;
    const icon = isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />;
    const color = isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
    
    return (
      <span className={`${color} flex items-center gap-1 text-sm font-medium`}>
        {icon}
        {Math.abs(value).toFixed(1)}%
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

  const pieChartData = metrics ? Object.entries(metrics.byServiceType).map(([name, data]) => ({
    name: name.replace('_', ' '),
    value: data.revenue,
    percentage: data.percentage
  })) : [];

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  const transactionData = metrics ? [
    { name: 'Completed', value: metrics.transactions.completed, color: '#10B981' },
    { name: 'Pending', value: metrics.transactions.pending, color: '#F59E0B' },
    { name: 'Failed', value: metrics.transactions.failed, color: '#EF4444' },
    { name: 'Refunded', value: metrics.transactions.refunded, color: '#8B5CF6' }
  ] : [];

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-semibold text-foreground">Financial Dashboard</h1>
          <div className="flex gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-border">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-4 px-2 text-sm font-medium transition-colors ${
              activeTab === 'overview'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('reconciliation')}
            className={`pb-4 px-2 text-sm font-medium transition-colors ${
              activeTab === 'reconciliation'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Payment Reconciliation
          </button>
          <button
            onClick={() => setActiveTab('refunds')}
            className={`pb-4 px-2 text-sm font-medium transition-colors ${
              activeTab === 'refunds'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Refunds
          </button>
        </div>

        {activeTab === 'overview' && metrics && (
          <>
            {/* Revenue Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <DollarSign className="h-5 w-5 text-primary" />
                  </div>
                  {formatTrend(metrics.revenue.growth.daily)}
                </div>
                <p className="text-sm text-muted-foreground">Today's Revenue</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {formatCurrency(metrics.revenue.today)}
                </p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                  </div>
                  {formatTrend(metrics.revenue.growth.weekly)}
                </div>
                <p className="text-sm text-muted-foreground">This Week</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {formatCurrency(metrics.revenue.thisWeek)}
                </p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  </div>
                  {formatTrend(metrics.revenue.growth.monthly)}
                </div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {formatCurrency(metrics.revenue.thisMonth)}
                </p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <DollarSign className="h-5 w-5 text-purple-500" />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">Year to Date</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {formatCurrency(metrics.revenue.yearToDate)}
                </p>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Revenue by Service Type */}
              <Card className="p-6">
                <h3 className="text-lg font-medium text-foreground mb-4">Revenue by Service Type</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ percentage }) => `${percentage.toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Transaction Status */}
              <Card className="p-6">
                <h3 className="text-lg font-medium text-foreground mb-4">Transaction Status</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={transactionData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="name" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip />
                      <Bar dataKey="value" fill={(entry: any) => entry.color}>
                        {transactionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="p-6">
                <h3 className="text-lg font-medium text-foreground mb-4">Average Metrics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Avg Booking Value</span>
                    <span className="text-sm font-medium">{formatCurrency(metrics.averageMetrics.bookingValue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Daily Revenue</span>
                    <span className="text-sm font-medium">{formatCurrency(metrics.averageMetrics.dailyRevenue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Weekly Revenue</span>
                    <span className="text-sm font-medium">{formatCurrency(metrics.averageMetrics.weeklyRevenue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Monthly Revenue</span>
                    <span className="text-sm font-medium">{formatCurrency(metrics.averageMetrics.monthlyRevenue)}</span>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-medium text-foreground mb-4">Refund Statistics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Refunds</span>
                    <span className="text-sm font-medium">{metrics.refunds.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Refund Amount</span>
                    <span className="text-sm font-medium">{formatCurrency(metrics.refunds.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Refund Rate</span>
                    <span className="text-sm font-medium">{metrics.refunds.rate.toFixed(1)}%</span>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-medium text-foreground mb-4">Revenue Projections</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">End of Month</span>
                    <span className="text-sm font-medium">{formatCurrency(metrics.projections.endOfMonth)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">End of Quarter</span>
                    <span className="text-sm font-medium">{formatCurrency(metrics.projections.endOfQuarter)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">End of Year</span>
                    <span className="text-sm font-medium">{formatCurrency(metrics.projections.endOfYear)}</span>
                  </div>
                </div>
              </Card>
            </div>
          </>
        )}

        {activeTab === 'reconciliation' && <PaymentReconciliation />}

        {activeTab === 'refunds' && <RefundManagement />}
      </div>
    </div>
  );
}