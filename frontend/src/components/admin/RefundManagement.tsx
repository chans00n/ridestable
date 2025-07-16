import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle,
  Search,
  Filter,
  CreditCard
} from 'lucide-react';
import { adminApi } from '@/services/adminApi';
import { showToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/Input';
import { format } from 'date-fns';

interface RefundDetails {
  id: string;
  bookingId: string;
  paymentId: string;
  amount: number;
  reason: string;
  status: string;
  requestedAt: Date;
  processedAt: Date | null;
  stripeRefundId: string | null;
  customer: {
    name: string;
    email: string;
  };
}

interface RefundModalProps {
  paymentId: string;
  amount: number;
  onClose: () => void;
  onSuccess: () => void;
}

function RefundModal({ paymentId, amount, onClose, onSuccess }: RefundModalProps) {
  const [refundAmount, setRefundAmount] = useState(amount.toString());
  const [reason, setReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);

    try {
      await adminApi.post('/admin/financial/refunds', {
        paymentId,
        amount: parseFloat(refundAmount),
        reason
      });
      showToast.success('Refund processed successfully');
      onSuccess();
      onClose();
    } catch (error) {
      showToast.error('Failed to process refund');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-medium text-foreground mb-4">Process Refund</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Refund Amount
            </label>
            <Input
              type="number"
              step="0.01"
              max={amount}
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Maximum: ${amount.toFixed(2)}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Reason for Refund
            </label>
            <textarea
              className="w-full px-3 py-2 border border-input bg-background rounded-md text-foreground"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for refund..."
              required
            />
          </div>
          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={processing}
            >
              {processing ? 'Processing...' : 'Process Refund'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function RefundManagement() {
  const [refunds, setRefunds] = useState<RefundDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedRefund, setSelectedRefund] = useState<RefundDetails | null>(null);
  const [showRefundModal, setShowRefundModal] = useState(false);

  useEffect(() => {
    fetchRefunds();
  }, [dateRange]);

  const fetchRefunds = async () => {
    try {
      const params = new URLSearchParams();
      if (dateRange.start && dateRange.end) {
        params.append('startDate', dateRange.start);
        params.append('endDate', dateRange.end);
      }

      const response = await adminApi.get(`/admin/financial/refunds?${params.toString()}`);
      setRefunds(response.data.data);
    } catch (error) {
      showToast.error('Failed to load refunds');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const filteredRefunds = refunds.filter(refund => 
    refund.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    refund.customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    refund.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by customer name, email, or refund ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="w-40"
            />
            <Input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="w-40"
            />
          </div>
        </div>
      </Card>

      {/* Refunds Table */}
      <Card className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Refund ID</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Customer</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Amount</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Reason</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Requested</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Processed</th>
              </tr>
            </thead>
            <tbody>
              {filteredRefunds.length > 0 ? (
                filteredRefunds.map((refund) => (
                  <tr 
                    key={refund.id} 
                    className="border-b border-border hover:bg-muted/50 cursor-pointer"
                    onClick={() => setSelectedRefund(refund)}
                  >
                    <td className="py-3 px-4">
                      <span className="text-sm font-mono">{refund.id.slice(0, 8)}...</span>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-sm font-medium text-foreground">{refund.customer.name}</p>
                        <p className="text-xs text-muted-foreground">{refund.customer.email}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm font-medium">{formatCurrency(refund.amount)}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm">{refund.reason || 'No reason provided'}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        refund.status === 'REFUNDED' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                      }`}>
                        {refund.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm">{format(new Date(refund.requestedAt), 'MMM d, yyyy')}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm">
                        {refund.processedAt 
                          ? format(new Date(refund.processedAt), 'MMM d, yyyy')
                          : '-'
                        }
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground">
                    No refunds found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Selected Refund Details */}
      {selectedRefund && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedRefund(null)}>
          <Card className="max-w-2xl w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-medium text-foreground">Refund Details</h3>
              <button
                onClick={() => setSelectedRefund(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Refund ID</p>
                <p className="text-sm font-medium">{selectedRefund.id}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Booking ID</p>
                <p className="text-sm font-medium">{selectedRefund.bookingId}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Payment ID</p>
                <p className="text-sm font-medium">{selectedRefund.paymentId}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Stripe Refund ID</p>
                <p className="text-sm font-medium">{selectedRefund.stripeRefundId || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Customer</p>
                <p className="text-sm font-medium">{selectedRefund.customer.name}</p>
                <p className="text-xs text-muted-foreground">{selectedRefund.customer.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Amount</p>
                <p className="text-sm font-medium">{formatCurrency(selectedRefund.amount)}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">Reason</p>
                <p className="text-sm">{selectedRefund.reason || 'No reason provided'}</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button variant="outline" onClick={() => setSelectedRefund(null)}>
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Refund Modal */}
      {showRefundModal && selectedRefund && (
        <RefundModal
          paymentId={selectedRefund.paymentId}
          amount={selectedRefund.amount}
          onClose={() => setShowRefundModal(false)}
          onSuccess={() => {
            fetchRefunds();
            setShowRefundModal(false);
          }}
        />
      )}
    </div>
  );
}