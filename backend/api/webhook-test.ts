import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
  const hasWebhookSecret = !!STRIPE_WEBHOOK_SECRET;
  const secretLength = STRIPE_WEBHOOK_SECRET?.length || 0;
  
  // Check if Stripe signature header exists
  const stripeSignature = req.headers['stripe-signature'];
  
  res.status(200).json({
    status: 'ok',
    webhook: {
      endpoint: 'https://api.ridestable.com/payments/webhook',
      hasWebhookSecret,
      secretLength,
      httpMethod: req.method,
      hasStripeSignature: !!stripeSignature,
      headers: {
        'content-type': req.headers['content-type'],
        'stripe-signature': stripeSignature ? 'present' : 'missing'
      }
    },
    instructions: {
      step1: 'Go to Stripe Dashboard > Webhooks',
      step2: 'Add endpoint URL: https://api.ridestable.com/payments/webhook',
      step3: 'Select events: payment_intent.succeeded, payment_intent.payment_failed, charge.refunded',
      step4: 'Copy the signing secret',
      step5: 'Add STRIPE_WEBHOOK_SECRET to Vercel environment variables'
    },
    timestamp: new Date().toISOString()
  });
}