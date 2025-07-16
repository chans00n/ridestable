import React from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY!);

interface PaymentFormProps {
  clientSecret: string;
  paymentId: string;
  amount: number;
  onSuccess: (paymentId: string) => void;
  onError?: (error: string) => void;
}

const CheckoutForm: React.FC<{ paymentId: string; amount: number; onSuccess: (paymentId: string) => void; onError?: (error: string) => void }> = ({ paymentId, amount, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [message, setMessage] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  
  // Detect if dark mode is active
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  
  React.useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    
    checkDarkMode();
    
    // Listen for theme changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    console.log('CheckoutForm - Stripe loaded:', !!stripe, 'Elements loaded:', !!elements);
  }, [stripe, elements]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment/confirmation`,
      },
      redirect: 'if_required',
    });

    if (error) {
      setMessage(error.message || 'An unexpected error occurred.');
      onError?.(error.message || 'Payment failed');
    } else {
      // Payment succeeded
      onSuccess(paymentId);
    }

    setIsLoading(false);
  };

  return (
    <>
      <style>{`
        /* Force Stripe form labels to be visible in dark mode */
        .dark .__PrivateStripeElement label,
        .dark .__PrivateStripeElement .Label,
        .dark .__PrivateStripeElement .Text,
        .dark .__PrivateStripeElement .Text--caption {
          color: hsl(var(--muted-foreground)) !important;
        }
        
        .dark .__PrivateStripeElement input,
        .dark .__PrivateStripeElement .Input {
          background-color: hsl(var(--background)) !important;
          color: hsl(var(--foreground)) !important;
          border-color: hsl(var(--border)) !important;
        }
        
        .dark .__PrivateStripeElement select {
          background-color: hsl(var(--background)) !important;
          color: hsl(var(--foreground)) !important;
          border-color: hsl(var(--border)) !important;
        }
        
        /* Light mode overrides */
        .__PrivateStripeElement label,
        .__PrivateStripeElement .Label,
        .__PrivateStripeElement .Text,
        .__PrivateStripeElement .Text--caption {
          color: hsl(var(--muted-foreground)) !important;
        }
      `}</style>
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Payment Details
        </h3>
        <div className="bg-muted/50 rounded-lg p-4 mb-4 border border-border">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Amount to pay:</span>
            <span className="text-xl font-semibold text-foreground">
              ${amount.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <PaymentElement 
        options={{
          layout: 'tabs',
        }}
      />
      
      {message && <div className="mt-4 text-sm text-destructive">{message}</div>}
      
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
        </svg>
        <span>Your payment information is encrypted and secure</span>
      </div>

      <button
        type="submit"
        disabled={!stripe || isLoading}
        className={`w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium 
          ${isLoading || !stripe
            ? 'bg-muted text-muted-foreground cursor-not-allowed'
            : 'bg-primary text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring'
          }`}
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            Processing...
          </div>
        ) : (
          `Pay $${amount.toFixed(2)}`
        )}
      </button>
    </form>
    </>
  );
};

export const PaymentForm: React.FC<PaymentFormProps> = ({ clientSecret, paymentId, amount, onSuccess, onError }) => {
  console.log('PaymentForm - clientSecret:', clientSecret);
  
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  
  React.useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    
    checkDarkMode();
    
    // Listen for theme changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    
    return () => observer.disconnect();
  }, []);
  
  const appearance = React.useMemo(() => ({
    theme: isDarkMode ? 'night' : 'stripe',
    variables: {
      colorPrimary: isDarkMode ? '#3b82f6' : '#1a56db',
      colorBackground: isDarkMode ? '#09090b' : '#ffffff',
      colorSurface: isDarkMode ? '#18181b' : '#ffffff',
      colorText: isDarkMode ? '#a1a1aa' : '#1e293b',
      colorTextSecondary: isDarkMode ? '#71717a' : '#64748b',
      colorTextPlaceholder: isDarkMode ? '#52525b' : '#94a3b8',
      colorIconTab: isDarkMode ? '#71717a' : '#64748b',
      colorLogo: isDarkMode ? 'light' : 'dark',
      colorIconCardError: isDarkMode ? '#ef4444' : '#dc2626',
      colorDanger: isDarkMode ? '#ef4444' : '#dc2626',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSizeBase: '14px',
      spacingUnit: '4px',
      borderRadius: '6px',
    },
    rules: {
      '.Label': {
        color: isDarkMode ? '#a1a1aa' : '#374151',
        fontSize: '14px',
        fontWeight: '500',
      },
      '.Input': {
        backgroundColor: isDarkMode ? '#18181b' : '#ffffff',
        color: isDarkMode ? '#f4f4f5' : '#1e293b',
        border: `1px solid ${isDarkMode ? '#27272a' : '#e5e7eb'}`,
        fontSize: '14px',
      },
      '.Input:hover': {
        borderColor: isDarkMode ? '#3f3f46' : '#d1d5db',
      },
      '.Input:focus': {
        borderColor: isDarkMode ? '#3b82f6' : '#1a56db',
        boxShadow: `0 0 0 3px ${isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(26, 86, 219, 0.1)'}`,
      },
      '.Tab': {
        backgroundColor: isDarkMode ? '#27272a' : '#f9fafb',
        color: isDarkMode ? '#a1a1aa' : '#6b7280',
        border: `1px solid ${isDarkMode ? '#3f3f46' : '#e5e7eb'}`,
      },
      '.Tab:hover': {
        backgroundColor: isDarkMode ? '#3f3f46' : '#f3f4f6',
      },
      '.Tab--selected': {
        backgroundColor: isDarkMode ? '#18181b' : '#ffffff',
        color: isDarkMode ? '#f4f4f5' : '#1f2937',
        borderColor: isDarkMode ? '#3b82f6' : '#1a56db',
      },
    }
  }), [isDarkMode]);
  
  const options = React.useMemo(() => ({
    clientSecret,
    appearance,
  }), [clientSecret, appearance]);
  
  return (
    <Elements options={options} stripe={stripePromise} key={isDarkMode ? 'dark' : 'light'}>
      <CheckoutForm paymentId={paymentId} amount={amount} onSuccess={onSuccess} onError={onError} />
    </Elements>
  );
};