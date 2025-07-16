# Custom Domain Setup Guide

## Current Domain Configuration

- **Frontend**: https://www.ridestable.com
- **Backend API**: https://api.ridestable.com

## DNS Configuration

### For the Frontend (www.ridestable.com)

In your domain registrar's DNS settings:

1. **A Record for root domain**:
   - Name: `@` (or leave blank for root)
   - Type: A
   - Value: `76.76.21.21` (Vercel's IP)

2. **CNAME for www subdomain**:
   - Name: `www`
   - Type: CNAME
   - Value: `cname.vercel-dns.com`

### For the Backend API (api.ridestable.com)

Add this DNS record:

- **CNAME for api subdomain**:
  - Name: `api`
  - Type: CNAME
  - Value: `cname.vercel-dns.com`

## Vercel Configuration

### Frontend Project

1. Go to your frontend project in Vercel
2. Settings → Domains
3. Add both:
   - `ridestable.com`
   - `www.ridestable.com`
4. Set `www.ridestable.com` as primary

### Backend Project

1. Go to your backend project in Vercel
2. Settings → Domains
3. Add `api.ridestable.com`

## Environment Variables to Update

### Backend (Vercel Dashboard)

```
CORS_ORIGIN=https://www.ridestable.com,https://ridestable.com,http://localhost:3000
APP_URL=https://www.ridestable.com
GOOGLE_CALLBACK_URL=https://www.ridestable.com/auth/callback/google
```

### Frontend (Vercel Dashboard)

```
VITE_API_URL=https://api.ridestable.com/api
VITE_APP_URL=https://www.ridestable.com
VITE_GOOGLE_REDIRECT_URI=https://www.ridestable.com/auth/callback/google
```

## OAuth Provider Updates

### Google OAuth (Google Cloud Console)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to APIs & Services → Credentials
3. Edit your OAuth 2.0 Client ID
4. Update:
   - **Authorized JavaScript origins**:
     - `https://www.ridestable.com`
     - `https://ridestable.com`
   - **Authorized redirect URIs**:
     - `https://www.ridestable.com/auth/callback/google`

### Stripe Webhook (if using)

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint URL: `https://api.ridestable.com/api/payments/webhook`
3. Update `STRIPE_WEBHOOK_SECRET` in backend with the new webhook secret

## SSL/HTTPS

Vercel automatically provisions SSL certificates for custom domains. No action needed.

## Testing Checklist

After setup, test:

- [ ] Frontend loads at https://www.ridestable.com
- [ ] API responds at https://api.ridestable.com/api/health (or similar endpoint)
- [ ] Frontend can communicate with backend (check network tab)
- [ ] Google OAuth login works
- [ ] No CORS errors in browser console
- [ ] Forms submit successfully
- [ ] Payment processing works (if applicable)

## Troubleshooting

### DNS Propagation
- DNS changes can take up to 48 hours to propagate
- Use [DNS Checker](https://dnschecker.org) to verify propagation

### CORS Issues
- Check browser console for CORS errors
- Verify `CORS_ORIGIN` includes your exact frontend URL
- Ensure credentials are included in API requests

### SSL Issues
- Wait a few minutes after adding domain for SSL provisioning
- Check Vercel dashboard for SSL status

## Monitoring

Consider setting up:
1. Uptime monitoring (e.g., UptimeRobot, Pingdom)
2. Error tracking (e.g., Sentry)
3. Analytics (e.g., Google Analytics, Plausible)