# Frontend Deployment Guide for Vercel

## Prerequisites

1. A Vercel account (sign up at https://vercel.com)
2. Vercel CLI installed (optional): `npm i -g vercel`
3. Your backend API deployed and accessible
4. Production API keys (Google Maps, Stripe, etc.)

## Environment Variables

Before deploying, you need to set up the following environment variables in Vercel:

### Required Variables

- `VITE_API_URL`: Your backend API URL (e.g., `https://your-backend.vercel.app/api`)
- `VITE_GOOGLE_MAPS_API_KEY`: Your Google Maps API key with proper production restrictions

### Optional Variables

- `VITE_STRIPE_PUBLISHABLE_KEY`: Your Stripe publishable key (if using payments)
- `VITE_APP_ENV`: Set to `production`

## Deployment Steps

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your Git repository
4. Select the `frontend` directory as the root directory
5. Vercel should auto-detect the framework as Vite
6. Add environment variables:
   - Go to "Environment Variables" section
   - Add each variable listed above with production values
7. Click "Deploy"

### Option 2: Deploy via Vercel CLI

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Run the Vercel CLI:
   ```bash
   vercel
   ```

3. Follow the prompts:
   - Confirm the directory
   - Link to existing project or create new
   - Set environment variables when prompted

4. For production deployment:
   ```bash
   vercel --prod
   ```

## Configuration Details

### vercel.json Configuration

The `vercel.json` file includes:
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Framework**: Vite
- **Rewrites**: SPA routing support (all routes → index.html)
- **Headers**: Cache control for assets

### Build Process

The build process:
1. Runs TypeScript compilation
2. Bundles with Vite
3. Outputs to `dist` directory
4. Optimizes assets for production

## Post-Deployment Checklist

1. **Verify Environment Variables**
   - Check that API calls are reaching the correct backend
   - Ensure Google Maps loads properly
   - Test Stripe integration if applicable

2. **Test Critical Paths**
   - User registration and login
   - Booking flow
   - Payment processing
   - Admin access

3. **Configure Domain (Optional)**
   - Add custom domain in Vercel settings
   - Update DNS records
   - Enable HTTPS (automatic with Vercel)

4. **Set up Production Monitoring**
   - Enable Vercel Analytics
   - Set up error tracking (e.g., Sentry)
   - Configure performance monitoring

## Troubleshooting

### Common Issues

1. **API Connection Errors**
   - Verify `VITE_API_URL` is set correctly
   - Check CORS settings on backend
   - Ensure backend is deployed and accessible

2. **Build Failures**
   - Check TypeScript errors: `npm run type-check`
   - Verify all dependencies are installed
   - Check for missing environment variables

3. **Routing Issues**
   - Ensure `vercel.json` rewrites are configured
   - Test direct URL access to routes

4. **Asset Loading Issues**
   - Check public folder structure
   - Verify asset paths in code
   - Check browser console for 404 errors

### Debug Commands

```bash
# Check build locally
npm run build

# Preview production build
npm run preview

# Type checking
npm run type-check

# Lint check
npm run lint
```

## Security Considerations

1. **API Keys**
   - Never commit `.env` files
   - Use Vercel environment variables
   - Restrict API keys by domain/referrer

2. **CORS**
   - Configure backend to accept only your frontend domain
   - Use proper authentication headers

3. **Content Security Policy**
   - Consider adding CSP headers for additional security
   - Configure in `vercel.json` if needed

## Updating the Deployment

To update your deployment:

1. Push changes to your Git repository
2. Vercel automatically deploys on push (if connected)
3. Or manually trigger: `vercel --prod`

## Rollback

If you need to rollback:
1. Go to Vercel dashboard
2. Navigate to your project
3. Go to "Deployments" tab
4. Click on a previous deployment
5. Promote it to production

## Support

For issues specific to:
- Vercel platform: https://vercel.com/docs
- Vite: https://vitejs.dev/guide/
- React: https://react.dev/