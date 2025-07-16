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

I'll continue with the remaining sprints in the next part. Would you like me to proceed with Sprint 8 (Admin Panel) and the remaining sprints?