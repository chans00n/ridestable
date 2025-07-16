import { loadStripe } from '@stripe/stripe-js';

// Get Stripe publishable key from environment
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

console.log('Stripe configuration:', {
  hasKey: !!stripePublishableKey,
  keyPrefix: stripePublishableKey?.substring(0, 10),
  env: import.meta.env.MODE
});

if (!stripePublishableKey) {
  console.error('Stripe publishable key not found. Payment functionality will not work.');
}

// Initialize Stripe.js with the publishable key
export const stripePromise = stripePublishableKey 
  ? loadStripe(stripePublishableKey)
  : null;

// Stripe Elements appearance configuration
export const stripeElementsOptions = {
  appearance: {
    theme: 'stripe' as const,
  },
};