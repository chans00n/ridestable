import Stripe from 'stripe';

export interface StripeConfig {
  publishableKey: string;
  secretKey: string;
  webhookSecret: string;
  currency: 'usd';
  paymentMethods: string[];
  captureMethod: 'automatic' | 'manual';
  apiVersion: Stripe.LatestApiVersion;
}

export const stripeConfig: Omit<StripeConfig, 'publishableKey'> = {
  secretKey: process.env.STRIPE_SECRET_KEY || '',
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  currency: 'usd',
  paymentMethods: ['card'],
  captureMethod: 'automatic',
  apiVersion: '2023-10-16' as Stripe.LatestApiVersion,
};

// Stripe client configuration
export const stripeClientConfig: Stripe.StripeConfig = {
  apiVersion: '2023-10-16' as Stripe.LatestApiVersion,
  typescript: true,
  maxNetworkRetries: 3,
  timeout: 20000,
  appInfo: {
    name: 'Stable Ride',
    version: '1.0.0',
    url: 'https://stableride.com'
  }
};

// Validate configuration
export const validateStripeConfig = () => {
  if (!stripeConfig.secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  
  if (!stripeConfig.webhookSecret) {
    console.warn('STRIPE_WEBHOOK_SECRET is not configured - webhooks will not work');
  }
};