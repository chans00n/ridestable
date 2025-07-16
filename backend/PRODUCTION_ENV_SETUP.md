# Production Environment Setup

## Environment Variables Required for Backend Deployment

When deploying the backend to Vercel, you need to set the following environment variables:

### Database
- `DATABASE_URL`: PostgreSQL connection string with pgbouncer
- `DIRECT_URL`: Direct PostgreSQL connection string

### Redis (Required for production)
- `REDIS_URL`: Redis connection URL (You'll need to set up a Redis instance - consider Upstash or Redis Cloud)

### Security
- `JWT_SECRET`: Strong secret for JWT tokens (generate a random 32+ character string)
- `JWT_REFRESH_SECRET`: Different strong secret for refresh tokens
- `JWT_EXPIRES_IN`: Token expiration time (e.g., "15m")
- `JWT_REFRESH_EXPIRES_IN`: Refresh token expiration (e.g., "7d")

### CORS
- `CORS_ORIGIN`: Comma-separated list of allowed origins, e.g.:
  ```
  https://your-frontend.vercel.app,https://your-custom-domain.com
  ```

### Email (SendGrid)
- `SENDGRID_API_KEY`: Your SendGrid API key
- `EMAIL_FROM`: From email address
- `EMAIL_FROM_NAME`: From name for emails

### Application
- `APP_URL`: Your frontend URL (e.g., https://your-frontend.vercel.app)

### OAuth
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret
- `GOOGLE_CALLBACK_URL`: Must match your frontend URL + /auth/callback/google

### Maps
- `GOOGLE_MAPS_API_KEY`: Google Maps API key

### Payments
- `STRIPE_SECRET_KEY`: Stripe secret key (use live key for production)
- `STRIPE_WEBHOOK_SECRET`: Stripe webhook secret (set up in Stripe dashboard)

### SMS (Twilio)
- `TWILIO_ACCOUNT_SID`: Twilio account SID
- `TWILIO_AUTH_TOKEN`: Twilio auth token
- `TWILIO_PHONE_NUMBER`: Twilio phone number

## Setting Environment Variables in Vercel

1. Go to your backend project in Vercel dashboard
2. Navigate to Settings → Environment Variables
3. Add each variable listed above
4. Make sure to select "Production" environment
5. Save and redeploy

## Security Notes

1. **Never commit `.env` files to git**
2. Generate new secrets for production - don't reuse development secrets
3. Use strong, random strings for JWT secrets (32+ characters)
4. Ensure your database credentials are kept secure
5. Rotate API keys periodically

## Redis Setup Options

For production Redis, consider:
1. **Upstash**: Serverless Redis, works well with Vercel
2. **Redis Cloud**: Managed Redis hosting
3. **AWS ElastiCache**: If you're using AWS infrastructure

## Post-Deployment Checklist

- [ ] All environment variables are set in Vercel
- [ ] CORS origins include your production frontend URL
- [ ] OAuth callback URLs are updated for production
- [ ] Redis is configured and accessible
- [ ] Database connection is working
- [ ] Email sending is tested
- [ ] Payment webhooks are configured in Stripe dashboard
- [ ] SMS sending is tested (if applicable)