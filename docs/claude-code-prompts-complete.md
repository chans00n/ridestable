# Claude Code Implementation Prompts - Stable Ride MVP

## How to Use These Prompts

1. **Copy each sprint prompt** into Claude Code at the start of each sprint
2. **Reference the acceptance criteria** from the original ticket plan
3. **Run tests frequently** as Claude Code implements features
4. **Iterate and refine** based on Claude Code's output

---

## Sprint 1: Foundation & Setup

### Claude Code Prompt for Sprint 1

```
I'm building a premium private driver booking platform called "Stable Ride". This is Sprint 1 focused on project foundation and basic setup.

TECHNICAL STACK:
- Frontend: React 18 + TypeScript + Vite
- Backend: Node.js + Express + TypeScript
- Database: PostgreSQL with Prisma ORM
- Authentication: JWT with refresh tokens
- Session Storage: Redis
- Environment: Docker for development

PROJECT STRUCTURE REQUIREMENTS:
Create a monorepo structure:
```
stable-ride/
├── frontend/          # React + TypeScript
├── backend/           # Node.js + Express API
├── shared/            # Shared types and utilities
├── docker-compose.yml # Development environment
└── README.md          # Setup instructions
```

TASKS FOR THIS SPRINT:

1. DEVELOPMENT ENVIRONMENT SETUP:
   - Initialize the monorepo with proper package.json files
   - Set up React + TypeScript + Vite frontend with Tailwind CSS
   - Set up Node.js + Express + TypeScript backend
   - Configure PostgreSQL and Redis with Docker
   - Set up Prisma ORM with initial schema
   - Configure ESLint, Prettier, and Husky for code quality
   - Set up basic CI/CD with GitHub Actions

2. DATABASE SCHEMA DESIGN:
   Create Prisma schema with these core models:
   - Users (id, email, password, firstName, lastName, phone, emailVerified, createdAt, updatedAt)
   - Bookings (id, userId, serviceType, status, scheduledDateTime, pickupAddress, dropoffAddress, totalAmount, createdAt, updatedAt)
   - Locations (id, userId, name, address, latitude, longitude, isDefault)
   - Payments (id, bookingId, stripePaymentIntentId, amount, status, createdAt)
   - AdminUsers (id, email, password, role, permissions, createdAt)

3. BASIC AUTHENTICATION SYSTEM:
   - User registration endpoint with password hashing (bcrypt)
   - User login endpoint with JWT token generation
   - JWT middleware for protected routes
   - Refresh token mechanism
   - Password reset flow preparation
   - Basic rate limiting

4. FRONTEND PROJECT STRUCTURE:
   - Set up React Router with protected routes
   - Create basic layout components (Header, Footer, Layout)
   - Set up Axios for API calls with interceptors
   - Configure environment variables
   - Create basic authentication context
   - Set up form handling with react-hook-form

TECHNICAL REQUIREMENTS:
- Use TypeScript strictly (no any types)
- Implement proper error handling and logging
- Add input validation with Zod
- Follow REST API conventions
- Implement CORS properly
- Use secure HTTP headers
- Add request/response logging

ACCEPTANCE CRITERIA:
- ✅ Development environment runs with `docker-compose up`
- ✅ Frontend accessible at http://localhost:3000
- ✅ Backend API accessible at http://localhost:8000
- ✅ Database migrations run successfully
- ✅ Basic authentication endpoints work
- ✅ User registration and login flow functional
- ✅ JWT tokens generated and validated
- ✅ Protected routes redirect to login
- ✅ Code quality tools configured and passing

Please implement this step by step, ensuring each component works before moving to the next. Focus on clean, maintainable code with proper TypeScript types throughout.
```

---

## Sprint 2: User Authentication & Basic UI

### Claude Code Prompt for Sprint 2

```
This is Sprint 2 of the Stable Ride platform. We're building the complete user authentication flow with a professional UI.

CONTEXT: 
Sprint 1 delivered the basic project structure and authentication API. Now we need to create the user-facing authentication interface with email verification and password reset.

UI DESIGN REQUIREMENTS:
- Clean, modern design inspired by premium transportation services
- Mobile-first responsive design
- Professional color scheme (blues/grays with accent colors)
- Smooth animations and micro-interactions
- Loading states and proper error handling

TASKS FOR THIS SPRINT:

1. REGISTRATION PAGE IMPLEMENTATION:
   - Create responsive registration form with these fields:
     * First Name (required, min 2 chars)
     * Last Name (required, min 2 chars)  
     * Email (required, valid email format)
     * Phone Number (required, with country code support)
     * Password (required, min 8 chars, 1 uppercase, 1 number, 1 special)
     * Confirm Password (must match)
     * Terms of Service acceptance checkbox
   - Implement real-time form validation
   - Add password strength indicator
   - Phone number formatting and validation
   - Success/error toast notifications
   - Loading states during submission

2. LOGIN PAGE IMPLEMENTATION:
   - Create responsive login form:
     * Email field with validation
     * Password field with show/hide toggle
     * "Remember Me" checkbox
     * "Forgot Password?" link
   - Implement proper form validation
   - Add social login buttons (prepare for future Google/Apple integration)
   - Error handling for invalid credentials
   - Redirect to dashboard after successful login

3. EMAIL VERIFICATION SYSTEM:
   Backend tasks:
   - Set up SendGrid integration for email sending
   - Create email templates (verification, welcome, password reset)
   - Implement email verification token generation and validation
   - Create resend verification email endpoint
   - Add email verification status to user model

   Frontend tasks:
   - Create email verification prompt page
   - Implement resend verification email functionality
   - Add verification success page
   - Handle email verification from link clicks

4. PASSWORD RESET FUNCTIONALITY:
   Backend tasks:
   - Generate secure password reset tokens (expire in 24 hours)
   - Create password reset email template
   - Implement password reset validation and update

   Frontend tasks:
   - Create "Forgot Password" form
   - Create password reset form (with token validation)
   - Add success confirmations and error handling
   - Implement password reset link handling

TECHNICAL SPECIFICATIONS:

Frontend Requirements:
- Use react-hook-form for form management
- Implement Zod schemas for validation
- Add Tailwind CSS for styling
- Use Framer Motion for animations
- Create reusable form components (Input, Button, FormField)
- Implement proper TypeScript interfaces for all forms

Backend Requirements:
- Integrate SendGrid with proper error handling
- Add rate limiting for authentication endpoints
- Implement secure token generation (crypto.randomBytes)
- Add proper email template system
- Create middleware for email verification checks
- Add comprehensive logging for auth events

Security Considerations:
- Rate limit password reset requests (max 3 per hour per email)
- Use secure, time-limited tokens
- Implement account lockout after 5 failed login attempts
- Add CSRF protection
- Sanitize all input data
- Log all authentication events

UI/UX Requirements:
- Consistent spacing and typography system
- Proper focus states and accessibility
- Mobile-responsive design (320px to 1920px)
- Loading spinners and skeleton screens
- Toast notifications for user feedback
- Progressive disclosure for complex forms

COMPONENT STRUCTURE:
```
frontend/src/
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   ├── ForgotPasswordForm.tsx
│   │   └── ResetPasswordForm.tsx
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── FormField.tsx
│   │   └── Toast.tsx
├── pages/
│   ├── auth/
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── ForgotPassword.tsx
│   │   ├── ResetPassword.tsx
│   │   └── VerifyEmail.tsx
├── hooks/
│   └── useAuth.ts
├── services/
│   └── authService.ts
└── types/
    └── auth.ts
```

ACCEPTANCE CRITERIA:
- ✅ Registration form validates all fields in real-time
- ✅ Successful registration sends verification email
- ✅ Login form handles authentication with proper error messages
- ✅ "Remember Me" extends session duration
- ✅ Email verification flow works end-to-end
- ✅ Password reset emails are sent and processed correctly
- ✅ All forms are mobile-responsive and accessible
- ✅ Loading states and error handling work properly
- ✅ Authentication state persists across browser refreshes
- ✅ Protected routes redirect unauthenticated users

Focus on creating a polished, professional user experience that builds trust with premium transportation customers. Ensure all forms are intuitive and provide clear feedback to users.
```

---

## Sprint 3: Core Booking Interface

### Claude Code Prompt for Sprint 3

```
This is Sprint 3 of Stable Ride. We're building the core booking interface with service selection, location management, and date/time selection.

CONTEXT:
Users can now register and login. We need to build the booking flow that allows customers to select service types, pick locations, and schedule rides.

SERVICE TYPES TO IMPLEMENT:
1. One-Way: Single pickup → single dropoff
2. Roundtrip: Pickup → destination → return to pickup (or different location)
3. Hourly: Pickup location with time-based service (minimum 2 hours)

TASKS FOR THIS SPRINT:

1. SERVICE TYPE SELECTION INTERFACE:
   Create an elegant service selection page:
   - Three large, clickable service type cards
   - Each card shows: icon, title, description, typical use cases
   - Hover effects and smooth transitions
   - Clear pricing structure hints
   - "Select" button that navigates to booking form
   - Mobile-responsive grid layout

   Service Type Details:
   ```typescript
   interface ServiceType {
     id: 'one-way' | 'roundtrip' | 'hourly';
     name: string;
     description: string;
     icon: string;
     features: string[];
     startingPrice: string;
   }
   ```

2. GOOGLE MAPS INTEGRATION:
   Backend setup:
   - Configure Google Maps API keys
   - Create geocoding service for address validation
   - Implement distance calculation between coordinates
   - Add location search endpoint with autocomplete

   Frontend implementation:
   - Set up Google Places Autocomplete
   - Create location input component with map preview
   - Implement "Use Current Location" functionality
   - Add saved locations management (Home, Work, etc.)
   - Show distance and estimated travel time
   - Validate service area boundaries

   Location Management Features:
   - Address autocomplete with Google Places API
   - Manual address entry with validation
   - Save frequently used locations
   - Location history for quick selection
   - Special instructions field for each location
   - GPS coordinates capture and validation

3. DATE & TIME SELECTION COMPONENT:
   Create sophisticated date/time picker:
   - Calendar widget with available dates highlighted
   - Time slots in 15-minute increments
   - Business hours enforcement (e.g., 6 AM - 11 PM)
   - Minimum advance booking time (2 hours)
   - Maximum advance booking (30 days)
   - Different time requirements per service type
   - Timezone handling and display
   - Holiday and blackout date management

   Special Requirements:
   - One-Way: Single date/time selection
   - Roundtrip: Outbound + return date/time selection
   - Hourly: Start time + duration selection (2-8 hours)

4. BOOKING FORM STRUCTURE:
   Create dynamic form that adapts to service type:

   Shared Fields:
   - Pickup location (required)
   - Date and time (required)
   - Special instructions (optional)
   - Contact phone number (pre-filled, editable)

   Service-Specific Fields:
   - One-Way: Dropoff location
   - Roundtrip: Destination, return date/time, same pickup location checkbox
   - Hourly: Service duration, approximate route/activities

   Form Features:
   - Auto-save to localStorage every 30 seconds
   - Progress indicator (Step 1 of 4)
   - Form validation with real-time feedback
   - Smooth transitions between sections
   - Mobile-optimized input controls

TECHNICAL IMPLEMENTATION:

Frontend Components:
```
src/
├── components/
│   ├── booking/
│   │   ├── ServiceTypeSelector.tsx
│   │   ├── LocationInput.tsx
│   │   ├── DateTimePicker.tsx
│   │   ├── BookingForm.tsx
│   │   └── BookingProgress.tsx
│   ├── maps/
│   │   ├── MapPreview.tsx
│   │   ├── LocationAutocomplete.tsx
│   │   └── SavedLocations.tsx
├── services/
│   ├── mapsService.ts
│   ├── locationService.ts
│   └── bookingService.ts
├── types/
│   ├── booking.ts
│   ├── location.ts
│   └── maps.ts
```

Backend Endpoints:
```
POST /api/locations/search          # Address autocomplete
POST /api/locations/geocode         # Convert address to coordinates
POST /api/locations/reverse         # Convert coordinates to address
GET  /api/locations/user/:userId    # User's saved locations
POST /api/locations/user/:userId    # Save new location
POST /api/bookings/draft           # Save draft booking
GET  /api/bookings/availability    # Check time slot availability
```

Database Schema Updates:
```sql
-- Add to existing schema
ALTER TABLE locations ADD COLUMN type VARCHAR(20); -- 'home', 'work', 'custom'
ALTER TABLE locations ADD COLUMN instructions TEXT;
ALTER TABLE bookings ADD COLUMN service_type VARCHAR(20);
ALTER TABLE bookings ADD COLUMN return_datetime TIMESTAMP;
ALTER TABLE bookings ADD COLUMN duration_hours INTEGER;
ALTER TABLE bookings ADD COLUMN special_instructions TEXT;
```

Google Maps Integration:
- Configure Google Maps Platform with Places API
- Implement proper API key management and rate limiting
- Add error handling for API failures
- Cache common location searches
- Implement autocomplete debouncing (300ms delay)

Form State Management:
- Use React Hook Form with resolver for validation
- Implement Zod schemas for type safety
- Create custom hooks for location management
- Add form persistence with localStorage
- Handle form submission errors gracefully

ACCEPTANCE CRITERIA:
- ✅ Service type selection shows three clear options
- ✅ Google Places autocomplete works for all location fields
- ✅ Date/time picker enforces business rules and constraints
- ✅ Form adapts correctly to each service type
- ✅ Location validation prevents bookings outside service area
- ✅ Form auto-saves and restores from localStorage
- ✅ All components are mobile-responsive
- ✅ Distance calculation works between pickup/dropoff
- ✅ Saved locations feature works for returning users
- ✅ Form validation provides clear, helpful error messages

DESIGN REQUIREMENTS:
- Clean, modern interface following premium transportation standards
- Smooth animations between form steps
- Loading states for all API calls
- Consistent spacing and typography
- Accessible form controls with proper labels
- Error states that guide users to resolution

Focus on creating an intuitive booking experience that makes it easy for customers to quickly schedule their premium transportation service.
```

---

## Sprint 4: Pricing Engine & Quote System

### Claude Code Prompt for Sprint 4

