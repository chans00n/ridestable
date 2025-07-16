# Production Testing Checklist

Test your production deployment at https://www.ridestable.com

## 🌐 Basic Connectivity

- [ ] Frontend loads at https://www.ridestable.com
- [ ] No console errors on page load
- [ ] API health check: Visit https://api.ridestable.com/api/health
- [ ] Check browser Network tab - API calls should go to api.ridestable.com

## 🔐 Authentication

### Email/Password
- [ ] Sign up with new email account
- [ ] Verify email (check inbox)
- [ ] Log in with email/password
- [ ] Log out successfully
- [ ] Password reset flow

### Google OAuth
- [ ] Click "Sign in with Google"
- [ ] Complete Google authentication
- [ ] Redirect back to app successfully
- [ ] User profile populated with Google data

## 🚗 Core Booking Flow

1. **Location Search**
   - [ ] Search for pickup location
   - [ ] Google Maps autocomplete works
   - [ ] Search for destination
   - [ ] Map displays route correctly

2. **Service Selection**
   - [ ] Select service type (Standard/Premium/etc)
   - [ ] Date/time picker works
   - [ ] Additional options (child seats, etc) can be selected

3. **Quote & Booking**
   - [ ] Quote calculation displays
   - [ ] Booking form submission works
   - [ ] Confirmation page displays

## 💳 Payment

- [ ] Add payment method (Stripe test card: 4242 4242 4242 4242)
- [ ] Payment processes successfully
- [ ] Payment confirmation received

## 👤 User Dashboard

- [ ] View booking history
- [ ] Update profile information
- [ ] Manage saved locations
- [ ] View/download invoices

## 📱 Responsive Design

- [ ] Test on mobile device/responsive mode
- [ ] Navigation menu works on mobile
- [ ] Forms are usable on mobile
- [ ] Maps display correctly on mobile

## 🔧 Admin Panel

- [ ] Admin login at /admin
- [ ] View bookings list
- [ ] Customer management works
- [ ] Settings can be updated

## 🚨 Error Handling

- [ ] 404 page displays for invalid routes
- [ ] API errors show user-friendly messages
- [ ] Form validation messages display correctly

## 📧 Communications

- [ ] Welcome email sent on signup
- [ ] Booking confirmation email sent
- [ ] SMS notifications (if configured)

## 🔍 SEO & Performance

- [ ] Page titles and meta descriptions present
- [ ] Images load properly
- [ ] No broken links
- [ ] Page load time acceptable

## 🐛 Common Issues to Check

### CORS Errors
- Open browser console (F12)
- Look for "CORS" or "Cross-Origin" errors
- Should see NO such errors

### API Connection
- Network tab should show API calls to https://api.ridestable.com
- Responses should be 200/201 (not 404 or 500)

### Authentication Issues
- Cookies should be set after login
- Protected routes should redirect to login if not authenticated

## 📊 Monitoring Setup (Optional but Recommended)

Consider setting up:
- [ ] Google Analytics
- [ ] Error tracking (Sentry)
- [ ] Uptime monitoring
- [ ] Performance monitoring

## 🎉 Launch Readiness

Once all critical items above are checked:
- [ ] Remove test Stripe keys and use live keys
- [ ] Update any "coming soon" or placeholder content
- [ ] Set up customer support email/system
- [ ] Create user documentation
- [ ] Plan marketing launch

## Debug Commands

If you encounter issues, check:

1. **Frontend Logs**: Browser console (F12)
2. **Backend Logs**: Vercel dashboard → Functions → Logs
3. **Network Traffic**: Browser Network tab
4. **Database**: Supabase dashboard

## Support Contacts

- Frontend issues: Check Vercel dashboard
- Backend issues: Check Vercel functions logs
- Database issues: Supabase dashboard
- Payment issues: Stripe dashboard