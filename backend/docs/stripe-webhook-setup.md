# Stripe Webhook Setup Guide

This guide explains how to set up Stripe webhooks for the Stable Ride payment system.

## Prerequisites

- Stripe account with API access
- Backend server running and accessible
- Stripe CLI (for local development)

## Production Setup

1. **Log in to Stripe Dashboard**
   - Go to https://dashboard.stripe.com
   - Navigate to Developers → Webhooks

2. **Add Webhook Endpoint**
   - Click "Add endpoint"
   - Enter your webhook URL: `https://your-domain.com/api/payments/webhook`
   - Select the following events:
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `charge.refunded`

3. **Copy Webhook Secret**
   - After creating the endpoint, copy the signing secret
   - It will look like: `whsec_...`
   - Update your backend `.env` file:
     ```
     STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
     ```

## Local Development Setup

For local development, use the Stripe CLI to forward webhooks to your local server:

1. **Install Stripe CLI**
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe

   # Windows (using scoop)
   scoop install stripe

   # Linux
   # Download from https://github.com/stripe/stripe-cli/releases
   ```

2. **Login to Stripe CLI**
   ```bash
   stripe login
   ```

3. **Forward Webhooks to Local Server**
   ```bash
   stripe listen --forward-to localhost:8000/api/payments/webhook
   ```

4. **Copy the Webhook Secret**
   - The CLI will display a webhook secret like: `whsec_...`
   - Update your backend `.env` file with this secret

5. **Test Webhooks**
   ```bash
   # In another terminal, trigger a test event
   stripe trigger payment_intent.succeeded
   ```

## Webhook Events Handled

Our system handles the following Stripe webhook events:

### payment_intent.succeeded
- Updates payment status to COMPLETED
- Confirms the booking
- Generates and sends receipt

### payment_intent.payment_failed
- Updates payment status to FAILED
- Records failure reason
- Keeps booking in PENDING status

### charge.refunded
- Updates payment status to REFUNDED
- Updates booking status to CANCELLED
- Records refund details

## Security Considerations

1. **Always Verify Webhook Signatures**
   - Our system automatically verifies webhook signatures using the webhook secret
   - Never process webhooks without signature verification

2. **Use HTTPS in Production**
   - Stripe requires HTTPS for webhook endpoints in production
   - Use proper SSL certificates

3. **Idempotency**
   - Our webhook handlers are idempotent
   - Processing the same event multiple times won't cause issues

4. **Error Handling**
   - We return 200 OK even if processing fails to prevent Stripe from retrying
   - Errors are logged for manual review

## Testing Webhooks

### Using Stripe CLI
```bash
# Test successful payment
stripe trigger payment_intent.succeeded

# Test failed payment
stripe trigger payment_intent.payment_failed

# Test refund
stripe trigger charge.refunded
```

### Manual Testing
1. Create a test payment using the frontend
2. Use test card numbers:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - Requires authentication: `4000 0025 0000 3155`

## Monitoring

- Check webhook logs in Stripe Dashboard → Developers → Webhooks → [Your endpoint]
- Monitor application logs for webhook processing
- Set up alerts for webhook failures

## Troubleshooting

### Webhook Not Received
- Verify the endpoint URL is correct
- Check firewall/security group settings
- Ensure the server is accessible from the internet

### Signature Verification Failed
- Verify the webhook secret is correct
- Make sure you're using the raw request body
- Check that no middleware is modifying the request body

### Event Processing Failed
- Check application logs for errors
- Verify database connectivity
- Ensure all required services are running