```
This is Sprint 4 of Stable Ride. We're implementing the dynamic pricing engine and real-time quote system that calculates costs based on service type, distance, time, and various factors.

CONTEXT:
Users can now select service types and enter locations/times. We need to build a sophisticated pricing engine that provides instant, accurate quotes and handles various pricing scenarios.

PRICING STRUCTURE TO IMPLEMENT:

Base Pricing Model:
- One-Way: Base rate + ($X per mile) + time-based factors
- Roundtrip: One-way rate × 1.8 + wait time charges
- Hourly: Base hourly rate + overtime rates + mileage over limit

TASKS FOR THIS SPRINT:

1. PRICING ENGINE BACKEND:
   Create a flexible, configurable pricing system:

   ```typescript
   interface PricingConfig {
     oneWay: {
       baseRate: number;          // $25 base
       perMileRate: number;       // $2.50 per mile
       minimumFare: number;       // $35 minimum
       maximumDistance: number;   // 100 mile limit
     };
     roundtrip: {
       multiplier: number;        // 1.8x one-way rate
       waitTimeRate: number;      // $30/hour for wait time
       sameDayDiscount: number;   // 10% discount if return same day
     };
     hourly: {
       baseHourlyRate: number;    // $75/hour
       minimumHours: number;      // 2 hour minimum
       overtimeRate: number;      // $90/hour after 8 hours
       includedMiles: number;     // 30 miles per hour included
       excessMileRate: number;    // $1.50 per excess mile
     };
     surcharges: {
       airport: number;           // $15 airport pickup/dropoff
       lateNight: number;         // $20 between 10 PM - 6 AM
       holiday: number;           // $25 on holidays
       peakHours: number;         // $15 during rush hours
       tolls: 'included' | 'added' | 'estimated';
     };
     discounts: {
       corporateRate: number;     // 15% corporate discount
       loyaltyDiscount: number;   // 10% for returning customers
       advanceBooking: number;    // 5% for 48+ hours advance
     };
   }
   ```

   Implement pricing calculation service:
   - Distance calculation using Google Maps Distance Matrix
   - Peak hours detection (7-9 AM, 5-7 PM weekdays)
   - Holiday calendar integration
   - Airport location detection
   - Late night surcharge calculation
   - Tax calculation based on location
   - Tip/gratuity options (15%, 20%, 25%, custom)

2. QUOTE DISPLAY INTERFACE:
   Create detailed quote breakdown component:

   Quote Display Features:
   - Real-time price updates as user modifies details
   - Itemized cost breakdown with explanations
   - Quote validity timer (30 minutes)
   - Price comparison with estimated competitor rates
   - Clear total cost display
   - Tax breakdown
   - Gratuity options with recommendations

   Quote Components:
   ```typescript
   interface QuoteBreakdown {
     baseRate: number;
     distanceCharge: number;
     timeCharges: number;
     surcharges: Surcharge[];
     discounts: Discount[];
     subtotal: number;
     taxes: number;
     gratuity: number;
     total: number;
     validUntil: Date;
     bookingReference: string;
   }
   ```

3. DYNAMIC PRICING LOGIC:
   Implement advanced pricing scenarios:

   Distance-Based Pricing:
   - Use Google Maps for accurate distance/duration
   - Factor in traffic conditions for time-based charges
   - Apply different rates for highway vs city driving
   - Handle multi-stop trips for roundtrip service

   Time-Based Pricing:
   - Peak hour multipliers (configurable by time/day)
   - Late night surcharges (10 PM - 6 AM)
   - Holiday pricing (New Year, Christmas, etc.)
   - Weekend vs weekday rates
   - Special event pricing (configurable)

   Location-Based Pricing:
   - Airport pickup/dropoff surcharges
   - Service area boundary enforcement
   - City vs suburban rates
   - Toll road estimation and inclusion
   - Hotel/venue pickup fees

4. BOOKING CONFIGURATION SYSTEM:
   Create admin-configurable pricing rules:

   Configuration Interface (Backend):
   - Database-driven pricing configuration
   - A/B testing for pricing strategies
   - Seasonal pricing adjustments
   - Corporate rate management
   - Promotion code system
   - Dynamic surge pricing (future)

   Features to Implement:
   - Hot-swappable pricing without deployment
   - Pricing rule versioning and rollback
   - Geographic pricing zones
   - Customer segment pricing
   - Time-slot specific pricing

TECHNICAL IMPLEMENTATION:

Backend Services:
```
src/
├── services/
│   ├── pricingEngine.ts        # Core pricing calculations
│   ├── distanceService.ts      # Google Maps integration
│   ├── quoteService.ts         # Quote generation and management
│   ├── configService.ts        # Pricing configuration management
│   └── taxService.ts           # Tax calculation by location
├── models/
│   ├── PricingConfig.ts        # Pricing configuration schema
│   ├── Quote.ts                # Quote data model
│   └── Surcharge.ts            # Surcharge definitions
```

Frontend Components:
```
src/
├── components/
│   ├── booking/
│   │   ├── QuoteDisplay.tsx
│   │   ├── PriceBreakdown.tsx
│   │   ├── GratuitySelector.tsx
│   │   └── QuoteTimer.tsx
│   ├── pricing/
│   │   ├── PriceCalculator.tsx
│   │   ├── SurchargeExplainer.tsx
│   │   └── CompetitorComparison.tsx
```

API Endpoints:
```
POST /api/quotes/calculate          # Calculate quote for trip details
GET  /api/quotes/:id               # Retrieve existing quote
POST /api/quotes/:id/update        # Update quote with new details
POST /api/quotes/:id/lock          # Lock quote for booking
GET  /api/pricing/config           # Get current pricing configuration
POST /api/pricing/validate         # Validate pricing for booking
```

Database Schema:
```sql
CREATE TABLE pricing_configs (
    id SERIAL PRIMARY KEY,
    version VARCHAR(50) NOT NULL,
    config JSONB NOT NULL,
    effective_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT FALSE
);

CREATE TABLE quotes (
    id SERIAL PRIMARY KEY,
    booking_draft_id UUID,
    breakdown JSONB NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    valid_until TIMESTAMP NOT NULL,
    locked_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE surcharge_definitions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,  -- 'percentage', 'fixed', 'per_mile'
    value DECIMAL(10,2) NOT NULL,
    conditions JSONB,           -- Conditions for applying surcharge
    is_active BOOLEAN DEFAULT TRUE
);
```

Google Maps Integration:
- Distance Matrix API for accurate distance/time
- Places API for location validation
- Geocoding for address standardization
- Traffic model integration for time estimates
- Error handling for API failures
- Caching for common routes

Real-Time Features:
- WebSocket connection for live price updates
- Quote expiration warnings
- Price change notifications
- Live traffic impact on pricing
- Competitor price monitoring (future)

ACCEPTANCE CRITERIA:
- ✅ Quote calculations are accurate for all service types
- ✅ Real-time price updates work as user modifies trip details
- ✅ Itemized breakdown shows all charges clearly
- ✅ Airport and late-night surcharges apply correctly
- ✅ Peak hour pricing works based on time/day
- ✅ Quote validity timer counts down properly
- ✅ Gratuity options calculate correctly
- ✅ Tax calculations are accurate for service locations
- ✅ Price updates are debounced to avoid excessive API calls
- ✅ Error handling works when pricing service fails

BUSINESS LOGIC VALIDATION:
- Minimum fare enforcement
- Maximum distance limitations
- Service area boundary checks
- Peak hour definition accuracy
- Holiday calendar integration
- Corporate discount application
- Loyalty program pricing

Focus on creating a transparent, fair pricing system that builds customer trust while ensuring business profitability. The pricing should be competitive with premium transportation services while reflecting the high-quality service provided.
```

---

## Sprint 5: Payment Integration

### Claude Code Prompt for Sprint 5

