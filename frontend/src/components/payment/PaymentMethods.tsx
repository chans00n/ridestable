import React, { useState, useEffect } from 'react';
import { usePayment } from '../../hooks/usePayment';
import { PaymentMethodCard } from './PaymentMethodCard';
import { toast } from 'react-hot-toast';
import {
  PaymentElement,
  Elements,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { stripePromise, stripeElementsOptions } from '../../config/stripe';
import { Skeleton } from '@/components/ui/skeleton';

const AddPaymentMethodForm: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { addPaymentMethod } = usePayment();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      // Create payment method
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        elements,
      });

      if (error) {
        toast.error(error.message || 'Failed to add payment method');
      } else if (paymentMethod) {
        // Save payment method to backend
        await addPaymentMethod(paymentMethod.id);
        toast.success('Payment method added successfully');
        onSuccess();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add payment method');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement 
        options={{
          layout: 'tabs',
          paymentMethodOrder: ['card'],
        }}
      />
      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
          ${isProcessing || !stripe
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
          }`}
      >
        {isProcessing ? 'Adding...' : 'Add Payment Method'}
      </button>
    </form>
  );
};

export const PaymentMethods: React.FC = () => {
  const { getPaymentMethods, removePaymentMethod } = usePayment();
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true);
      const methods = await getPaymentMethods();
      setPaymentMethods(methods);
    } catch (error) {
      toast.error('Failed to load payment methods');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const handleRemove = async (id: string) => {
    if (!confirm('Are you sure you want to remove this payment method?')) {
      return;
    }

    try {
      await removePaymentMethod(id);
      toast.success('Payment method removed');
      fetchPaymentMethods();
    } catch (error) {
      toast.error('Failed to remove payment method');
    }
  };

  const handleAddSuccess = () => {
    setShowAddForm(false);
    fetchPaymentMethods();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-9 w-36" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Payment Methods</h2>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Add Payment Method
          </button>
        )}
      </div>

      {showAddForm && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Add New Payment Method</h3>
            <button
              onClick={() => setShowAddForm(false)}
              className="text-gray-400 hover:text-gray-500"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {stripePromise ? (
            <Elements stripe={stripePromise} options={stripeElementsOptions}>
              <AddPaymentMethodForm onSuccess={handleAddSuccess} />
            </Elements>
          ) : (
            <p className="text-red-600">Payment system not configured</p>
          )}
        </div>
      )}

      {paymentMethods.length === 0 ? (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No payment methods</h3>
          <p className="mt-1 text-sm text-gray-500">
            Add a payment method to make booking easier.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {paymentMethods.map((method) => (
            <PaymentMethodCard
              key={method.id}
              id={method.id}
              brand={method.card?.brand || 'Card'}
              last4={method.card?.last4 || '****'}
              expMonth={method.card?.expMonth || 0}
              expYear={method.card?.expYear || 0}
              onRemove={handleRemove}
            />
          ))}
        </div>
      )}
    </div>
  );
};