import React, { useState, useEffect } from 'react';
import { 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Download,
  ExternalLink
} from 'lucide-react';
import { adminApi } from '@/services/adminApi';
import { showToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';

interface PaymentReconciliation {
  stripeBalance: {
    available: number;
    pending: number;
    currency: string;
  };
  platformRecords: {
    total: number;
    reconciled: number;
    unreconciled: number;
    discrepancies: Array<{
      paymentId: string;
      stripeAmount: number;
      platformAmount: number;
      difference: number;
      date: Date;
    }>;
  };
  lastReconciliation: Date | null;
  nextScheduled: Date;
}

export function PaymentReconciliation() {
  const [data, setData] = useState<PaymentReconciliation | null>(null);
  const [loading, setLoading] = useState(true);
  const [reconciling, setReconciling] = useState(false);

  useEffect(() => {
    fetchReconciliationData();
  }, []);

  const fetchReconciliationData = async () => {
    try {
      const response = await adminApi.get('/admin/financial/reconciliation');
      setData(response.data.data);
    } catch (error) {
      showToast.error('Failed to load reconciliation data');
    } finally {
      setLoading(false);
    }
  };

  const handleReconcile = async (transactionId: string) => {
    setReconciling(true);
    try {
      await adminApi.post(`/admin/financial/transactions/${transactionId}/reconcile`);
      showToast.success('Transaction reconciled successfully');
      await fetchReconciliationData();
    } catch (error) {
      showToast.error('Failed to reconcile transaction');
    } finally {
      setReconciling(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!data) return null;

  const reconciledPercentage = data.platformRecords.total > 0
    ? (data.platformRecords.reconciled / data.platformRecords.total) * 100
    : 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Stripe Available</p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {formatCurrency(data.stripeBalance.available)}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Pending: {formatCurrency(data.stripeBalance.pending)}
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <RefreshCw className="h-5 w-5 text-blue-500" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              {reconciledPercentage.toFixed(0)}%
            </span>
          </div>
          <p className="text-sm text-muted-foreground">Reconciliation Status</p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {data.platformRecords.reconciled} / {data.platformRecords.total}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Unreconciled: {data.platformRecords.unreconciled}
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-500" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Discrepancies</p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {data.platformRecords.discrepancies.length}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Last check: {data.lastReconciliation 
              ? format(new Date(data.lastReconciliation), 'MMM d, h:mm a')
              : 'Never'
            }
          </p>
        </Card>
      </div>

      {/* Discrepancies Table */}
      {data.platformRecords.discrepancies.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-foreground">Payment Discrepancies</h3>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Payment ID</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Stripe Amount</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Platform Amount</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Difference</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.platformRecords.discrepancies.map((discrepancy) => (
                  <tr key={discrepancy.paymentId} className="border-b border-border hover:bg-muted/50">
                    <td className="py-3 px-4">
                      <span className="text-sm font-mono">{discrepancy.paymentId.slice(0, 8)}...</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm">{format(new Date(discrepancy.date), 'MMM d, yyyy')}</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-sm">{formatCurrency(discrepancy.stripeAmount)}</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-sm">{formatCurrency(discrepancy.platformAmount)}</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={`text-sm font-medium ${
                        discrepancy.difference > 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {formatCurrency(Math.abs(discrepancy.difference))}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleReconcile(discrepancy.paymentId)}
                        disabled={reconciling}
                      >
                        Reconcile
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Next Reconciliation */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-foreground">Automated Reconciliation</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Next scheduled: {format(new Date(data.nextScheduled), 'MMM d, yyyy h:mm a')}
            </p>
          </div>
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Run Now
          </Button>
        </div>
      </Card>
    </div>
  );
}