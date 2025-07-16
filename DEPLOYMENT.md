# 🚀 Stable Ride Production Deployment Guide

This guide will walk you through deploying Stable Ride using GitHub, Vercel, and Supabase.

## Prerequisites

- GitHub account with repository
- Vercel account
- Supabase account
- Stripe account (for payments)
- SendGrid account (for emails)
- Twilio account (for SMS)
- Google Cloud account (for Maps API and OAuth)

## Step 1: Supabase Setup

### 1.1 Create Supabase Project

1. Go to [app.supabase.com](https://app.supabase.com)
2. Create a new project
3. Save your database password securely
4. Wait for project to initialize

### 1.2 Get Database URLs

Once initialized, go to Settings → Database and copy:
- Connection string (Transaction pooler) - use as `DATABASE_URL`
- Connection string (Direct connection) - use as `DIRECT_URL`

### 1.3 Run Database Migrations

```bash
# Update .env with Supabase URLs
cp .env.production.example .env.production
# Edit .env.production with your Supabase URLs

# Generate Prisma client
cd backend
npx prisma generate

# Push schema to Supabase
npx prisma db push

# Generate migrations (if needed)
npx prisma migrate dev --name init
```

### 1.4 Enable Row Level Security (RLS)

In Supabase SQL Editor, run:
```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
-- Add more tables as needed
```

## Step 2: Backend Deployment to Vercel

### 2.1 Prepare Backend for Vercel

1. Create a new Vercel project at [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Configure as follows:
   - Framework Preset: Other
   - Root Directory: `backend`
   - Build Command: `npm run build`
   - Output Directory: `dist`

### 2.2 Add Environment Variables

In Vercel project settings → Environment Variables, add all variables from `.env.production.example`:

**Required for initial deployment:**
- `DATABASE_URL`
- `DIRECT_URL`
- `JWT_SECRET` (generate with: `openssl rand -base64 32`)
- `NODE_ENV` = "production"
- `FRONTEND_URL` (add after frontend deployment)

**Add these before going live:**
- All Stripe keys
- SendGrid configuration
- Twilio configuration
- OAuth credentials

### 2.3 Deploy Backend

Click "Deploy" and wait for the build to complete. Note your backend URL: `https://[project-name].vercel.app`

## Step 3: Frontend Deployment to Vercel

### 3.1 Create Frontend Project

1. Create another Vercel project
2. Import the same GitHub repository
3. Configure as follows:
   - Framework Preset: Vite
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`

### 3.2 Add Frontend Environment Variables

Add these environment variables:
- `VITE_API_URL` = Your backend URL + "/api" (e.g., `https://stable-ride-backend.vercel.app/api`)
- `VITE_STRIPE_PUBLISHABLE_KEY` = Your Stripe publishable key
- `VITE_GOOGLE_MAPS_API_KEY` = Your Google Maps API key

### 3.3 Deploy Frontend

Deploy and note your frontend URL.

## Step 4: Update Backend Environment

Go back to your backend Vercel project and add:
- `FRONTEND_URL` = Your frontend deployment URL
- `CORS_ORIGIN` = Your frontend deployment URL

Redeploy the backend for changes to take effect.

## Step 5: Post-Deployment Setup

### 5.1 Create Admin User

Use the Supabase SQL editor or create a script:

```sql
INSERT INTO admin_users (email, password, first_name, last_name, role)
VALUES (
  'admin@yourdomain.com',
  crypt('your-secure-password', gen_salt('bf')),
  'Admin',
  'User',
  'SUPER_ADMIN'
);
```

### 5.2 Configure Stripe Webhooks

1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://[backend-url]/api/payments/stripe-webhook`
3. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
4. Copy webhook secret to Vercel environment variables

### 5.3 Set up Domain (Optional)

1. In Vercel project settings → Domains
2. Add your custom domain
3. Update environment variables with new domain URLs

## Step 6: Testing Checklist

### Core Functionality Tests:

- [ ] **User Registration & Login**
  - Register new user
  - Verify email (check SendGrid)
  - Login with credentials
  - Login with Google OAuth

- [ ] **Booking Flow**
  - Search for ride
  - Get quote
  - Select vehicle type
  - Complete booking
  - Receive confirmation email/SMS

- [ ] **Payment Processing**
  - Add payment method
  - Process payment
  - Check Stripe dashboard
  - Verify webhook received

- [ ] **Admin Panel**
  - Login at `/admin/login`
  - View bookings
  - Manage users
  - View reports

- [ ] **Driver Features**
  - Driver login
  - View assigned bookings
  - Update booking status

## Step 7: Monitoring & Maintenance

### 7.1 Set up Monitoring

1. **Vercel Analytics**: Enable in project settings
2. **Sentry Error Tracking**:
   ```bash
   npm install @sentry/node @sentry/react
   ```
   Add Sentry DSN to environment variables

3. **Uptime Monitoring**: Use Better Uptime or Pingdom

### 7.2 Database Backups

Supabase automatically backs up your database daily. For more frequent backups:
1. Go to Database → Backups
2. Configure backup schedule

### 7.3 Logs

- Vercel Functions logs: Available in Vercel dashboard
- Supabase logs: Available in Supabase dashboard

## Troubleshooting

### Common Issues:

1. **CORS Errors**: Ensure `FRONTEND_URL` is correctly set in backend env
2. **Database Connection**: Use connection pooler URL for serverless
3. **Payment Webhooks**: Verify webhook secret and endpoint URL
4. **Email Not Sending**: Check SendGrid API key and sender verification

### Debug Mode:

Add these to backend env for debugging:
- `DEBUG=true`
- `LOG_LEVEL=debug`

## Security Checklist

- [ ] All sensitive keys in environment variables
- [ ] HTTPS enabled on all domains
- [ ] Rate limiting configured
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (Prisma handles this)
- [ ] XSS protection headers enabled

## Going Live Checklist

Before announcing your service:
1. [ ] Test all payment flows with real cards
2. [ ] Verify email/SMS delivery
3. [ ] Load test the application
4. [ ] Set up customer support email
5. [ ] Create terms of service and privacy policy pages
6. [ ] Configure Google Maps API restrictions
7. [ ] Set up error alerting
8. [ ] Document driver onboarding process
9. [ ] Create user documentation

## Support

For deployment issues:
- Vercel: [vercel.com/support](https://vercel.com/support)
- Supabase: [supabase.com/support](https://supabase.com/support)
- Prisma: [prisma.io/docs](https://www.prisma.io/docs)

---

Remember to keep your production environment variables secure and never commit them to Git!