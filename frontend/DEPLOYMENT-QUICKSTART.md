# Frontend Deployment Quick Start

## 🚀 Quick Deployment Steps

### 1. Update Environment Variables

Create a `.env.production` file or set these in Vercel Dashboard:

```bash
VITE_API_URL=https://your-backend.vercel.app/api
VITE_GOOGLE_MAPS_API_KEY=your-production-google-maps-key
VITE_STRIPE_PUBLISHABLE_KEY=your-production-stripe-key
VITE_APP_ENV=production
```

### 2. Test Build Locally

```bash
# Check environment variables
npm run check-env

# Build for production
npm run build:prod

# Preview production build
npm run preview:prod
```

### 3. Deploy to Vercel

#### Option A: GitHub Integration (Recommended)
1. Push your code to GitHub
2. Import repository in Vercel Dashboard
3. Select `frontend` as root directory
4. Add environment variables
5. Deploy!

#### Option B: CLI Deployment
```bash
cd frontend
npx vercel --prod
```

### 4. Post-Deployment

1. **Update Backend CORS**: Add your frontend URL to allowed origins
2. **Test Critical Paths**: Login, booking, payments
3. **Monitor**: Check Vercel dashboard for errors

## 📝 Important Notes

- **Backend URL**: Must include `/api` suffix (e.g., `https://backend.vercel.app/api`)
- **Google Maps**: Restrict API key to your production domain
- **Stripe**: Use production publishable key, not secret key
- **Build**: Vercel auto-detects Vite and uses `npm run build`

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| API connection failed | Check VITE_API_URL and backend CORS |
| Build fails | Run `npm run type-check` locally |
| Routes return 404 | Check vercel.json rewrites |
| Maps not loading | Verify Google Maps API key |

## 📞 Need Help?

- Check full guide: `DEPLOYMENT.md`
- Vercel docs: https://vercel.com/docs
- Backend must be deployed first!