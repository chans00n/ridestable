import React, { useState, useEffect } from 'react';
import { 
  CreditCardIcon,
  PlusIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { api } from '../../services/api';
import { showToast } from '../../components/ui/Toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { format } from 'date-fns';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

interface PaymentMethod {
  id: string;
  cardBrand: string;
  cardLast4: string;
  cardExpMonth: number;
  cardExpYear: number;
  isDefault: boolean;
}

interface Transaction {
  id: string;
  bookingId: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  receiptUrl?: string;
  booking: {
    confirmationId: string;
    pickupAddress: string;
    dropoffAddress: string;
    scheduledDateTime: string;
  };
}

const AddCardForm: React.FC<{ onSuccess: () => void; onCancel: () => void }> = ({ onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    try {
      // Create setup intent
      const { data } = await api.post('/payments/setup-intent');
      const clientSecret = data.data.clientSecret;

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) return;

      // Confirm card setup
      const { error: stripeError, setupIntent } = await stripe.confirmCardSetup(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (stripeError) {
        setError(stripeError.message || 'Failed to add card');
        return;
      }

      if (setupIntent?.payment_method) {
        // Save payment method
        await api.post('/payments/methods/add', {
          paymentMethodId: setupIntent.payment_method
        });
        
        showToast.success('Card added successfully');
        onSuccess();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add card');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Card Information</label>
        <div className="p-3 border rounded-md">
          <CardElement 
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
                invalid: {
                  color: '#9e2146',
                },
              },
            }}
          />
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={!stripe || loading}>
          {loading ? 'Adding...' : 'Add Card'}
        </Button>
      </div>
    </form>
  );
};

export const ProfilePaymentMethods: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showAddCard, setShowAddCard] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  useEffect(() => {
    fetchPaymentMethods();
    fetchTransactions();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      const response = await api.get('/payments/methods/list');
      setPaymentMethods(response.data.data || []);
    } catch (error) {
      showToast.error('Failed to load payment methods');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    setLoadingTransactions(true);
    try {
      const response = await api.get('/payments/transactions');
      setTransactions(response.data.data || []);
    } catch (error) {
      showToast.error('Failed to load transaction history');
    } finally {
      setLoadingTransactions(false);
    }
  };

  const handleSetDefault = async (paymentMethodId: string) => {
    try {
      await api.patch(`/payments/methods/${paymentMethodId}/default`);
      showToast.success('Default payment method updated');
      await fetchPaymentMethods();
    } catch (error) {
      showToast.error('Failed to update default payment method');
    }
  };

  const handleDelete = async (paymentMethodId: string) => {
    try {
      await api.delete(`/payments/methods/${paymentMethodId}`);
      showToast.success('Payment method removed');
      await fetchPaymentMethods();
      setDeletingId(null);
    } catch (error) {
      showToast.error('Failed to remove payment method');
    }
  };

  const handleDownloadReceipt = async (paymentId: string) => {
    try {
      const response = await api.get(`/payments/${paymentId}/receipt/download`, {
        responseType: 'blob'
      });
      
      // Create a blob URL and trigger download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `receipt-${paymentId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      showToast.success('Receipt downloaded');
    } catch (error) {
      showToast.error('Failed to download receipt');
    }
  };

  const getCardIcon = (brand: string) => {
    const brandLower = brand.toLowerCase();
    if (brandLower.includes('visa')) return '💳';
    if (brandLower.includes('mastercard')) return '💳';
    if (brandLower.includes('amex')) return '💳';
    return '💳';
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-7 w-48 mb-6" />
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Payment Methods</h2>
        <Button onClick={() => setShowAddCard(true)} size="sm">
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Card
        </Button>
      </div>

      {/* Payment Methods */}
      <div className="space-y-4">
        {paymentMethods.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CreditCardIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No payment methods added yet</p>
              <Button onClick={() => setShowAddCard(true)}>
                Add Your First Card
              </Button>
            </CardContent>
          </Card>
        ) : (
          paymentMethods.map((method) => (
            <Card key={method.id}>
              <CardContent className="flex items-center justify-between p-6">
                <div className="flex items-center gap-4">
                  <div className="text-2xl">{getCardIcon(method.cardBrand)}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">
                        {method.cardBrand} •••• {method.cardLast4}
                      </p>
                      {method.isDefault && (
                        <Badge variant="secondary">Default</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Expires {method.cardExpMonth}/{method.cardExpYear}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!method.isDefault && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetDefault(method.id)}
                    >
                      Set as Default
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeletingId(method.id)}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Recent Transactions */}
      <div className="pt-6">
        <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
        {loadingTransactions ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : transactions.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">No transactions yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <Card key={transaction.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          ${transaction.amount.toFixed(2)} {transaction.currency.toUpperCase()}
                        </p>
                        <Badge 
                          variant={transaction.status === 'COMPLETED' ? 'default' : 'secondary'}
                        >
                          {transaction.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(transaction.createdAt), 'MMM d, yyyy • h:mm a')}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {transaction.booking.pickupAddress} → {transaction.booking.dropoffAddress}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {transaction.receiptUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <a 
                            href={transaction.receiptUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                            View
                          </a>
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadReceipt(transaction.id)}
                      >
                        <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                        Download PDF
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add Card Dialog */}
      <Dialog open={showAddCard} onOpenChange={setShowAddCard}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Payment Method</DialogTitle>
            <DialogDescription>
              Add a new card to your account. This will be securely saved for future bookings.
            </DialogDescription>
          </DialogHeader>
          <Elements stripe={stripePromise}>
            <AddCardForm 
              onSuccess={() => {
                setShowAddCard(false);
                fetchPaymentMethods();
              }}
              onCancel={() => setShowAddCard(false)}
            />
          </Elements>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Payment Method</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this payment method? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingId && handleDelete(deletingId)}>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};