```
This is Sprint 5 of Stable Ride. We're implementing secure payment processing with Stripe integration, handling the complete payment lifecycle from collection to confirmation.

CONTEXT:
Users can now get accurate quotes for their trips. We need to implement secure payment processing that handles credit cards, saves payment methods, and manages the complete payment workflow.

PAYMENT REQUIREMENTS:
- PCI DSS compliant payment processing
- Support for major credit/debit cards
- Secure payment method storage for returning customers
- Payment confirmation and receipt generation
- Refund processing capabilities
- Failed payment handling and retry logic

TASKS FOR THIS SPRINT:

1. STRIPE INTEGRATION SETUP:
   Backend Stripe Configuration:
   ```typescript
   interface StripeConfig {
     publishableKey: string;
     secretKey: string;
     webhookSecret: string;
     currency: 'usd';
     paymentMethods: ['card'];
     captureMethod: 'automatic' | 'manual';
   }
   ```

   Implement Stripe Services:
   - Customer creation and management
   - Payment Intent creation and confirmation
   - Payment Method storage and retrieval
   - Webhook handling for payment events
   - Refund processing
   - Failed payment management

   Security Measures:
   - API key management (environment variables)
   - Webhook signature verification
   - Rate limiting for payment endpoints
   - Audit logging for all payment events
   - Idempotency key handling

2. PAYMENT FORM INTERFACE:
   Create secure, user-friendly payment form:

   Stripe Elements Integration:
   - Card Element with real-time validation
   - Separate fields for card number, expiry, CVC
   - Postal code collection for AVS verification
   - Card brand detection and display
   - Error handling and user feedback

   Payment Form Features:
   ```typescript
   interface PaymentForm {
     savedPaymentMethods: PaymentMethod[];
     newPaymentMethod: {
       cardElement: StripeCardElement;
       billingDetails: BillingDetails;
       saveForFuture: boolean;
     };
     selectedMethod: string;
     processing: boolean;
   }
   ```

   User Experience Features:
   - Saved payment methods with last 4 digits
   - Default payment method selection
   - Add new payment method option
   - Secure card tokenization
   - Loading states during processing
   - Success/error feedback
   - Mobile-optimized input fields

3. PAYMENT CONFIRMATION & RECEIPTS:
   Implement complete payment confirmation flow:

   Payment Confirmation Features:
   - Real-time payment status updates
   - Payment success confirmation page
   - Booking confirmation integration
   - Automatic receipt generation
   - Email receipt delivery
   - Payment failure handling with retry options

   Receipt Generation:
   ```typescript
   interface PaymentReceipt {
     receiptId: string;
     bookingReference: string;
     paymentDate: Date;
     paymentMethod: string;  // "•••• 4242"
     itemizedCharges: ChargeItem[];
     subtotal: number;
     taxes: number;
     gratuity: number;
     total: number;
     refundPolicy: string;
   }
   ```

   Email Receipt Template:
   - Professional receipt template
   - Company branding and contact info
   - Itemized service breakdown
   - Payment method used
   - Refund policy information
   - Customer service contact details

4. PAYMENT MANAGEMENT SYSTEM:
   Backend payment processing logic:

   Payment Intent Management:
   - Create payment intents with metadata
   - Handle 3D Secure authentication
   - Process payment confirmations
   - Manage payment status updates
   - Handle payment method failures

   Customer Payment Methods:
   - Securely store payment methods with Stripe
   - Allow customers to add/remove payment methods
   - Set default payment methods
   - Handle expired card updates
   - Payment method verification

   Refund Processing:
   - Full and partial refund capabilities
   - Automated refund for cancellations
   - Refund notification system
   - Refund status tracking
   - Dispute management preparation

TECHNICAL IMPLEMENTATION:

Backend Services:
```
src/
├── services/
│   ├── stripeService.ts        # Core Stripe integration
│   ├── paymentService.ts       # Payment processing logic
│   ├── receiptService.ts       # Receipt generation
│   ├── refundService.ts        # Refund processing
│   └── webhookService.ts       # Stripe webhook handling
├── models/
│   ├── Payment.ts              # Payment data model
│   ├── PaymentMethod.ts        # Payment method model
│   └── Receipt.ts              # Receipt model
├── middleware/
│   ├── stripeWebhook.ts        # Webhook verification
│   └── paymentValidation.ts    # Payment validation
```

Frontend Components:
```
src/
├── components/
│   ├── payment/
│   │   ├── PaymentForm.tsx
│   │   ├── PaymentMethodSelector.tsx
│   │   ├── AddPaymentMethod.tsx
│   │   ├── PaymentConfirmation.tsx
│   │   └── PaymentStatus.tsx
│   ├── billing/
│   │   ├── ReceiptDisplay.tsx
│   │   ├── PaymentHistory.tsx
│   │   └── RefundStatus.tsx
├── hooks/
│   ├── useStripe.ts
│   ├── usePayment.ts
│   └── usePaymentMethods.ts
```

API Endpoints:
```
POST /api/payments/intent          # Create payment intent
POST /api/payments/confirm         # Confirm payment
GET  /api/payments/:id            # Get payment details
POST /api/payments/:id/refund     # Process refund
GET  /api/payment-methods/user/:id # Get user's payment methods
POST /api/payment-methods         # Add new payment method
DELETE /api/payment-methods/:id   # Remove payment method
POST /api/webhooks/stripe         # Stripe webhook endpoint
```

Database Schema:
```sql
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    booking_id UUID NOT NULL,
    stripe_payment_intent_id VARCHAR(255) NOT NULL,
    stripe_customer_id VARCHAR(255),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(50) NOT NULL,
    payment_method_id VARCHAR(255),
    receipt_url TEXT,
    failure_reason TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE payment_methods (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    stripe_payment_method_id VARCHAR(255) NOT NULL,
    card_brand VARCHAR(20),
    card_last4 VARCHAR(4),
    card_exp_month INTEGER,
    card_exp_year INTEGER,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE receipts (
    id SERIAL PRIMARY KEY,
    payment_id INTEGER REFERENCES payments(id),
    receipt_number VARCHAR(50) UNIQUE NOT NULL,
    receipt_data JSONB NOT NULL,
    email_sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);
```

Stripe Configuration:
```typescript
// Stripe service configuration
const stripeConfig = {
  apiVersion: '2023-10-16',
  typescript: true,
  maxNetworkRetries: 3,
  timeout: 20000,
  appInfo: {
    name: 'Stable Ride',
    version: '1.0.0',
    url: 'https://stableride.com'
  }
};
```

Security Implementation:
- Environment-based API key management
- Webhook signature verification
- PCI DSS compliance measures
- Rate limiting on payment endpoints
- Audit logging for all payment operations
- Secure error handling (no sensitive data in logs)

Error Handling:
- Payment declined scenarios
- Network failure recovery
- Invalid payment method handling
- Expired payment method updates
- 3D Secure authentication flows
- Webhook delivery failures

ACCEPTANCE CRITERIA:
- ✅ Credit card form validates and processes payments securely
- ✅ Saved payment methods work for returning customers
- ✅ Payment confirmation page shows correct details
- ✅ Email receipts are sent automatically
- ✅ Failed payments provide clear error messages
- ✅ Refund processing works for cancellations
- ✅ Payment methods can be added/removed by users
- ✅ All payment data is PCI DSS compliant
- ✅ Webhook handling processes Stripe events correctly
- ✅ Mobile payment form is optimized for touch devices

TESTING REQUIREMENTS:
- Test with Stripe test cards for various scenarios
- Verify webhook delivery and processing
- Test payment failures and recovery
- Validate receipt generation and email delivery
- Test refund processing end-to-end
- Verify payment method management
- Test 3D Secure authentication flows

Focus on creating a secure, trustworthy payment experience that makes customers feel confident about providing their payment information. The payment flow should be smooth and professional, matching the premium nature of the transportation service.
```

---

## Sprint 6: Trip Enhancements & Additional Services

### Claude Code Prompt for Sprint 6

```
This is Sprint 6 of Stable Ride. We're adding premium service enhancements and customization options that differentiate our service and provide additional value to customers.

CONTEXT:
The core booking and payment flow is complete. Now we're adding premium touches and optional services that enhance the customer experience and create additional revenue streams.

SERVICE ENHANCEMENTS TO IMPLEMENT:
1. Trip Protection - Cancellation insurance
2. Luggage Assistance - Meet & greet service
3. Flight Information Integration - Flight tracking and delays
4. Special Requests - Custom accommodations
5. Vehicle Preferences - Luxury options
6. Child Safety - Car seat options

TASKS FOR THIS SPRINT:

1. TRIP PROTECTION SERVICE:
   Implement trip protection option:

   ```typescript
   interface TripProtection {
     enabled: boolean;
     cost: number;              // $9 flat fee
     coverage: {
       cancellationReasons: string[];
       refundPercentage: number;
       timeLimits: {
         fullRefund: number;    // 1 hour before pickup
         partialRefund: number; // 30 minutes before pickup
       };
     };
     termsAndConditions: string;
   }
   ```

   Features to Implement:
   - Trip protection toggle in booking flow
   - Cost calculation and display
   - Protection terms modal/popup
   - Integration with cancellation policy
   - Claims process preparation (future)
   - Email confirmation of protection coverage

2. LUGGAGE ASSISTANCE OPTIONS:
   Add premium luggage and meet & greet services:

   ```typescript
   interface LuggageServices {
     meetAndGreet: {
       enabled: boolean;
       cost: number;            // $15 fee
       description: string;
       includes: string[];      // ["Driver will meet you at arrival", "Assistance with luggage", "Direct escort to vehicle"]
     };
     extraLuggage: {
       enabled: boolean;
       threshold: number;       // More than 2 large bags
       costPerBag: number;      // $5 per additional bag
     };
     specialHandling: {
       enabled: boolean;
       options: SpecialHandlingOption[];
     };
   }

   interface SpecialHandlingOption {
     type: 'golf_clubs' | 'ski_equipment' | 'musical_instruments' | 'fragile_items';
     cost: number;
     requirements: string;
   }
   ```

   Implementation Features:
   - Luggage assistance checkbox with pricing
   - Meet & greet service explanation
   - Special handling options selection
   - Additional instructions field
   - Cost calculation integration
   - Service confirmation in booking details

3. FLIGHT INFORMATION INTEGRATION:
   Add comprehensive flight tracking capabilities:

   ```typescript
   interface FlightInformation {
     airline: string;
     flightNumber: string;
     departureAirport: string;
     arrivalAirport: string;
     scheduledArrival: Date;
     actualArrival?: Date;
     flightStatus: 'on-time' | 'delayed' | 'cancelled' | 'landed';
     terminal?: string;
     gate?: string;
     baggageClaim?: string;
   }
   ```

   Features to Implement:
   - Airline dropdown with major carriers
   - Flight number validation
   - Basic flight status display (prepare for API integration)
   - Automatic pickup time adjustment suggestions
   - Flight delay notification system
   - Terminal and gate information collection
   - Baggage claim area specification

   Flight Integration Preparation:
   - Database schema for flight information
   - API endpoint structure for flight updates
   - Notification system for flight changes
   - Pickup time recalculation logic

4. SPECIAL REQUESTS & CUSTOMIZATION:
   Implement comprehensive customization options:

   ```typescript
   interface SpecialRequests {
     vehiclePreferences: {
       type: 'luxury_sedan' | 'suv' | 'executive' | 'eco_friendly';
       features: string[];      // ['leather_seats', 'wifi', 'phone_charger', 'water']
       accessibility: AccessibilityOption[];
     };
     childSafety: {
       infantSeat: boolean;     // 0-12 months
       toddlerSeat: boolean;    // 1-3 years
       boosterSeat: boolean;    // 4-8 years
       quantity: number;
     };
     customRequests: {
       temperature: 'cool' | 'comfortable' | 'warm';
       music: 'none' | 'soft' | 'customer_playlist';
       refreshments: boolean;
       newspapers: string[];
       stops: AdditionalStop[];
     };
     businessNeeds: {
       wifiRequired: boolean;
       quietRide: boolean;
       workingSurface: boolean;
       phoneConference: boolean;
     };
   }
   ```

   Implementation Features:
   - Vehicle preference selection with images
   - Child seat options with age guidelines
   - Custom temperature and music preferences
   - Additional stop management
   - Business traveler accommodations
   - Special occasion options (flowers, champagne)
   - Accessibility requirements form

TECHNICAL IMPLEMENTATION:

Backend Services:
```
src/
├── services/
│   ├── tripEnhancementService.ts   # Trip protection logic
│   ├── luggageService.ts           # Luggage assistance management
│   ├── flightService.ts            # Flight information handling
│   ├── customizationService.ts     # Special requests processing
│   └── vehicleService.ts           # Vehicle preference management
├── models/
│   ├── TripEnhancement.ts          # Enhancement options model
│   ├── FlightInfo.ts               # Flight information model
│   ├── SpecialRequest.ts           # Custom requests model
│   └── VehiclePreference.ts        # Vehicle options model
```

Frontend Components:
```
src/
├── components/
│   ├── enhancements/
│   │   ├── TripProtectionOption.tsx
│   │   ├── LuggageAssistance.tsx
│   │   ├── FlightInformation.tsx
│   │   ├── SpecialRequests.tsx
│   │   └── VehicleSelector.tsx
│   ├── customization/
│   │   ├── ChildSeatOptions.tsx
│   │   ├── AccessibilityOptions.tsx
│   │   ├── BusinessTraveler.tsx
│   │   └── AdditionalStops.tsx
├── forms/
│   ├── EnhancementForm.tsx
│   └── CustomizationForm.tsx
```

Database Schema Updates:
```sql
CREATE TABLE trip_enhancements (
    id SERIAL PRIMARY KEY,
    booking_id UUID NOT NULL,
    trip_protection BOOLEAN DEFAULT FALSE,
    meet_and_greet BOOLEAN DEFAULT FALSE,
    luggage_assistance JSONB,
    flight_info JSONB,
    special_requests JSONB,
    vehicle_preferences JSONB,
    total_enhancement_cost DECIMAL(8,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE vehicle_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    features JSONB,
    base_price_multiplier DECIMAL(3,2) DEFAULT 1.00,
    image_url TEXT,
    is_available BOOLEAN DEFAULT TRUE
);

CREATE TABLE enhancement_options (
    id SERIAL PRIMARY KEY,
    category VARCHAR(50) NOT NULL,  -- 'protection', 'luggage', 'vehicle', 'child_safety'
    name VARCHAR(100) NOT NULL,
    description TEXT,
    cost DECIMAL(8,2),
    is_active BOOLEAN DEFAULT TRUE,
    configuration JSONB
);
```

API Endpoints:
```
GET  /api/enhancements/options         # Get available enhancement options
POST /api/enhancements/calculate       # Calculate enhancement costs
POST /api/bookings/:id/enhancements    # Add enhancements to booking
PUT  /api/bookings/:id/enhancements    # Update booking enhancements
GET  /api/vehicles/types               # Get available vehicle types
POST /api/flights/validate             # Validate flight information
GET  /api/flights/:flightNumber/status # Get flight status (future)
```

Form Integration:
- Multi-step enhancement selection
- Real-time cost calculation updates
- Enhancement summary display
- Optional vs required enhancement handling
- Enhancement removal and modification
- Mobile-optimized selection interface

Enhancement Logic:
```typescript
class EnhancementCalculator {
  calculateTripProtection(bookingAmount: number): number {
    return 9.00; // Flat fee
  }

  calculateLuggageAssistance(options: LuggageOptions): number {
    let cost = 0;
    if (options.meetAndGreet) cost += 15;
    if (options.extraBags > 2) cost += (options.extraBags - 2) * 5;
    if (options.specialHandling.length > 0) cost += options.specialHandling.length * 10;
    return cost;
  }

  calculateChildSeats(seats: ChildSeatRequest[]): number {
    return seats.length * 15; // $15 per seat
  }

  calculateVehicleUpgrade(baseVehicle: string, preferredVehicle: string): number {
    const upgradePricing = {
      'standard_to_luxury': 25,
      'standard_to_suv': 15,
      'luxury_to_executive': 35
    };
    return upgradePricing[`${baseVehicle}_to_${preferredVehicle}`] || 0;
  }
}
```

User Experience Features:
- Enhancement recommendation engine
- Popular enhancement suggestions
- Enhancement impact on total price
- Enhancement confirmation summaries
- Easy enhancement modification
- Enhancement-specific terms and conditions

ACCEPTANCE CRITERIA:
- ✅ Trip protection option toggles correctly with $9 fee
- ✅ Luggage assistance options calculate costs properly
- ✅ Flight information form validates airline and flight number
- ✅ Vehicle preference selection shows available options
- ✅ Child seat options calculate correct quantities and costs
- ✅ Special requests form accepts custom instructions
- ✅ All enhancements integrate with total price calculation
- ✅ Enhancement selections persist through booking flow
- ✅ Enhancement summary displays clearly before payment
- ✅ Mobile interface works well for all enhancement options

QUALITY ASSURANCE:
- Test all enhancement combinations
- Verify cost calculations are accurate
- Test enhancement removal and modification
- Validate form submissions with various enhancement selections
- Test mobile responsiveness for all enhancement forms
- Verify enhancement data persists correctly

Focus on creating premium enhancement options that add real value to the customer experience while generating additional revenue. Each enhancement should be clearly explained with transparent pricing and obvious benefits.
```

---

## Sprint 7: Booking Management & Notifications

### Claude Code Prompt for Sprint 7

```
This is Sprint 7 of Stable Ride. We're implementing the complete booking lifecycle management with confirmation, modification, cancellation, and notification systems.

CONTEXT:
Customers can now book rides with payments and enhancements. We need to build the systems that manage bookings after they're created, handle changes, and keep everyone informed throughout the process.

BOOKING LIFECYCLE TO IMPLEMENT:
1. Booking Confirmation - Generate confirmations and send notifications
2. Booking Modifications - Allow changes with business rules
3. Booking Cancellations - Handle cancellations and refunds
4. User Dashboard - Manage all bookings in one place
5. Notification System - Email/SMS for all booking events

TASKS FOR THIS SPRINT:

1. BOOKING CONFIRMATION SYSTEM:
   Implement comprehensive booking confirmation workflow:

   ```typescript
   interface BookingConfirmation {
     bookingReference: string;      // "SR-2024-001234"
     confirmationNumber: string;    // "STABLE123"
     status: 'confirmed' | 'pending' | 'cancelled';
     customerDetails: CustomerInfo;
     serviceDetails: ServiceSummary;
     enhancementDetails: EnhancementSummary;
     paymentDetails: PaymentSummary;
     driverDetails?: DriverInfo;    // Assigned later
     estimatedArrival?: Date;       // Driver ETA
     confirmationSent: Date;
     modificationDeadline: Date;    // 2 hours before pickup
   }
   ```

   Confirmation Features:
   - Unique booking reference generation
   - Confirmation email with all details
   - SMS confirmation option
   - Calendar invite (ICS file) generation
   - PDF confirmation receipt
   - WhatsApp integration (future)
   - Social media sharing options

   Confirmation Email Template:
   - Professional email design with branding
   - Complete trip details summary
   - Driver contact information (when assigned)
   - Modification and cancellation instructions
   - Customer service contact details
   - Terms and conditions link

2. BOOKING MODIFICATION SYSTEM:
   Allow customers to modify bookings with business rules:

   ```typescript
   interface BookingModification {
     originalBooking: Booking;
     proposedChanges: BookingChanges;
     priceDifference: number;
     modificationFee: number;
     newConfirmationRequired: boolean;
     modificationDeadline: Date;
     reasonCode?: string;
   }

   interface BookingChanges {
     dateTime?: {
       newPickupTime: Date;
       newReturnTime?: Date;
     };
     locations?: {
       newPickupAddress?: string;
       newDropoffAddress?: string;
     };
     serviceType?: {
       from: ServiceType;
       to: ServiceType;
     };
     enhancements?: {
       added: Enhancement[];
       removed: Enhancement[];
     };
     passengerCount?: number;
   }
   ```

   Modification Business Rules:
   - Allow modifications up to 2 hours before pickup
   - Calculate price differences for changes
   - Apply modification fees for major changes
   - Require payment for upgrade differences
   - Process refunds for downgrade differences
   - Block modifications for certain service types
   - Emergency modification override (admin only)

   Modification Interface:
   - Easy-to-use modification form
   - Real-time price calculation updates
   - Clear explanation of modification fees
   - Confirmation before applying changes
   - Payment processing for price increases
   - Email confirmation of modifications

3. BOOKING CANCELLATION & REFUND SYSTEM:
   Implement flexible cancellation with refund processing:

   ```typescript
   interface CancellationPolicy {
     timeframes: {
       fullRefund: number;        // 24 hours before = 100% refund
       partialRefund: number;     // 2 hours before = 50% refund
       noRefund: number;          // Less than 2 hours = 0% refund
     };
     tripProtectionOverride: boolean;  // Trip protection changes policy
     emergencyExceptions: string[];
     cancellationFees: {
       standard: number;          // $10 standard cancellation fee
       lastMinute: number;        // $25 last-minute cancellation fee
     };
   }
   ```

   Cancellation Features:
   - Customer-initiated cancellation form
   - Automatic refund calculation
   - Cancellation reason collection
   - Trip protection claim processing
   - Refund processing through Stripe
   - Cancellation confirmation email
   - Feedback collection for cancellations

   Refund Processing:
   - Automatic refund calculation based on policy
   - Integration with Stripe refund API
   - Refund status tracking
   - Refund notification emails
   - Manual refund override (admin)
   - Refund reporting and analytics

4. USER DASHBOARD & BOOKING HISTORY:
   Create comprehensive user account dashboard:

   ```typescript
   interface UserDashboard {
     upcomingBookings: Booking[];
     bookingHistory: BookingHistoryItem[];
     savedLocations: SavedLocation[];
     paymentMethods: PaymentMethod[];
     preferences: UserPreferences;
     loyaltyStatus: LoyaltyInfo;
     quickActions: QuickAction[];
   }

   interface BookingHistoryItem {
     bookingReference: string;
     date: Date;
     serviceType: string;
     route: string;
     amount: number;
     status: string;
     rating?: number;
     canRebook: boolean;
     canReview: boolean;
   }
   ```

   Dashboard Features:
   - Upcoming bookings with countdown timers
   - Booking history with search and filtering
   - Quick re-book functionality
   - Favorite locations management
   - Payment methods management
   - Account settings and preferences
   - Loyalty program status
   - Download receipts and confirmations

   Quick Actions:
   - Book again with same details
   - Modify upcoming booking
   - Cancel booking
   - Contact driver (when available)
   - Rate and review completed trip
   - Download receipt/confirmation

5. NOTIFICATION SYSTEM:
   Implement comprehensive notification system:

   ```typescript
   interface NotificationSystem {
     email: {
       templates: EmailTemplate[];
       providers: ['sendgrid', 'ses'];
       tracking: boolean;
     };
     sms: {
       provider: 'twilio';
       shortCodes: boolean;
       internationalSupport: boolean;
     };
     push: {
       webPush: boolean;
       mobilePush: boolean;     // Future mobile app
     };
     preferences: {
       userControlled: boolean;
       optOut: boolean;
       frequency: 'all' | 'important' | 'minimal';
     };
   }
   ```

   Notification Events:
   - Booking confirmation
   - Booking modification confirmation
   - Cancellation confirmation
   - Driver assignment notification
   - Driver en-route notification (future)
   - Pickup reminder (30 minutes before)
   - Trip completion confirmation
   - Payment receipt
   - Refund processing notification

TECHNICAL IMPLEMENTATION:

Backend Services:
```
src/
├── services/
│   ├── bookingConfirmationService.ts  # Confirmation generation
│   ├── bookingModificationService.ts  # Modification logic
│   ├── cancellationService.ts         # Cancellation and refunds
│   ├── notificationService.ts         # Email/SMS notifications
│   ├── calendarService.ts             # Calendar invite generation
│   └── dashboardService.ts            # User dashboard data
├── models/
│   ├── BookingConfirmation.ts
│   ├── BookingModification.ts
│   ├── CancellationPolicy.ts
│   └── NotificationTemplate.ts
├── jobs/
│   ├── notificationQueue.ts           # Background notification processing
│   ├── reminderScheduler.ts           # Automated reminders
│   └── refundProcessor.ts             # Automated refund processing
```

Frontend Components:
```
src/
├── components/
│   ├── dashboard/
│   │   ├── UserDashboard.tsx
│   │   ├── UpcomingBookings.tsx
│   │   ├── BookingHistory.tsx
│   │   ├── QuickActions.tsx
│   │   └── AccountSettings.tsx
│   ├── booking/
│   │   ├── BookingConfirmation.tsx
│   │   ├── ModifyBooking.tsx
│   │   ├── CancelBooking.tsx
│   │   └── BookingDetails.tsx
│   ├── notifications/
│   │   ├── NotificationCenter.tsx
│   │   ├── NotificationPreferences.tsx
│   │   └── NotificationHistory.tsx
```

Database Schema Updates:
```sql
CREATE TABLE booking_modifications (
    id SERIAL PRIMARY KEY,
    booking_id UUID NOT NULL,
    modification_type VARCHAR(50) NOT NULL,
    original_data JSONB NOT NULL,
    new_data JSONB NOT NULL,
    price_difference DECIMAL(8,2),
    modification_fee DECIMAL(8,2),
    modified_by UUID NOT NULL,
    reason TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE cancellations (
    id SERIAL PRIMARY KEY,
    booking_id UUID NOT NULL,
    cancelled_by UUID NOT NULL,
    cancellation_reason VARCHAR(255),
    refund_amount DECIMAL(8,2),
    refund_status VARCHAR(50),
    refund_processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    booking_id UUID,
    type VARCHAR(50) NOT NULL,
    channel VARCHAR(20) NOT NULL,  -- 'email', 'sms', 'push'
    template_id VARCHAR(100),
    recipient VARCHAR(255) NOT NULL,
    subject VARCHAR(255),
    content TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE notification_preferences (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    email_enabled BOOLEAN DEFAULT TRUE,
    sms_enabled BOOLEAN DEFAULT TRUE,
    marketing_emails BOOLEAN DEFAULT FALSE,
    reminder_frequency VARCHAR(20) DEFAULT 'normal',
    updated_at TIMESTAMP DEFAULT NOW()
);
```

API Endpoints:
```
POST /api/bookings/:id/confirm         # Confirm booking
POST /api/bookings/:id/modify          # Modify booking
POST /api/bookings/:id/cancel          # Cancel booking
GET  /api/bookings/user/:id            # User's bookings
GET  /api/bookings/:id/modifications   # Booking modification history
POST /api/bookings/:id/rebook          # Rebook with same details
GET  /api/dashboard/user/:id           # User dashboard data
POST /api/notifications/send           # Send notification
GET  /api/notifications/preferences    # Get notification preferences
PUT  /api/notifications/preferences    # Update notification preferences
```

Notification Templates:
```typescript
const emailTemplates = {
  bookingConfirmation: {
    subject: 'Booking Confirmed - {{bookingReference}}',
    template: 'booking-confirmation',
    variables: ['customerName', 'bookingDetails', 'driverInfo']
  },
  bookingModified: {
    subject: 'Booking Modified - {{bookingReference}}',
    template: 'booking-modification',
    variables: ['customerName', 'changes', 'newTotal']
  },
  bookingCancelled: {
    subject: 'Booking Cancelled - {{bookingReference}}',
    template: 'booking-cancellation',
    variables: ['customerName', 'refundAmount', 'refundTimeline']
  },
  pickupReminder: {
    subject: 'Pickup Reminder - {{serviceName}} in 30 minutes',
    template: 'pickup-reminder',
    variables: ['customerName', 'pickupTime', 'driverInfo']
  }
};
```

Background Jobs:
```typescript
// Schedule reminder notifications
class NotificationScheduler {
  schedulePickupReminder(booking: Booking) {
    const reminderTime = new Date(booking.pickupTime.getTime() - 30 * 60 * 1000); // 30 minutes before
    scheduleJob(reminderTime, 'sendPickupReminder', { bookingId: booking.id });
  }

  scheduleFollowUpEmail(booking: Booking) {
    const followUpTime = new Date(booking.completedAt.getTime() + 2 * 60 * 60 * 1000); // 2 hours after
    scheduleJob(followUpTime, 'sendFollowUpEmail', { bookingId: booking.id });
  }
}
```

ACCEPTANCE CRITERIA:
- ✅ Booking confirmations are sent immediately after payment
- ✅ Calendar invites (ICS files) are generated and attached
- ✅ Booking modifications work with proper price calculations
- ✅ Cancellations process refunds according to policy
- ✅ User dashboard shows all bookings and history
- ✅ SMS and email notifications are sent for all events
- ✅ Notification preferences can be managed by users
- ✅ Quick re-booking works from booking history
- ✅ Modification deadlines are enforced properly
- ✅ Refund processing works through Stripe integration

BUSINESS RULES VALIDATION:
- 2-hour modification deadline enforcement
- Cancellation policy refund calculations
- Trip protection impact on cancellations
- Modification fee application
- Emergency override capabilities
- Notification opt-out respect

Focus on creating a seamless post-booking experience that keeps customers informed and makes it easy to manage their transportation needs. The system should handle the majority of booking changes automatically while providing clear communication throughout the process.
```

---

---

## Sprint 8: Admin Panel Foundation

### Claude Code Prompt for Sprint 8

```
This is Sprint 8 of Stable Ride. We're building the comprehensive admin backend panel that gives business owners complete control over their transportation service operations.

CONTEXT:
The customer-facing application is 95% complete with full booking, payment, and management capabilities. Now we need to build the business management interface that allows admin users to monitor, configure, and manage all aspects of the Stable Ride operation.

ADMIN PANEL REQUIREMENTS:
- Separate admin interface with role-based access control
- Real-time business dashboard with key metrics
- Complete booking management system
- Customer management and communication tools
- Financial reporting and payment management
- System configuration and pricing control

TASKS FOR THIS SPRINT:

1. ADMIN AUTHENTICATION & RBAC SYSTEM:
   Implement secure admin authentication with role-based access:

   ```typescript
   interface AdminUser {
     id: string;
     email: string;
     firstName: string;
     lastName: string;
     role: AdminRole;
     permissions: Permission[];
     lastLogin: Date;
     isActive: boolean;
     createdAt: Date;
   }

   type AdminRole = 'super_admin' | 'operations_manager' | 'finance_manager' | 'customer_service';

   interface Permission {
     resource: string;        // 'bookings', 'customers', 'payments', 'settings'
     actions: string[];       // ['read', 'write', 'delete', 'export']
   }
   ```

   Authentication Features:
   - Separate admin login page (/admin/login)
   - Multi-factor authentication (MFA) support
   - Session management with auto-logout
   - Role-based route protection
   - Admin user management (super admin only)
   - Security audit logging
   - Password complexity requirements
   - Account lockout after failed attempts

2. REAL-TIME BUSINESS DASHBOARD:
   Create comprehensive business intelligence dashboard:

   ```typescript
   interface DashboardMetrics {
     realTime: {
       activeBookings: number;
       todayBookings: number;
       todayRevenue: number;
       onlineCustomers: number;
     };
     performance: {
       weeklyRevenue: number[];
       monthlyBookings: number[];
       customerSatisfaction: number;
       averageBookingValue: number;
     };
     operational: {
       pendingBookings: Booking[];
       upcomingPickups: Booking[];
       recentCancellations: Booking[];
       systemAlerts: Alert[];
     };
   }
   ```

   Dashboard Components:
   - Real-time metrics with auto-refresh (every 30 seconds)
   - Revenue charts (daily, weekly, monthly trends)
   - Booking volume analytics
   - Geographic heat map of service requests
   - Peak hours analysis
   - Customer acquisition metrics
   - Service type popularity charts
   - Recent activity feed

3. COMPREHENSIVE BOOKING MANAGEMENT:
   Build advanced booking management interface:

   ```typescript
   interface AdminBookingView {
     search: {
       dateRange: [Date, Date];
       status: BookingStatus[];
       serviceType: ServiceType[];
       customerEmail: string;
       bookingReference: string;
       amountRange: [number, number];
     };
     filters: {
       showCancelled: boolean;
       showModified: boolean;
       showRefunded: boolean;
       sortBy: 'date' | 'amount' | 'status' | 'customer';
       sortOrder: 'asc' | 'desc';
     };
     actions: {
       bulkExport: boolean;
       bulkStatusUpdate: boolean;
       bulkCommunication: boolean;
     };
   }
   ```

   Booking Management Features:
   - Advanced search and filtering
   - Bulk operations (export, status updates)
   - Booking timeline and history
   - Customer communication tools
   - Booking modification from admin side
   - Cancellation and refund processing
   - Emergency rebooking capabilities
   - Driver assignment (future-ready)
   - Route optimization suggestions

4. CUSTOMER MANAGEMENT SYSTEM:
   Implement 360-degree customer management:

   ```typescript
   interface AdminCustomerView {
     profile: {
       personalInfo: CustomerPersonalInfo;
       contactHistory: Communication[];
       bookingStats: CustomerBookingStats;
       paymentMethods: PaymentMethodSummary[];
       preferences: CustomerPreferences;
       notes: AdminNote[];
     };
     segmentation: {
       customerType: 'new' | 'regular' | 'vip' | 'corporate';
       lifetimeValue: number;
       riskScore: number;
       loyaltyStatus: string;
     };
     communications: {
       emailHistory: EmailRecord[];
       smsHistory: SmsRecord[];
       supportTickets: SupportTicket[];
     };
   }
   ```

   Customer Management Features:
   - Complete customer profiles with booking history
   - Customer segmentation and tagging
   - Communication history tracking
   - Customer support ticket system
   - Automated customer journey tracking
   - Customer value analytics
   - Bulk customer communication
   - Customer feedback and ratings management

TECHNICAL IMPLEMENTATION:

Admin Frontend Structure:
```
src/admin/
├── components/
│   ├── auth/
│   │   ├── AdminLogin.tsx
│   │   ├── MFASetup.tsx
│   │   └── RoleGuard.tsx
│   ├── dashboard/
│   │   ├── AdminDashboard.tsx
│   │   ├── MetricsCards.tsx
│   │   ├── RevenueChart.tsx
│   │   ├── BookingChart.tsx
│   │   └── ActivityFeed.tsx
│   ├── bookings/
│   │   ├── BookingManagement.tsx
│   │   ├── BookingSearch.tsx
│   │   ├── BookingTable.tsx
│   │   ├── BookingDetails.tsx
│   │   └── BulkActions.tsx
│   ├── customers/
│   │   ├── CustomerManagement.tsx
│   │   ├── CustomerProfile.tsx
│   │   ├── CustomerSearch.tsx
│   │   └── CustomerCommunication.tsx
│   ├── layout/
│   │   ├── AdminLayout.tsx
│   │   ├── AdminSidebar.tsx
│   │   ├── AdminHeader.tsx
│   │   └── AdminNavigation.tsx
├── hooks/
│   ├── useAdminAuth.ts
│   ├── useDashboardMetrics.ts
│   ├── useBookingManagement.ts
│   └── useCustomerManagement.ts
├── services/
│   ├── adminAuthService.ts
│   ├── dashboardService.ts
│   ├── bookingManagementService.ts
│   └── customerManagementService.ts
```

Backend Admin Services:
```
src/admin/
├── services/
│   ├── adminAuthService.ts         # Admin authentication
│   ├── dashboardMetricsService.ts  # Real-time metrics
│   ├── bookingAdminService.ts      # Booking management
│   ├── customerAdminService.ts     # Customer management
│   ├── auditLogService.ts          # Security auditing
│   └── permissionService.ts        # Role/permission management
├── middleware/
│   ├── adminAuth.ts                # Admin authentication middleware
│   ├── roleGuard.ts                # Role-based access control
│   └── auditLogger.ts              # Audit logging middleware
├── controllers/
│   ├── adminDashboardController.ts
│   ├── adminBookingController.ts
│   ├── adminCustomerController.ts
│   └── adminConfigController.ts
```

Database Schema for Admin:
```sql
CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL,
    permissions JSONB DEFAULT '[]',
    mfa_enabled BOOLEAN DEFAULT FALSE,
    mfa_secret VARCHAR(255),
    last_login TIMESTAMP,
    failed_login_attempts INTEGER DEFAULT 0,
    account_locked_until TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES admin_users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE admin_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID NOT NULL REFERENCES admin_users(id),
    session_token VARCHAR(255) UNIQUE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    admin_user_id UUID REFERENCES admin_users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id VARCHAR(255),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE customer_notes (
    id SERIAL PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES users(id),
    admin_user_id UUID NOT NULL REFERENCES admin_users(id),
    note_type VARCHAR(50) NOT NULL,  -- 'general', 'support', 'billing', 'complaint'
    content TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);
```

API Endpoints for Admin:
```
-- Authentication
POST /api/admin/auth/login          # Admin login
POST /api/admin/auth/mfa/verify     # MFA verification
POST /api/admin/auth/logout         # Admin logout
GET  /api/admin/auth/me             # Current admin user

-- Dashboard
GET  /api/admin/dashboard/metrics   # Real-time metrics
GET  /api/admin/dashboard/charts    # Chart data
GET  /api/admin/dashboard/activity  # Recent activity

-- Booking Management
GET  /api/admin/bookings            # Search/filter bookings
GET  /api/admin/bookings/:id        # Booking details
PUT  /api/admin/bookings/:id        # Update booking
POST /api/admin/bookings/:id/cancel # Cancel booking
POST /api/admin/bookings/export     # Export bookings

-- Customer Management
GET  /api/admin/customers           # Search customers
GET  /api/admin/customers/:id       # Customer profile
POST /api/admin/customers/:id/notes # Add customer note
GET  /api/admin/customers/:id/history # Customer booking history
```

Admin UI Framework:
- **Design System:** Material-UI or Ant Design for rich admin components
- **Charts:** Recharts or Chart.js for analytics visualization
- **Tables:** React Table with sorting, filtering, pagination
- **Forms:** React Hook Form with Zod validation
- **State Management:** Redux Toolkit for complex admin state
- **Real-time Updates:** WebSocket connection for live metrics

Security Implementation:
```typescript
// Role-based access control
const permissions = {
  super_admin: ['*'], // All permissions
  operations_manager: ['bookings:*', 'customers:read', 'customers:write'],
  finance_manager: ['payments:*', 'reports:*', 'bookings:read'],
  customer_service: ['customers:*', 'bookings:read', 'bookings:write']
};

// Audit logging middleware
const auditLogger = (action: string, resource: string) => {
  return (req: AdminRequest, res: Response, next: NextFunction) => {
    const originalJson = res.json;
    res.json = function(data) {
      logAdminAction({
        adminUserId: req.adminUser.id,
        action,
        resourceType: resource,
        resourceId: req.params.id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      return originalJson.call(this, data);
    };
    next();
  };
};
```

Real-time Features:
```typescript
// WebSocket connection for real-time updates
class AdminRealtimeService {
  connectWebSocket() {
    this.ws = new WebSocket('/admin/ws');
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleRealtimeUpdate(data);
    };
  }

  handleRealtimeUpdate(data: RealtimeUpdate) {
    switch (data.type) {
      case 'new_booking':
        this.updateBookingCount();
        this.refreshBookingList();
        break;
      case 'payment_completed':
        this.updateRevenueMetrics();
        break;
      case 'booking_cancelled':
        this.updateCancellationMetrics();
        break;
    }
  }
}
```

ACCEPTANCE CRITERIA:
- ✅ Admin login works with role-based access control
- ✅ Dashboard shows real-time metrics and updates automatically
- ✅ Booking management allows search, filter, and bulk operations
- ✅ Customer profiles show complete history and communication
- ✅ All admin actions are logged for security auditing
- ✅ Charts and analytics display business intelligence clearly
- ✅ Mobile-responsive admin interface works on tablets
- ✅ Permission system prevents unauthorized access
- ✅ Real-time notifications work for new bookings/payments
- ✅ Export functionality works for reports and data

SECURITY REQUIREMENTS:
- Multi-factor authentication for admin accounts
- Session timeout and automatic logout
- IP-based access restrictions (configurable)
- Comprehensive audit logging
- Role-based permission enforcement
- Secure password requirements
- Account lockout after failed attempts

Focus on creating a powerful, secure admin interface that gives business owners complete visibility and control over their Stable Ride operations while maintaining strict security and audit requirements.
```

---

## Sprint 8.5: Advanced Admin Features

### Claude Code Prompt for Sprint 8.5

```
This is Sprint 8.5 of Stable Ride. We're expanding the admin panel with advanced financial management, configuration systems, and operational tools.

CONTEXT:
Sprint 8 delivered the core admin foundation with authentication, dashboard, and basic booking/customer management. Now we're adding sophisticated business management features that enable complete operational control.

ADVANCED ADMIN FEATURES TO IMPLEMENT:
1. Financial Management Dashboard - Revenue, payments, refunds, reporting
2. System Configuration Management - Pricing, business rules, service areas
3. Content Management System - Email templates, website content, policies
4. Advanced Reporting System - Custom reports, analytics, exports

TASKS FOR THIS SPRINT:

1. FINANCIAL MANAGEMENT DASHBOARD:
   Implement comprehensive financial oversight system:

   ```typescript
   interface FinancialDashboard {
     revenue: {
       today: number;
       thisWeek: number;
       thisMonth: number;
       lastMonth: number;
       yearToDate: number;
       growth: {
         daily: number;
         weekly: number;
         monthly: number;
       };
     };
     payments: {
       pending: PaymentSummary[];
       completed: PaymentSummary[];
       failed: PaymentSummary[];
       refunds: RefundSummary[];
     };
     analytics: {
       averageBookingValue: number;
       customerLifetimeValue: number;
       revenuePerService: ServiceRevenue[];
       profitMargins: ProfitAnalysis;
     };
   }
   ```

   Financial Features:
   - Real-time revenue tracking with trends
   - Payment reconciliation dashboard
   - Refund management and processing
   - Profit/loss analysis by service type
   - Tax reporting and compliance tools
   - Financial forecasting and projections
   - Commission tracking (future driver payments)
   - Expense tracking and categorization

2. SYSTEM CONFIGURATION MANAGEMENT:
   Create comprehensive business configuration system:

   ```typescript
   interface SystemConfiguration {
     pricing: {
       baseRates: ServiceRates;
       surcharges: SurchargeConfig[];
       discounts: DiscountConfig[];
       taxRates: TaxConfiguration;
       peakHours: PeakHourConfig[];
     };
     operations: {
       businessHours: BusinessHours;
       serviceAreas: ServiceArea[];
       bookingRules: BookingConstraints;
       cancellationPolicy: CancellationPolicy;
       vehicleTypes: VehicleType[];
     };
     integrations: {
       googleMaps: GoogleMapsConfig;
       stripe: StripeConfig;
       sendgrid: SendGridConfig;
       twilio: TwilioConfig;
     };
   }
   ```

   Configuration Features:
   - Visual pricing rule editor
   - Service area mapping with boundaries
   - Business hours management with holidays
   - Cancellation policy configuration
   - Vehicle type and feature management
   - Integration settings and API keys
   - Feature flags for gradual rollouts
   - Configuration versioning and rollback

3. CONTENT MANAGEMENT SYSTEM:
   Build comprehensive content management tools:

   ```typescript
   interface ContentManagement {
     emailTemplates: {
       transactional: EmailTemplate[];
       marketing: EmailTemplate[];
       notifications: EmailTemplate[];
     };
     smsTemplates: {
       confirmations: SmsTemplate[];
       reminders: SmsTemplate[];
       alerts: SmsTemplate[];
     };
     websiteContent: {
       homepage: ContentBlock[];
       aboutPage: ContentBlock[];
       termsOfService: Document;
       privacyPolicy: Document;
     };
     policies: {
       cancellationPolicy: Policy;
       refundPolicy: Policy;
       serviceAgreement: Policy;
     };
   }
   ```

   Content Management Features:
   - Rich text editor for email templates
   - Template variable management
   - A/B testing for email templates
   - SMS template editor with character limits
   - Legal document management
   - Policy versioning and effective dates
   - Multi-language support preparation
   - Content approval workflows

4. ADVANCED REPORTING SYSTEM:
   Implement powerful reporting and analytics:

   ```typescript
   interface ReportingSystem {
     standardReports: {
       dailySales: Report;
       weeklyBookings: Report;
       monthlyRevenue: Report;
       customerAcquisition: Report;
       servicePerformance: Report;
     };
     customReports: {
       builder: ReportBuilder;
       savedReports: SavedReport[];
       scheduledReports: ScheduledReport[];
     };
     analytics: {
       cohortAnalysis: CohortData;
       customerSegmentation: SegmentData;
       geographicAnalysis: GeoData;
       seasonalTrends: TrendData;
     };
   }
   ```

   Reporting Features:
   - Drag-and-drop report builder
   - Automated report scheduling
   - PDF and Excel export capabilities
   - Interactive charts and visualizations
   - Custom date range analysis
   - Comparative analysis tools
   - Executive summary dashboards
   - Data export API for external tools

TECHNICAL IMPLEMENTATION:

Advanced Admin Components:
```
src/admin/
├── components/
│   ├── financial/
│   │   ├── FinancialDashboard.tsx
│   │   ├── RevenueChart.tsx
│   │   ├── PaymentReconciliation.tsx
│   │   ├── RefundManagement.tsx
│   │   └── ProfitAnalysis.tsx
│   ├── configuration/
│   │   ├── ConfigurationManager.tsx
│   │   ├── PricingEditor.tsx
│   │   ├── ServiceAreaMapper.tsx
│   │   ├── BusinessHours.tsx
│   │   └── IntegrationSettings.tsx
│   ├── content/
│   │   ├── ContentManager.tsx
│   │   ├── EmailTemplateEditor.tsx
│   │   ├── SmsTemplateEditor.tsx
│   │   ├── PolicyEditor.tsx
│   │   └── WebsiteContentEditor.tsx
│   ├── reports/
│   │   ├── ReportsHub.tsx
│   │   ├── ReportBuilder.tsx
│   │   ├── StandardReports.tsx
│   │   ├── CustomReports.tsx
│   │   └── AnalyticsDashboard.tsx
```

Database Schema Extensions:
```sql
CREATE TABLE system_configurations (
    id SERIAL PRIMARY KEY,
    category VARCHAR(50) NOT NULL,
    key VARCHAR(100) NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    version INTEGER DEFAULT 1,
    effective_date TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES admin_users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(category, key, version)
);

CREATE TABLE email_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    html_content TEXT NOT NULL,
    text_content TEXT,
    variables JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT TRUE,
    version INTEGER DEFAULT 1,
    created_by UUID REFERENCES admin_users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE custom_reports (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    configuration JSONB NOT NULL,
    schedule JSONB,  -- For automated reports
    created_by UUID REFERENCES admin_users(id),
    is_active BOOLEAN DEFAULT TRUE,
    last_run TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE financial_transactions (
    id SERIAL PRIMARY KEY,
    transaction_type VARCHAR(50) NOT NULL,
    booking_id UUID REFERENCES bookings(id),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(50) NOT NULL,
    stripe_transaction_id VARCHAR(255),
    description TEXT,
    metadata JSONB,
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);
```

Configuration Management System:
```typescript
class ConfigurationManager {
  async updatePricingConfig(config: PricingConfig): Promise<void> {
    // Validate configuration
    const validation = await this.validatePricingConfig(config);
    if (!validation.isValid) {
      throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
    }

    // Version the configuration
    const newVersion = await this.createConfigVersion('pricing', config);
    
    // Hot-swap without restart
    await this.activateConfiguration(newVersion);
    
    // Audit log
    await this.auditLog('configuration_updated', 'pricing', newVersion);
  }

  async rollbackConfiguration(category: string, toVersion: number): Promise<void> {
    const config = await this.getConfigurationVersion(category, toVersion);
    await this.activateConfiguration(config);
  }
}
```

Report Builder System:
```typescript
interface ReportBuilder {
  dataSource: 'bookings' | 'customers' | 'payments' | 'custom';
  dimensions: ReportDimension[];
  metrics: ReportMetric[];
  filters: ReportFilter[];
  groupBy: string[];
  sortBy: SortConfig[];
  dateRange: DateRange;
  visualization: 'table' | 'chart' | 'dashboard';
}

class ReportingService {
  async buildCustomReport(config: ReportBuilder): Promise<ReportResult> {
    const query = this.buildQuery(config);
    const data = await this.executeQuery(query);
    const formatted = this.formatData(data, config);
    return this.generateVisualization(formatted, config);
  }

  async scheduleReport(reportId: string, schedule: ReportSchedule): Promise<void> {
    const cronJob = this.createCronJob(schedule);
    cronJob.start(() => {
      this.generateAndEmailReport(reportId);
    });
  }
}
```

Advanced API Endpoints:
```
-- Financial Management
GET  /api/admin/financial/dashboard     # Financial overview
GET  /api/admin/financial/revenue       # Revenue analytics
GET  /api/admin/financial/payments      # Payment management
POST /api/admin/financial/refund        # Process refund
GET  /api/admin/financial/reconciliation # Payment reconciliation

-- Configuration Management
GET  /api/admin/config/:category        # Get configuration
PUT  /api/admin/config/:category        # Update configuration
GET  /api/admin/config/versions         # Configuration history
POST /api/admin/config/rollback         # Rollback configuration

-- Content Management
GET  /api/admin/content/templates       # Email/SMS templates
POST /api/admin/content/templates       # Create template
PUT  /api/admin/content/templates/:id   # Update template
POST /api/admin/content/test-email      # Test email template

-- Reporting
GET  /api/admin/reports/standard        # Standard reports
POST /api/admin/reports/custom          # Build custom report
GET  /api/admin/reports/saved           # Saved reports
POST /api/admin/reports/schedule        # Schedule report
GET  /api/admin/reports/export/:id      # Export report
```

Email Template System:
```typescript
class EmailTemplateManager {
  private templateEngine = new Handlebars();

  async renderTemplate(templateId: string, variables: Record<string, any>): Promise<string> {
    const template = await this.getTemplate(templateId);
    const compiledTemplate = this.templateEngine.compile(template.html_content);
    return compiledTemplate(variables);
  }

  async testTemplate(templateId: string, testData: Record<string, any>): Promise<void> {
    const rendered = await this.renderTemplate(templateId, testData);
    await this.sendTestEmail(rendered);
  }

  async createABTest(templateA: string, templateB: string, percentage: number): Promise<ABTest> {
    return this.abTestingService.createTest({
      templateA,
      templateB,
      trafficSplit: percentage,
      metric: 'open_rate'
    });
  }
}
```

ACCEPTANCE CRITERIA:
- ✅ Financial dashboard shows accurate revenue and payment data
- ✅ Configuration changes take effect immediately without restart
- ✅ Email templates can be edited with live preview
- ✅ Custom reports can be built with drag-and-drop interface
- ✅ Report scheduling works with email delivery
- ✅ Configuration versioning and rollback works properly
- ✅ Payment reconciliation matches Stripe records
- ✅ Service area mapping allows boundary editing
- ✅ Business hours configuration handles holidays
- ✅ All changes are audit logged for compliance

ADVANCED FEATURES:
- Real-time configuration hot-swapping
- A/B testing for email templates
- Automated financial reconciliation
- Custom dashboard widgets
- Role-based configuration access
- Configuration approval workflows
- Data export API for external tools

Focus on creating enterprise-level business management tools that scale with the growing transportation service while maintaining ease of use for non-technical business operators.
```

---

## Sprint 9: Testing & Quality Assurance

### Claude Code Prompt for Sprint 9

```
This is Sprint 9 of Stable Ride. We're implementing comprehensive testing, performance optimization, and quality assurance to ensure production readiness.

CONTEXT:
All core features and admin functionality are complete. We need to implement thorough testing coverage, optimize performance, conduct security audits, and ensure the application meets production quality standards.

TESTING & QA OBJECTIVES:
- Achieve 90%+ code coverage with unit and integration tests
- Implement end-to-end testing for critical user journeys
- Optimize application performance (sub-3 second load times)
- Conduct security audit and vulnerability assessment
- Cross-browser and mobile device testing
- Load testing and scalability validation

TASKS FOR THIS SPRINT:

1. COMPREHENSIVE UNIT TESTING:
   Implement thorough unit test coverage:

   ```typescript
   // Testing structure and requirements
   interface TestingRequirements {
     coverage: {
       minimum: 90;
       statements: 95;
       branches: 85;
       functions: 95;
       lines: 95;
     };
     frameworks: {
       frontend: 'Jest + React Testing Library';
       backend: 'Jest + Supertest';
       e2e: 'Cypress';
     };
     categories: {
       unit: 'Individual functions and components';
       integration: 'API endpoints and service interactions';
       e2e: 'Complete user workflows';
       performance: 'Load and stress testing';
     };
   }
   ```

   Unit Testing Focus Areas:
   - Authentication services and components
   - Booking flow logic and validation
   - Pricing engine calculations
   - Payment processing integration
   - Admin panel functionality
   - Utility functions and helpers
   - Form validation and error handling
   - State management logic

   Frontend Testing Implementation:
   ```typescript
   // Component testing example
   describe('BookingForm', () => {
     it('should calculate pricing correctly for one-way trips', () => {
       // Test pricing calculations
     });

     it('should validate required fields before submission', () => {
       // Test form validation
     });

     it('should handle API errors gracefully', () => {
       // Test error handling
     });
   });

   // Hook testing
   describe('useBooking', () => {
     it('should manage booking state correctly', () => {
       // Test custom hook logic
     });
   });
   ```

2. INTEGRATION TESTING:
   Test API endpoints and service interactions:

   ```typescript
   // API testing structure
   describe('Booking API', () => {
     beforeEach(async () => {
       await setupTestDatabase();
       await seedTestData();
     });

     afterEach(async () => {
       await cleanupTestDatabase();
     });

     describe('POST /api/bookings', () => {
       it('should create booking with valid data', async () => {
         const response = await request(app)
           .post('/api/bookings')
           .send(validBookingData)
           .expect(201);
         
         expect(response.body).toHaveProperty('bookingReference');
       });

       it('should reject booking with invalid payment method', async () => {
         // Test payment validation
       });

       it('should apply pricing rules correctly', async () => {
         // Test pricing integration
       });
     });
   });
   ```

   Integration Testing Coverage:
   - Authentication endpoints
   - Booking creation and management
   - Payment processing workflows
   - Email/SMS notification sending
   - Admin API functionality
   - Database transactions
   - Third-party service integrations
   - Error handling and edge cases

3. END-TO-END TESTING:
   Implement critical user journey testing:

   ```typescript
   // E2E testing scenarios
   const e2eTestScenarios = {
     customerBookingFlow: [
       'User registration and email verification',
       'Service selection and location input',
       'Date/time selection with validation',
       'Enhancement selection and pricing',
       'Payment processing and confirmation',
       'Booking management and modification'
     ],
     adminManagementFlow: [
       'Admin login with role verification',
       'Dashboard metrics and real-time updates',
       'Booking search and management',
       'Customer profile and communication',
       'Configuration changes and deployment',
       'Report generation and export'
     ]
   };
   ```

   Cypress E2E Implementation:
   ```typescript
   describe('Complete Booking Flow', () => {
     it('should allow user to book a ride end-to-end', () => {
       cy.visit('/');
       cy.register(testUser);
       cy.selectService('one-way');
       cy.enterLocations(pickup, dropoff);
       cy.selectDateTime(tomorrow, '10:00');
       cy.addEnhancements(['trip-protection']);
       cy.enterPayment(testCard);
       cy.confirmBooking();
       cy.verifyBookingConfirmation();
     });

     it('should handle payment failures gracefully', () => {
       // Test payment failure scenarios
     });
   });
   ```

4. PERFORMANCE OPTIMIZATION:
   Optimize application performance and scalability:

   ```typescript
   interface PerformanceTargets {
     loadTimes: {
       initialPageLoad: '< 3 seconds';
       routeTransitions: '< 500ms';
       apiResponses: '< 1 second';
       imageLoading: '< 2 seconds';
     };
     lighthouse: {
       performance: '> 90';
       accessibility: '> 95';
       bestPractices: '> 90';
       seo: '> 90';
     };
     scalability: {
       concurrentUsers: 1000;
       requestsPerSecond: 100;
       databaseConnections: 50;
     };
   }
   ```

   Performance Optimization Tasks:
   - Bundle size optimization and code splitting
   - Image optimization and lazy loading
   - Database query optimization
   - API response caching strategies
   - CDN implementation for static assets
   - Progressive Web App (PWA) features
   - Service worker for offline functionality
   - Memory leak detection and fixes

5. SECURITY AUDIT & PENETRATION TESTING:
   Conduct comprehensive security assessment:

   ```typescript
   interface SecurityChecklist {
     authentication: [
       'JWT token security and expiration',
       'Password hashing and storage',
       'Multi-factor authentication',
       'Session management',
       'CSRF protection'
     ];
     authorization: [
       'Role-based access control',
       'API endpoint protection',
       'Admin privilege escalation',
       'Resource access validation'
     ];
     dataProtection: [
       'Input validation and sanitization',
       'SQL injection prevention',
       'XSS protection',
       'Sensitive data encryption',
       'PCI DSS compliance'
     ];
     infrastructure: [
       'HTTPS enforcement',
       'Security headers',
       'Rate limiting',
       'API key protection',
       'Environment variable security'
     ];
   }
   ```

   Security Testing Tools:
   - OWASP ZAP for vulnerability scanning
   - ESLint security rules
   - npm audit for dependency vulnerabilities
   - Snyk for continuous security monitoring
   - Manual penetration testing

TECHNICAL IMPLEMENTATION:

Testing Infrastructure:
```
tests/
├── unit/
│   ├── frontend/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── utils/
│   └── backend/
│       ├── controllers/
│       ├── services/
│       ├── middleware/
│       └── utils/
├── integration/
│   ├── api/
│   ├── database/
│   └── services/
├── e2e/
│   ├── customer/
│   ├── admin/
│   └── shared/
├── performance/
│   ├── load-tests/
│   └── stress-tests/
└── security/
    ├── vulnerability-tests/
    └── penetration-tests/
```

Test Configuration:
```typescript
// Jest configuration
const jestConfig = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 95,
      lines: 95,
      statements: 95
    }
  },
  moduleNameMapping: {
    '^@/(.*): '<rootDir>/src/$1'
  }
};

// Cypress configuration
const cypressConfig = {
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: 'tests/e2e/support/index.ts',
    specPattern: 'tests/e2e/**/*.cy.ts',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshot: true
  }
};
```

Performance Testing:
```typescript
// Load testing with Artillery
const loadTestConfig = {
  config: {
    target: 'http://localhost:8000',
    phases: [
      { duration: 60, arrivalRate: 10 },  // Warm up
      { duration: 300, arrivalRate: 50 }, // Sustained load
      { duration: 60, arrivalRate: 100 }  // Peak load
    ]
  },
  scenarios: [
    {
      name: 'Booking Flow',
      weight: 70,
      flow: [
        { post: { url: '/api/auth/login', json: '{{ user }}' } },
        { post: { url: '/api/quotes/calculate', json: '{{ trip }}' } },
        { post: { url: '/api/bookings', json: '{{ booking }}' } }
      ]
    },
    {
      name: 'Admin Dashboard',
      weight: 30,
      flow: [
        { post: { url: '/api/admin/auth/login', json: '{{ admin }}' } },
        { get: { url: '/api/admin/dashboard/metrics' } },
        { get: { url: '/api/admin/bookings?limit=50' } }
      ]
    }
  ]
};
```

Security Testing Implementation:
```typescript
// Security test suite
describe('Security Tests', () => {
  describe('Authentication', () => {
    it('should reject invalid JWT tokens', () => {
      // Test token validation
    });

    it('should prevent brute force attacks', () => {
      // Test rate limiting
    });
  });

  describe('Authorization', () => {
    it('should prevent privilege escalation', () => {
      // Test role-based access
    });

    it('should protect admin endpoints', () => {
      // Test admin access control
    });
  });

  describe('Input Validation', () => {
    it('should sanitize user input', () => {
      // Test XSS prevention
    });

    it('should prevent SQL injection', () => {
      // Test parameterized queries
    });
  });
});
```

Automated Testing Pipeline:
```yaml
# GitHub Actions workflow
name: Test Suite
on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run unit tests
        run: npm run test:unit
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - name: Run integration tests
        run: npm run test:integration

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - name: Run Cypress tests
        uses: cypress-io/github-action@v5
        with:
          start: npm run dev
          wait-on: 'http://localhost:3000'
```

ACCEPTANCE CRITERIA:
- ✅ Unit test coverage exceeds 90% across all modules
- ✅ All API endpoints have integration tests
- ✅ Critical user journeys have E2E test coverage
- ✅ Application loads in under 3 seconds
- ✅ Lighthouse scores exceed 90 in all categories
- ✅ Security scan shows no high-severity vulnerabilities
- ✅ Load testing handles 1000 concurrent users
- ✅ Cross-browser testing passes on major browsers
- ✅ Mobile responsiveness works on all device sizes
- ✅ Accessibility standards (WCAG 2.1 AA) are met

PERFORMANCE BENCHMARKS:
- Page load time: < 3 seconds
- API response time: < 1 second
- Database query time: < 500ms
- Image load time: < 2 seconds
- Bundle size: < 1MB (compressed)

QUALITY GATES:
- No failing tests in CI/CD pipeline
- Code coverage thresholds met
- Performance benchmarks achieved
- Security scan approval
- Accessibility audit passed
- Cross-browser compatibility verified

Focus on creating a robust, secure, and performant application that meets enterprise quality standards while providing excellent user experience across all devices and browsers.
```

---

## Sprint 10: Deployment & Launch Preparation

### Claude Code Prompt for Sprint 10

```
This is Sprint 10 of Stable Ride. We're setting up production infrastructure, implementing monitoring, and preparing for the official launch.

CONTEXT:
All features are complete and thoroughly tested. We need to deploy to production, implement monitoring and alerting, create documentation, and conduct final launch preparations.

DEPLOYMENT OBJECTIVES:
- Set up production-ready infrastructure
- Implement comprehensive monitoring and logging
- Create operational documentation and runbooks
- Conduct soft launch with beta users
- Prepare go-live checklist and rollback procedures

TASKS FOR THIS SPRINT:

1. PRODUCTION INFRASTRUCTURE SETUP:
   Deploy scalable, secure production environment:

   ```typescript
   interface ProductionInfrastructure {
     hosting: {
       platform: 'AWS' | 'Google Cloud' | 'Azure' | 'Vercel/Railway';
       regions: string[];
       loadBalancing: boolean;
       autoScaling: boolean;
     };
     database: {
       primary: 'PostgreSQL on AWS RDS';
       replica: 'Read replica for analytics';
       backup: 'Automated daily backups';
       encryption: 'Encryption at rest and in transit';
     };
     caching: {
       redis: 'ElastiCache for session management';
       cdn: 'CloudFront for static assets';
       apiCaching: 'Redis for API response caching';
     };
     security: {
       ssl: 'SSL/TLS certificates';
       waf: 'Web Application Firewall';
       ddos: 'DDoS protection';
       secrets: 'AWS Secrets Manager';
     };
   }
   ```

   Infrastructure Components:
   - Production web servers with auto-scaling
   - Database cluster with read replicas
   - Redis cluster for caching and sessions
   - CDN for static asset delivery
   - Load balancer with health checks
   - SSL certificates and security headers
   - Environment variable management
   - Backup and disaster recovery setup

   Deployment Configuration:
   ```yaml
   # Docker production configuration
   version: '3.8'
   services:
     frontend:
       image: stable-ride/frontend:${VERSION}
       environment:
         - NODE_ENV=production
         - REACT_APP_API_URL=${API_URL}
       ports:
         - "3000:3000"

     backend:
       image: stable-ride/backend:${VERSION}
       environment:
         - NODE_ENV=production
         - DATABASE_URL=${DATABASE_URL}
         - REDIS_URL=${REDIS_URL}
         - STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
       ports:
         - "8000:8000"

     nginx:
       image: nginx:alpine
       volumes:
         - ./nginx.conf:/etc/nginx/nginx.conf
       ports:
         - "80:80"
         - "443:443"
   ```

2. MONITORING & ALERTING SYSTEM:
   Implement comprehensive observability:

   ```typescript
   interface MonitoringStack {
     applicationMetrics: {
       apm: 'New Relic' | 'DataDog' | 'AppSignal';
       customMetrics: 'Prometheus + Grafana';
       uptime: 'Pingdom' | 'UptimeRobot';
     };
     logging: {
       aggregation: 'ELK Stack' | 'Fluentd';
       storage: 'CloudWatch Logs';
       analysis: 'Kibana' | 'DataDog Logs';
     };
     errorTracking: {
       frontend: 'Sentry for React errors';
       backend: 'Sentry for Node.js errors';
       alerts: 'Slack/Email notifications';
     };
     businessMetrics: {
       bookings: 'Real-time booking tracking';
       revenue: 'Revenue monitoring';
       customers: 'User activity tracking';
       performance: 'Conversion rate monitoring';
     };
   }
   ```

   Monitoring Implementation:
   ```typescript
   // Application monitoring
   class MonitoringService {
     // Performance metrics
     trackPageLoad(page: string, loadTime: number) {
       analytics.track('page_load', {
         page,
         loadTime,
         timestamp: new Date()
       });
     }

     // Business metrics
     trackBookingCreated(booking: Booking) {
       analytics.track('booking_created', {
         serviceType: booking.serviceType,
         amount: booking.totalAmount,
         timestamp: booking.createdAt
       });
     }

     // Error tracking
     trackError(error: Error, context: any) {
       Sentry.captureException(error, {
         tags: { component: context.component },
         extra: context
       });
     }
   }

   // Health check endpoints
   app.get('/health', (req, res) => {
     res.json({
       status: 'healthy',
       timestamp: new Date(),
       uptime: process.uptime(),
       version: process.env.VERSION
     });
   });

   app.get('/health/detailed', async (req, res) => {
     const health = await Promise.all([
       checkDatabase(),
       checkRedis(),
       checkStripe(),
       checkSendGrid()
     ]);
     
     res.json({
       status: health.every(h => h.status === 'ok') ? 'healthy' : 'degraded',
       services: health
     });
   });
   ```

3. OPERATIONAL DOCUMENTATION:
   Create comprehensive operational guides:

   ```typescript
   interface OperationalDocs {
     deployment: {
       setupGuide: 'Production deployment steps';
       rollbackProcedure: 'Emergency rollback process';
       updateProcess: 'Application update workflow';
       troubleshooting: 'Common deployment issues';
     };
     monitoring: {
       dashboardGuide: 'Monitoring dashboard usage';
       alertPlaybook: 'Alert response procedures';
       performanceTuning: 'Performance optimization guide';
       capacityPlanning: 'Scaling guidelines';
     };
     maintenance: {
       backupProcedures: 'Database backup and restore';
       securityUpdates: 'Security patch procedures';
       certificateRenewal: 'SSL certificate management';
       logRotation: 'Log management procedures';
     };
   }
   ```

   Documentation Structure:
   ```markdown
   docs/
   ├── deployment/
   │   ├── production-setup.md
   │   ├── environment-variables.md
   │   ├── ssl-configuration.md
   │   └── rollback-procedures.md
   ├── operations/
   │   ├── monitoring-guide.md
   │   ├── alert-playbook.md
   │   ├── backup-procedures.md
   │   └── troubleshooting.md
   ├── development/
   │   ├── local-setup.md
   │   ├── api-documentation.md
   │   ├── database-schema.md
   │   └── testing-guide.md
   └── user-guides/
       ├── customer-booking-guide.md
       ├── admin-panel-guide.md
       └── mobile-app-guide.md
   ```

4. SOFT LAUNCH & BETA TESTING:
   Conduct controlled beta launch:

   ```typescript
   interface BetaLaunchPlan {
     phases: {
       phase1: {
         duration: '1 week';
         users: 'Internal team + family/friends (10 users)';
         focus: 'Critical bug identification';
       };
       phase2: {
         duration: '2 weeks';
         users: 'Selected beta testers (50 users)';
         focus: 'User experience and workflow validation';
       };
       phase3: {
         duration: '1 week';
         users: 'Extended beta group (100 users)';
         focus: 'Load testing and performance validation';
       };
     };
     metrics: {
       bookingCompletionRate: '>90%';
       paymentSuccessRate: '>98%';
       userSatisfactionScore: '>4.5/5';
       criticalBugs: '0';
       averageResponseTime: '<2 seconds';
     };
     feedback: {
       surveyTool: 'Typeform or Google Forms';
       interviewSchedule: '5 user interviews per week';
       feedbackChannels: ['Email', 'In-app', 'Phone'];
     };
   }
   ```

   Beta Testing Implementation:
   ```typescript
   // Feature flags for beta testing
   class FeatureFlagService {
     async isBetaUser(userId: string): Promise<boolean> {
       const user = await this.userService.getUser(userId);
       return user.groups.includes('beta') || user.email.endsWith('@stableride.com');
     }

     async enableFeature(feature: string, userId: string): Promise<boolean> {
       const flags = await this.getFeatureFlags(userId);
       return flags[feature] === true;
     }
   }

   // Beta feedback collection
   class FeedbackService {
     async collectFeedback(userId: string, feedback: BetaFeedback): Promise<void> {
       await this.database.feedback.create({
         userId,
         category: feedback.category,
         rating: feedback.rating,
         comments: feedback.comments,
         page: feedback.page,
         timestamp: new Date()
       });

       // Send to Slack for immediate visibility
       await this.slack.send({
         channel: '#beta-feedback',
         text: `New feedback from ${feedback.userEmail}: ${feedback.comments}`
       });
     }
   }
   ```

5. GO-LIVE CHECKLIST & PROCEDURES:
   Prepare comprehensive launch checklist:

   ```typescript
   interface GoLiveChecklist {
     prelaunch: [
       'DNS configuration complete',
       'SSL certificates installed',
       'Database migrations applied',
       'Environment variables configured',
       'Third-party integrations tested',
       'Monitoring alerts configured',
       'Backup systems verified',
       'Security scan completed',
       'Performance tests passed',
       'Legal docs reviewed (Terms, Privacy)'
     ];
     launch: [
       'Final deployment executed',
       'Health checks passing',
       'Monitoring dashboards active',
       'Customer support ready',
       'Marketing materials prepared',
       'Launch announcement scheduled',
       'Social media posts ready',
       'Press release finalized'
     ];
     postlaunch: [
       'Monitor key metrics for 24 hours',
       'Customer support response tracking',
       'Performance monitoring active',
       'Bug report triage process',
       'User feedback collection',
       'Revenue tracking validation',
       'Backup verification',
       'Security monitoring active'
     ];
   }
   ```

TECHNICAL IMPLEMENTATION:

CI/CD Pipeline:
```yaml
# Production deployment pipeline
name: Production Deployment

on:
  push:
    tags:
      - 'v*'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Run test suite
        run: |
          npm ci
          npm run test:unit
          npm run test:integration
          npm run test:e2e

  security-scan:
    runs-on: ubuntu-latest
    steps:
      - name: Security audit
        run: |
          npm audit --audit-level=high
          npx snyk test

  build-and-deploy:
    needs: [test, security-scan]
    runs-on: ubuntu-latest
    steps:
      - name: Build Docker images
        run: |
          docker build -t stable-ride/frontend:${{ github.ref_name }} ./frontend
          docker build -t stable-ride/backend:${{ github.ref_name }} ./backend

      - name: Push to registry
        run: |
          docker push stable-ride/frontend:${{ github.ref_name }}
          docker push stable-ride/backend:${{ github.ref_name }}

      - name: Deploy to production
        run: |
          kubectl set image deployment/frontend frontend=stable-ride/frontend:${{ github.ref_name }}
          kubectl set image deployment/backend backend=stable-ride/backend:${{ github.ref_name }}
          kubectl rollout status deployment/frontend
          kubectl rollout status deployment/backend
```

Production Environment Configuration:
```typescript
// Production configuration
const productionConfig = {
  server: {
    port: process.env.PORT || 8000,
    host: '0.0.0.0',
    cors: {
      origin: process.env.FRONTEND_URL,
      credentials: true
    }
  },
  database: {
    url: process.env.DATABASE_URL,
    ssl: true,
    pool: {
      min: 5,
      max: 20
    }
  },
  redis: {
    url: process.env.REDIS_URL,
    retryAttempts: 3,
    retryDelayOnFailover: 1000
  },
  monitoring: {
    sentry: {
      dsn: process.env.SENTRY_DSN,
      environment: 'production'
    },
    newrelic: {
      appName: 'Stable Ride API',
      licenseKey: process.env.NEW_RELIC_LICENSE_KEY
    }
  }
};
```

Rollback Procedures:
```bash
#!/bin/bash
# Emergency rollback script

PREVIOUS_VERSION=$1

if [ -z "$PREVIOUS_VERSION" ]; then
  echo "Usage: ./rollback.sh <previous-version>"
  exit 1
fi

echo "Rolling back to version $PREVIOUS_VERSION..."

# Rollback application
kubectl set image deployment/frontend frontend=stable-ride/frontend:$PREVIOUS_VERSION
kubectl set image deployment/backend backend=stable-ride/backend:$PREVIOUS_VERSION

# Wait for rollback completion
kubectl rollout status deployment/frontend
kubectl rollout status deployment/backend

# Verify health
curl -f https://api.stableride.com/health || exit 1

echo "Rollback completed successfully"
```

ACCEPTANCE CRITERIA:
- ✅ Production environment deployed and accessible
- ✅ SSL certificates installed and valid
- ✅ Monitoring dashboards showing all metrics
- ✅ Error tracking and alerting configured
- ✅ Backup systems tested and verified
- ✅ Performance meets production requirements
- ✅ Security scans show no critical vulnerabilities
- ✅ Documentation complete and accessible
- ✅ Beta testing completed with positive feedback
- ✅ Go-live checklist 100% complete

LAUNCH READINESS CRITERIA:
- All tests passing in CI/CD pipeline
- Performance benchmarks met
- Security audit approved
- Beta user feedback incorporated
- Documentation reviewed and approved
- Support team trained and ready
- Marketing materials finalized
- Legal compliance verified

Focus on creating a robust, monitored production environment that can scale with business growth while maintaining high availability and performance standards.
```

---

## Sprint 11: Advanced Analytics & Marketing Tools

### Claude Code Prompt for Sprint 11

```
This is Sprint 11 of Stable Ride. We're implementing advanced analytics, marketing automation, and growth tools to drive business success post-launch.

CONTEXT:
The application is successfully deployed and operational. Now we need to implement sophisticated analytics to understand user behavior, automated marketing tools to drive growth, and advanced reporting for business intelligence.

ANALYTICS & MARKETING OBJECTIVES:
- Implement comprehensive user behavior tracking
- Build automated marketing campaigns and customer lifecycle management
- Create advanced business intelligence dashboards
- Develop customer segmentation and personalization
- Set up conversion optimization and A/B testing framework

TASKS FOR THIS SPRINT:

1. ADVANCED ANALYTICS IMPLEMENTATION:
   Build comprehensive user behavior and business analytics:

   ```typescript
   interface AnalyticsFramework {
     userBehavior: {
       tracking: 'Google Analytics 4 + Custom Events';
       heatmaps: 'Hotjar or FullStory';
       sessionRecording: 'LogRocket or Smartlook';
       userJourney: 'Mixpanel or Amplitude';
     };
     businessMetrics: {
       revenue: 'Real-time revenue tracking';
       conversion: 'Funnel analysis and optimization';
       retention: 'Cohort analysis and churn prediction';
       ltv: 'Customer lifetime value calculation';
     };
     operationalMetrics: {
       bookingFlow: 'Conversion rate by step';
       servicePerformance: 'Service type popularity and profitability';
       geographicAnalysis: 'Service area utilization';
       temporalPatterns: 'Peak hours and seasonal trends';
     };
   }
   ```

   Analytics Implementation:
   ```typescript
   // Advanced analytics service
   class AdvancedAnalyticsService {
     // User journey tracking
     trackUserJourney(userId: string, event: string, properties: any) {
       const journeyEvent = {
         userId,
         event,
         properties,
         timestamp: new Date(),
         sessionId: this.getSessionId(),
         page: window.location.pathname,
         referrer: document.referrer
       };

       // Send to multiple analytics platforms
       Promise.all([
         this.mixpanel.track(event, journeyEvent),
         this.amplitude.track(event, journeyEvent),
         this.customAnalytics.track(journeyEvent)
       ]);
     }

     // Conversion funnel analysis
     async analyzeFunnel(startDate: Date, endDate: Date): Promise<FunnelAnalysis> {
       const funnelSteps = [
         'landing_page_view',
         'service_selection',
         'location_entry',
         'datetime_selection',
         'quote_generation',
         'payment_initiation',
         'booking_completion'
       ];

       const analysis = await Promise.all(
         funnelSteps.map(step => this.getStepConversion(step, startDate, endDate))
       );

       return this.calculateFunnelMetrics(analysis);
     }

     // Cohort analysis
     async generateCohortAnalysis(period: 'weekly' | 'monthly'): Promise<CohortData> {
       const cohorts = await this.database.query(`
         SELECT 
           DATE_TRUNC('${period}', first_booking_date) as cohort,
           DATE_TRUNC('${period}', booking_date) as period,
           COUNT(DISTINCT user_id) as users,
           SUM(total_amount) as revenue
         FROM user_booking_cohorts
         GROUP BY cohort, period
         ORDER BY cohort, period
       `);

       return this.processCohortData(cohorts);
     }
   }
   ```

2. MARKETING AUTOMATION SYSTEM:
   Build comprehensive marketing automation and customer lifecycle management:

   ```typescript
   interface MarketingAutomation {
     campaigns: {
       email: 'Automated email sequences';
       sms: 'SMS marketing campaigns';
       push: 'Push notification campaigns';
       retargeting: 'Ad retargeting campaigns';
     };
     triggers: {
       welcome: 'New user onboarding sequence';
       abandoned: 'Abandoned booking recovery';
       reactivation: 'Inactive user re-engagement';
       loyalty: 'Repeat customer rewards';
       referral: 'Referral program automation';
     };
     segmentation: {
       behavioral: 'Behavior-based user segments';
       demographic: 'Geographic and demographic segments';
       transactional: 'Purchase history segments';
       engagement: 'Engagement level segments';
     };
   }
   ```

   Marketing Automation Implementation:
   ```typescript
   // Customer lifecycle management
   class CustomerLifecycleManager {
     // Automated campaign triggers
     async triggerWelcomeSequence(userId: string): Promise<void> {
       const user = await this.userService.getUser(userId);
       
       // Schedule welcome email sequence
       await this.emailService.scheduleSequence('welcome', user.email, {
         day0: 'welcome_email',
         day1: 'how_to_book_guide',
         day3: 'first_booking_incentive',
         day7: 'service_area_highlights'
       });

       // Track campaign enrollment
       await this.analytics.track('campaign_enrolled', {
         userId,
         campaign: 'welcome_sequence',
         channel: 'email'
       });
     }

     // Abandoned booking recovery
     async handleAbandonedBooking(sessionData: BookingSession): Promise<void> {
       if (sessionData.lastStep === 'payment' && sessionData.userId) {
         // Send immediate recovery email
         await this.emailService.send('abandoned_booking_immediate', {
           user: await this.userService.getUser(sessionData.userId),
           booking: sessionData.bookingData,
           recoveryLink: this.generateRecoveryLink(sessionData.id)
         });

         // Schedule follow-up sequence
         await this.scheduleFollowUpSequence(sessionData.userId, sessionData.id);
       }
     }

     // Customer segmentation
     async segmentCustomers(): Promise<CustomerSegments> {
       const segments = await this.database.query(`
         SELECT 
           user_id,
           CASE 
             WHEN booking_count = 0 THEN 'prospect'
             WHEN booking_count = 1 THEN 'new_customer'
             WHEN booking_count BETWEEN 2 AND 5 THEN 'regular_customer'
             WHEN booking_count > 5 THEN 'vip_customer'
           END as segment,
           last_booking_date,
           total_revenue,
           avg_booking_value
         FROM customer_metrics
       `);

       return this.processSegmentData(segments);
     }
   }
   ```

3. CUSTOMER PERSONALIZATION ENGINE:
   Implement AI-driven personalization and recommendations:

   ```typescript
   interface PersonalizationEngine {
     recommendations: {
       serviceType: 'Recommend service type based on history';
       timing: 'Suggest optimal booking times';
       enhancements: 'Recommend add-ons based on preferences';
       pricing: 'Dynamic pricing based on demand';
     };
     personalization: {
       homepage: 'Personalized homepage content';
       emailContent: 'Dynamic email personalization';
       offerOptimization: 'Personalized offers and discounts';
       locationSuggestions: 'Smart location suggestions';
     };
     prediction: {
       churnRisk: 'Predict customer churn probability';
       ltv: 'Predict customer lifetime value';
       demandForecasting: 'Predict booking demand';
       priceOptimization: 'Optimize pricing strategies';
     };
   }
   ```

   Personalization Implementation:
   ```typescript
   // AI-powered recommendation engine
   class RecommendationEngine {
     // Service recommendations
     async getServiceRecommendations(userId: string): Promise<ServiceRecommendation[]> {
       const userHistory = await this.getUserBookingHistory(userId);
       const userPreferences = await this.getUserPreferences(userId);
       
       // Machine learning model for recommendations
       const recommendations = await this.mlService.predict('service_recommendation', {
         userHistory,
         userPreferences,
         timeOfDay: new Date().getHours(),
         dayOfWeek: new Date().getDay(),
         seasonality: this.getSeasonality()
       });

       return recommendations.map(r => ({
         serviceType: r.service,
         confidence: r.probability,
         reasoning: r.factors,
         expectedSatisfaction: r.satisfaction_score
       }));
     }

     // Dynamic pricing optimization
     async optimizePricing(bookingRequest: BookingRequest): Promise<PricingOptimization> {
       const demandForecast = await this.getDemandForecast(bookingRequest.dateTime);
       const competitorPricing = await this.getCompetitorPricing(bookingRequest.route);
       const customerSegment = await this.getCustomerSegment(bookingRequest.userId);

       const optimizedPrice = await this.mlService.predict('price_optimization', {
         basePrice: bookingRequest.basePrice,
         demand: demandForecast,
         competition: competitorPricing,
         customerSegment,
         timeToService: bookingRequest.timeToService
       });

       return {
         recommendedPrice: optimizedPrice.price,
         priceElasticity: optimizedPrice.elasticity,
         expectedConversion: optimizedPrice.conversion_probability,
         revenueImpact: optimizedPrice.revenue_impact
       };
     }

     // Churn prediction
     async predictChurn(userId: string): Promise<ChurnPrediction> {
       const userMetrics = await this.getUserEngagementMetrics(userId);
       const prediction = await this.mlService.predict('churn_prediction', userMetrics);

       if (prediction.churn_probability > 0.7) {
         // Trigger retention campaign
         await this.customerLifecycleManager.triggerRetentionCampaign(userId);
       }

       return {
         churnProbability: prediction.churn_probability,
         riskFactors: prediction.risk_factors,
         retentionActions: prediction.recommended_actions
       };
     }
   }
   ```

4. A/B TESTING & CONVERSION OPTIMIZATION:
   Implement comprehensive testing framework for continuous optimization:

   ```typescript
   interface ABTestingFramework {
     testTypes: {
       ui: 'User interface variations';
       pricing: 'Pricing strategy tests';
       messaging: 'Email and SMS content tests';
       flow: 'User flow optimizations';
       features: 'Feature flag testing';
     };
     metrics: {
       primary: 'Conversion rate, revenue per user';
       secondary: 'Engagement, satisfaction, retention';
     };
     statistical: {
       significance: '95% confidence level';
       power: '80% statistical power';
       minimumSampleSize: 'Calculated per test';
     };
   }
   ```

   A/B Testing Implementation:
   ```typescript
   // A/B testing service
   class ABTestingService {
     // Create and manage tests
     async createTest(testConfig: ABTestConfig): Promise<ABTest> {
       const test = await this.database.abTests.create({
         name: testConfig.name,
         hypothesis: testConfig.hypothesis,
         variants: testConfig.variants,
         trafficAllocation: testConfig.trafficAllocation,
         primaryMetric: testConfig.primaryMetric,
         secondaryMetrics: testConfig.secondaryMetrics,
         startDate: testConfig.startDate,
         estimatedDuration: testConfig.estimatedDuration,
         minimumSampleSize: this.calculateSampleSize(testConfig)
       });

       // Initialize test in feature flag service
       await this.featureFlagService.createTest(test.id, testConfig.variants);

       return test;
     }

     // Assign user to test variant
     async assignVariant(testId: string, userId: string): Promise<string> {
       const test = await this.getTest(testId);
       if (!test.isActive) return 'control';

       // Check if user already assigned
       const existingAssignment = await this.getUserAssignment(testId, userId);
       if (existingAssignment) return existingAssignment.variant;

       // Assign based on traffic allocation
       const variant = this.getRandomVariant(test.trafficAllocation);
       
       await this.database.testAssignments.create({
         testId,
         userId,
         variant,
         assignedAt: new Date()
       });

       return variant;
     }

     // Track test events
     async trackEvent(testId: string, userId: string, event: string, value?: number): Promise<void> {
       await this.database.testEvents.create({
         testId,
         userId,
         event,
         value,
         timestamp: new Date()
       });

       // Check if test has reached significance
       await this.checkTestSignificance(testId);
     }

     // Statistical analysis
     async analyzeTest(testId: string): Promise<TestAnalysis> {
       const test = await this.getTest(testId);
       const results = await this.database.query(`
         SELECT 
           variant,
           COUNT(DISTINCT user_id) as users,
           COUNT(*) as events,
           AVG(value) as mean_value,
           STDDEV(value) as std_dev
         FROM test_events 
         WHERE test_id = $1 AND event = $2
         GROUP BY variant
       `, [testId, test.primaryMetric]);

       return this.performStatisticalAnalysis(results);
     }
   }
   ```

5. ADVANCED BUSINESS INTELLIGENCE:
   Create sophisticated reporting and business intelligence tools:

   ```typescript
   interface BusinessIntelligence {
     dashboards: {
       executive: 'High-level KPIs and trends';
       operations: 'Operational metrics and efficiency';
       marketing: 'Campaign performance and ROI';
       financial: 'Revenue, costs, and profitability';
     };
     reports: {
       cohortAnalysis: 'Customer cohort performance';
       geoAnalysis: 'Geographic performance analysis';
       serviceAnalysis: 'Service type profitability';
       demandForecasting: 'Predictive demand analysis';
     };
     alerts: {
       performanceThresholds: 'Automated performance alerts';
       anomalyDetection: 'Unusual pattern detection';
       opportunityIdentification: 'Growth opportunity alerts';
     };
   }
   ```

   Business Intelligence Implementation:
   ```typescript
   // Advanced reporting service
   class BusinessIntelligenceService {
     // Executive dashboard
     async getExecutiveDashboard(dateRange: DateRange): Promise<ExecutiveDashboard> {
       const [revenue, bookings, customers, performance] = await Promise.all([
         this.getRevenueMetrics(dateRange),
         this.getBookingMetrics(dateRange),
         this.getCustomerMetrics(dateRange),
         this.getPerformanceMetrics(dateRange)
       ]);

       return {
         revenue: {
           total: revenue.total,
           growth: revenue.growthRate,
           forecast: revenue.forecast,
           segments: revenue.bySegment
         },
         bookings: {
           total: bookings.total,
           conversionRate: bookings.conversionRate,
           averageValue: bookings.averageValue,
           serviceTypes: bookings.byServiceType
         },
         customers: {
           total: customers.total,
           newCustomers: customers.new,
           retention: customers.retentionRate,
           lifetime: customers.averageLifetimeValue
         },
         performance: {
           systemUptime: performance.uptime,
           responseTime: performance.averageResponseTime,
           errorRate: performance.errorRate,
           customerSatisfaction: performance.satisfactionScore
         }
       };
     }

     // Predictive analytics
     async generateDemandForecast(horizon: number): Promise<DemandForecast> {
       const historicalData = await this.getHistoricalBookingData();
       const externalFactors = await this.getExternalFactors(); // weather, events, etc.

       const forecast = await this.mlService.predict('demand_forecasting', {
         historical: historicalData,
         external: externalFactors,
         horizon,
         seasonality: true,
         trends: true
       });

       return {
         periods: forecast.periods,
         confidence: forecast.confidence_intervals,
         factors: forecast.influencing_factors,
         recommendations: forecast.operational_recommendations
       };
     }

     // Anomaly detection
     async detectAnomalies(): Promise<Anomaly[]> {
       const metrics = await this.getCurrentMetrics();
       const anomalies = await this.mlService.detectAnomalies(metrics);

       // Send alerts for significant anomalies
       const significantAnomalies = anomalies.filter(a => a.severity > 0.8);
       await Promise.all(
         significantAnomalies.map(anomaly => 
           this.alertService.sendAnomalyAlert(anomaly)
         )
       );

       return anomalies;
     }
   }
   ```

TECHNICAL IMPLEMENTATION:

Advanced Analytics Stack:
```
analytics/
├── tracking/
│   ├── GoogleAnalyticsService.ts    # GA4 integration
│   ├── MixpanelService.ts           # Event tracking
│   ├── AmplitudeService.ts          # User journey analytics
│   └── CustomAnalyticsService.ts    # Internal analytics
├── ml/
│   ├── RecommendationEngine.ts      # ML-powered recommendations
│   ├── ChurnPredictionModel.ts      # Customer churn prediction
│   ├── PricingOptimization.ts       # Dynamic pricing
│   └── DemandForecasting.ts         # Demand prediction
├── testing/
│   ├── ABTestingService.ts          # A/B testing framework
│   ├── FeatureFlagService.ts        # Feature flag management
│   └── StatisticalAnalysis.ts       # Statistical calculations
├── reporting/
│   ├── DashboardService.ts          # BI dashboards
│   ├── ReportGenerator.ts           # Automated reports
│   └── DataExportService.ts         # Data export utilities
```

Database Schema for Analytics:
```sql
-- User behavior tracking
CREATE TABLE user_events (
    id SERIAL PRIMARY KEY,
    user_id UUID,
    session_id VARCHAR(255),
    event_name VARCHAR(100) NOT NULL,
    event_properties JSONB,
    page_url TEXT,
    referrer TEXT,
    user_agent TEXT,
    ip_address INET,
    timestamp TIMESTAMP DEFAULT NOW()
);

-- A/B testing
CREATE TABLE ab_tests (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    hypothesis TEXT,
    variants JSONB NOT NULL,
    traffic_allocation JSONB NOT NULL,
    primary_metric VARCHAR(100),
    secondary_metrics JSONB,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE test_assignments (
    id SERIAL PRIMARY KEY,
    test_id INTEGER REFERENCES ab_tests(id),
    user_id UUID NOT NULL,
    variant VARCHAR(100) NOT NULL,
    assigned_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(test_id, user_id)
);

-- Customer segments
CREATE TABLE customer_segments (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    segment_name VARCHAR(100) NOT NULL,
    segment_value VARCHAR(255),
    confidence_score DECIMAL(3,2),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Predictive models
CREATE TABLE ml_predictions (
    id SERIAL PRIMARY KEY,
    model_name VARCHAR(100) NOT NULL,
    entity_id VARCHAR(255) NOT NULL,
    prediction_type VARCHAR(100) NOT NULL,
    prediction_value JSONB NOT NULL,
    confidence_score DECIMAL(3,2),
    model_version VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);
```

Marketing Automation Configuration:
```typescript
// Campaign configuration
const marketingCampaigns = {
  welcome: {
    trigger: 'user_registered',
    sequence: [
      { delay: 0, template: 'welcome_email', channel: 'email' },
      { delay: 24, template: 'booking_guide', channel: 'email' },
      { delay: 72, template: 'first_ride_discount', channel: 'email' },
      { delay: 168, template: 'service_highlights', channel: 'email' }
    ]
  },
  abandonedBooking: {
    trigger: 'booking_abandoned',
    conditions: { step: 'payment', timeElapsed: 30 },
    sequence: [
      { delay: 0, template: 'abandoned_immediate', channel: 'email' },
      { delay: 60, template: 'abandoned_discount', channel: 'email' },
      { delay: 1440, template: 'abandoned_final', channel: 'sms' }
    ]
  },
  reactivation: {
    trigger: 'user_inactive',
    conditions: { daysSinceLastBooking: 30 },
    sequence: [
      { delay: 0, template: 'miss_you', channel: 'email' },
      { delay: 168, template: 'special_offer', channel: 'email' },
      { delay: 336, template: 'final_attempt', channel: 'sms' }
    ]
  }
};
```

API Endpoints for Analytics:
```
-- Analytics tracking
POST /api/analytics/track             # Track custom events
POST /api/analytics/identify          # Identify user properties
GET  /api/analytics/funnel            # Funnel analysis
GET  /api/analytics/cohorts           # Cohort analysis

-- A/B testing
POST /api/testing/tests               # Create A/B test
GET  /api/testing/assignment/:testId  # Get user assignment
POST /api/testing/track               # Track test events
GET  /api/testing/results/:testId     # Test results

-- Marketing automation
POST /api/marketing/campaigns         # Create campaign
POST /api/marketing/trigger           # Trigger campaign
GET  /api/marketing/performance       # Campaign performance
PUT  /api/marketing/segments          # Update user segments

-- Business intelligence
GET  /api/bi/dashboard/executive      # Executive dashboard
GET  /api/bi/reports/custom           # Custom reports
GET  /api/bi/forecast/demand          # Demand forecasting
GET  /api/bi/anomalies                # Anomaly detection
```

Real-time Analytics Dashboard:
```typescript
// Real-time dashboard component
const AnalyticsDashboard = () => {
  const [metrics, setMetrics] = useState<RealtimeMetrics>();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const ws = new WebSocket('/analytics/realtime');
    
    ws.onopen = () => setIsConnected(true);
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMetrics(data);
    };
    ws.onclose = () => setIsConnected(false);

    return () => ws.close();
  }, []);

  return (
    <div className="analytics-dashboard">
      <MetricsGrid metrics={metrics} />
      <RealtimeChart data={metrics?.timeSeriesData} />
      <ConversionFunnel data={metrics?.funnelData} />
      <UserSegments data={metrics?.segmentData} />
    </div>
  );
};
```

ACCEPTANCE CRITERIA:
- ✅ User behavior tracking captures all key interactions
- ✅ Marketing automation triggers work based on user actions
- ✅ A/B testing framework supports multiple concurrent tests
- ✅ Recommendation engine provides relevant suggestions
- ✅ Churn prediction model achieves >80% accuracy
- ✅ Executive dashboard shows real-time business metrics
- ✅ Demand forecasting provides actionable insights
- ✅ Anomaly detection alerts on significant issues
- ✅ Customer segmentation updates automatically
- ✅ Report generation and scheduling works reliably

PERFORMANCE REQUIREMENTS:
- Analytics events processed in <100ms
- Dashboard loads in <2 seconds
- ML predictions generated in <500ms
- Real-time updates with <1 second latency
- Report generation completes in <30 seconds

PRIVACY & COMPLIANCE:
- GDPR-compliant data collection and processing
- User consent management for tracking
- Data anonymization for analytics
- Right to deletion implementation
- Cookie policy and consent management

Focus on creating a data-driven business intelligence platform that enables continuous optimization and growth while respecting user privacy and maintaining high performance standards.
```

---

## Summary: Complete Claude Code Implementation Guide

These 11 comprehensive sprint prompts provide Claude Code with:

### **🎯 Technical Precision**
- Exact TypeScript interfaces and implementations
- Database schemas with proper relationships
- API endpoint specifications with examples
- Component architecture and file structures
- Testing strategies and acceptance criteria

### **📈 Business Logic Integration**
- Real-world pricing algorithms and business rules
- Customer lifecycle management workflows
- Marketing automation and analytics frameworks
- Admin controls for business configuration
- Scalable architecture for growth

### **🔒 Production-Ready Features**
- Security best practices and authentication
- Performance optimization and monitoring
- Comprehensive testing and quality assurance
- Deployment infrastructure and procedures
- Advanced analytics and business intelligence

### **🚀 Competitive Advantages**
- Premium transportation service positioning
- Enterprise-level admin and reporting tools
- AI-powered personalization and optimization
- Comprehensive customer experience management
- Scalable multi-driver fleet preparation

Each sprint builds progressively on the previous work, ensuring Claude Code can implement a complete, production-ready transportation booking platform that competes with industry leaders while maintaining the premium, personal touch that differentiates Stable Ride.

The prompts are designed to be self-contained yet interconnected, allowing for flexible implementation while ensuring all critical features are covered comprehensively.