# React Native Driver App - Claude Code Implementation Guide (Part 1)

## Overview & Context

This guide provides step-by-step instructions for Claude Code to build a streamlined React Native driver app that integrates seamlessly with the existing Stable Ride web platform. The app is designed for solo driver operations, focusing on schedule management, navigation, customer communication, and earnings tracking.

**Prerequisites:** Completed web platform from Sprints 1-11 with established API, database, and business logic.

---

## Phase 1: Foundation & Setup (Week 1)

### Step 1.1: Project Setup and Architecture Analysis

**Claude Code Prompt:**
```
I need to create a React Native driver app that integrates with my existing Stable Ride web platform. 

CONTEXT:
- Existing web platform: React + TypeScript frontend, Node.js + Express backend, PostgreSQL database
- Authentication: JWT tokens with refresh mechanism
- API: RESTful endpoints for bookings, customers, payments, admin
- Current booking flow: Users book rides through web, stored in PostgreSQL
- Need: Driver mobile app to manage scheduled rides, navigation, customer communication

CURRENT ARCHITECTURE ANALYSIS:
Please first analyze the existing codebase structure and identify:
1. Shared services that can be reused (authentication, API calls, types)
2. Existing API endpoints relevant to driver functionality
3. Database schema for bookings, users, and related data
4. Authentication flow and JWT token management

TASK 1.1: PROJECT SETUP
Set up React Native project with this structure:

```
stable-ride-driver/
├── src/
│   ├── components/           # Reusable UI components
│   ├── screens/             # App screens
│   ├── services/            # API and business logic services
│   ├── hooks/               # Custom React hooks
│   ├── types/               # TypeScript interfaces
│   ├── utils/               # Helper functions
│   ├── navigation/          # Navigation configuration
│   └── constants/           # App constants
├── shared/                  # Shared code from web platform
│   ├── api/                # API service layer
│   ├── types/              # Shared TypeScript types
│   └── utils/              # Shared utilities
```

REQUIREMENTS:
- React Native with TypeScript
- React Navigation 6 for app navigation
- React Native Maps for GPS/mapping
- AsyncStorage for local persistence
- React Query for API state management
- Expo (recommend for easier development)

ACCEPTANCE CRITERIA:
- ✅ Project initializes and runs on simulator/device
- ✅ TypeScript configuration is properly set up
- ✅ Navigation structure is established
- ✅ Shared folder links to existing web platform code
- ✅ Basic app structure with placeholder screens

Please implement the project setup and basic architecture, ensuring maximum code reuse from the existing web platform.
```

### Step 1.2: Shared Services Integration

**Claude Code Prompt:**
```
TASK 1.2: INTEGRATE SHARED SERVICES FROM WEB PLATFORM

CONTEXT:
The web platform has established services for authentication, API communication, and data management. We need to adapt these for React Native while maintaining compatibility.

SHARED SERVICES TO ADAPT:
1. Authentication Service (JWT token management)
2. API Service (HTTP client with interceptors)
3. Booking Service (ride/booking management)
4. Customer Service (customer data management)
5. TypeScript Interfaces (User, Booking, Location, etc.)

IMPLEMENTATION REQUIREMENTS:

1. CREATE SHARED API SERVICE:
```typescript
// shared/services/apiService.ts
interface ApiConfig {
  baseURL: string;
  timeout: number;
  headers: Record<string, string>;
}

class ApiService {
  // HTTP client with automatic token attachment
  // Request/response interceptors
  // Error handling
  // Retry logic
}
```

2. ADAPT AUTHENTICATION SERVICE:
```typescript
// shared/services/authService.ts
interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

class AuthService {
  // Token storage using AsyncStorage (not localStorage)
  // Biometric authentication integration
  // Auto token refresh
  // Login/logout methods
}
```

3. CREATE BOOKING SERVICE:
```typescript
// shared/services/bookingService.ts
interface DriverBookingService {
  // Get driver's scheduled rides
  // Update ride status
  // Complete rides
  // Get ride details
}
```

MOBILE-SPECIFIC ADAPTATIONS:
- Replace localStorage with AsyncStorage
- Add biometric authentication support
- Implement background task handling
- Add offline capability preparation

ACCEPTANCE CRITERIA:
- ✅ Shared services work identically to web platform
- ✅ Authentication persists across app restarts
- ✅ API calls work with existing backend endpoints
- ✅ TypeScript types are shared and consistent
- ✅ Error handling works properly on mobile

Focus on maintaining 90% code compatibility with existing web platform while adapting for React Native specific needs.
```

### Step 1.3: Driver Authentication Screen

**Claude Code Prompt:**
```
TASK 1.3: IMPLEMENT DRIVER AUTHENTICATION

CONTEXT:
Create a simple, secure login screen for the driver (you) with biometric authentication support. This should integrate with the existing authentication system from the web platform.

REQUIREMENTS:

1. LOGIN SCREEN UI:
- Clean, professional design matching web platform
- Email and password fields
- "Remember Me" toggle
- Biometric authentication option (Face ID/Touch ID)
- Loading states and error handling

2. AUTHENTICATION FLOW:
```typescript
interface DriverAuth {
  email: string;
  password: string;
  rememberDevice: boolean;
  biometricEnabled: boolean;
}

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: DriverUser | null;
  error: string | null;
}
```

3. BIOMETRIC INTEGRATION:
- Check device biometric capability
- Enable/disable biometric login
- Secure credential storage
- Fallback to password if biometric fails

4. SCREENS TO CREATE:
```
src/screens/auth/
├── LoginScreen.tsx           # Main login interface
├── BiometricSetupScreen.tsx  # Enable biometric auth
└── ForgotPasswordScreen.tsx  # Password reset (minimal)
```

5. AUTHENTICATION HOOK:
```typescript
// src/hooks/useAuth.ts
const useAuth = () => {
  // Login with email/password
  // Login with biometrics
  // Logout functionality
  // Auto-refresh tokens
  // Persist auth state
};
```

INTEGRATION POINTS:
- Use existing JWT token system from web platform
- Same API endpoints (/api/auth/login, /api/auth/refresh)
- Compatible with existing user management
- Maintain session across web and mobile

ACCEPTANCE CRITERIA:
- ✅ Login screen loads and functions properly
- ✅ Successful login navigates to main app
- ✅ Biometric authentication works (if supported)
- ✅ "Remember Me" persists login across app restarts
- ✅ Error messages display clearly
- ✅ Loading states provide feedback
- ✅ Integration with existing backend works seamlessly

Focus on simplicity since this is for your personal use, but maintain security best practices.
```

---

## Phase 2: Core Schedule Management (Week 2)

### Step 2.1: Today's Schedule Screen

**Claude Code Prompt:**
```
TASK 2.1: BUILD TODAY'S SCHEDULE SCREEN

CONTEXT:
This is the main screen you'll see when opening the app. It should show today's booked rides in a clean, easily scannable format with quick actions for each ride.

REQUIREMENTS:

1. SCHEDULE DATA STRUCTURE:
```typescript
interface ScheduledRide {
  id: string;
  bookingReference: string;
  customer: {
    name: string;
    phone: string;
    email: string;
    preferredName?: string;
  };
  schedule: {
    pickupTime: Date;
    estimatedDuration: number;
    returnTime?: Date; // For roundtrip
  };
  locations: {
    pickup: Location;
    dropoff: Location;
    stops?: Location[]; // For hourly service
  };
  service: {
    type: 'one-way' | 'roundtrip' | 'hourly';
    enhancements: Enhancement[];
    specialRequests: string[];
    flightInfo?: FlightDetails;
  };
  earnings: {
    baseRate: number;
    enhancements: number;
    gratuity: number;
    total: number;
  };
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
}
```

2. TODAY'S SCHEDULE SCREEN LAYOUT:
```
┌─────────────────────────────────┐
│ Good Morning, [Your Name]       │
│ Today: 3 rides • $245 estimated│
├─────────────────────────────────┤
│ [ACTIVE RIDE CARD - if any]     │
├─────────────────────────────────┤
│ TODAY'S SCHEDULE                │
│ ┌─ 8:30 AM - Airport Pickup ──┐│
│ │ John Smith → DFW Terminal A  ││
│ │ [Navigate] [Call] [Details]  ││
│ └─────────────────────────────┘│
│ ┌─ 2:00 PM - Business Trip ───┐│
│ │ Sarah Johnson → Downtown     ││
│ │ [Navigate] [Call] [Details]  ││
│ └─────────────────────────────┘│
├─────────────────────────────────┤
│ [View This Week] [Earnings]     │
└─────────────────────────────────┘
```

3. COMPONENTS TO CREATE:
```typescript
// src/components/schedule/
├── TodayHeader.tsx          # Daily summary header
├── ActiveRideCard.tsx       # Current active ride (if any)
├── RideCard.tsx            # Individual ride display
├── QuickActions.tsx        # Navigate/Call/Details buttons
└── ScheduleList.tsx        # List of today's rides
```

4. API INTEGRATION:
```typescript
// src/services/scheduleService.ts
class ScheduleService {
  async getTodaySchedule(): Promise<ScheduledRide[]> {
    // GET /api/driver/schedule/today
  }
  
  async getWeekSchedule(): Promise<ScheduledRide[]> {
    // GET /api/driver/schedule/week
  }
  
  async getRideDetails(rideId: string): Promise<ScheduledRide> {
    // GET /api/driver/rides/{rideId}
  }
}
```

5. BACKEND ENDPOINT NEEDED:
```typescript
// Add to existing backend
GET /api/driver/schedule/today
Response: {
  rides: ScheduledRide[];
  summary: {
    totalRides: number;
    estimatedEarnings: number;
    totalHours: number;
  };
}
```

REAL-TIME FEATURES:
- Auto-refresh schedule every 5 minutes
- Push notifications for schedule changes
- Pull-to-refresh functionality

ACCEPTANCE CRITERIA:
- ✅ Today's schedule loads from existing booking data
- ✅ Rides display in chronological order
- ✅ Quick actions (Navigate, Call, Details) work
- ✅ Active ride (if any) is prominently displayed
- ✅ Pull-to-refresh updates the schedule
- ✅ Navigation to other screens works
- ✅ Handles empty state (no rides today)

This screen should feel like your personal assistant showing you exactly what you need to know for the day ahead.
```

### Step 2.2: Ride Details Screen

**Claude Code Prompt:**
```
TASK 2.2: BUILD COMPREHENSIVE RIDE DETAILS SCREEN

CONTEXT:
When you tap on a ride from the schedule, you need to see all relevant information about that booking in a clear, actionable format.

REQUIREMENTS:

1. RIDE DETAILS SCREEN LAYOUT:
```
┌─────────────────────────────────┐
│ ← Back          Ride Details    │
├─────────────────────────────────┤
│ CUSTOMER INFORMATION            │
│ John Smith (Preferred: Johnny)  │
│ ☎ (555) 123-4567               │
│ ✉ john.smith@email.com         │
├─────────────────────────────────┤
│ SERVICE DETAILS                 │
│ One-Way Service                 │
│ Pickup: 8:30 AM                │
│ Duration: ~45 minutes           │
│ Earnings: $75 + tip             │
├─────────────────────────────────┤
│ LOCATIONS                       │
│ 📍 123 Main St, Dallas         │
│     Home - Gate Code: 1234      │
│ 🔽                             │
│ ✈️ DFW Airport - Terminal A     │
│     Flight: AA 1234 (9:45 AM)   │
├─────────────────────────────────┤
│ SPECIAL REQUESTS                │
│ • Trip protection enabled       │
│ • Luggage assistance needed     │
│ • Prefers classical music       │
│ • Has mobility assistance dog   │
├─────────────────────────────────┤
│ [Start Ride] [Call Customer]    │
│ [Navigate to Pickup] [Messages] │
└─────────────────────────────────┘
```

2. CUSTOMER SECTION:
```typescript
interface CustomerDetails {
  personalInfo: {
    fullName: string;
    preferredName?: string;
    phone: string;
    email: string;
  };
  preferences: {
    temperature?: 'cool' | 'comfortable' | 'warm';
    music?: string;
    conversation?: 'chatty' | 'quiet' | 'business';
  };
  notes: string[]; // Previous ride notes
}
```

3. SERVICE DETAILS SECTION:
```typescript
interface ServiceDetails {
  type: 'one-way' | 'roundtrip' | 'hourly';
  timing: {
    pickupTime: Date;
    returnTime?: Date;
    estimatedDuration: number;
    bufferTime: number;
  };
  pricing: {
    baseRate: number;
    enhancements: number;
    estimatedTip: number;
    total: number;
  };
  enhancements: Enhancement[];
}
```

4. LOCATION DETAILS:
```typescript
interface LocationDetails {
  pickup: {
    address: string;
    specialInstructions?: string;
    gateCode?: string;
    accessNotes?: string;
  };
  dropoff: {
    address: string;
    terminal?: string;
    gate?: string;
    meetingPoint?: string;
  };
  flightInfo?: {
    airline: string;
    flightNumber: string;
    scheduledTime: Date;
    actualTime?: Date;
    status: 'on-time' | 'delayed' | 'cancelled';
  };
}
```

5. ACTION BUTTONS:
- **Start Ride** - Initiates active ride mode
- **Navigate to Pickup** - Opens preferred map app
- **Call Customer** - Direct phone call
- **Send Message** - Quick message interface
- **View Earnings** - Detailed earnings breakdown

6. COMPONENTS TO CREATE:
```typescript
// src/components/ride-details/
├── CustomerCard.tsx         # Customer information display
├── ServiceCard.tsx         # Service type and timing
├── LocationCard.tsx        # Pickup/dropoff with special instructions
├── EnhancementsCard.tsx    # Trip enhancements and special requests
├── ActionButtons.tsx       # Primary action buttons
└── FlightTracker.tsx       # Flight information (if applicable)
```

INTEGRATION FEATURES:
- Real-time flight tracking (if flight info available)
- One-tap phone calling
- GPS navigation launch
- Customer preference history

ACCEPTANCE CRITERIA:
- ✅ All ride information displays clearly and completely
- ✅ Customer contact methods work (call/message)
- ✅ Navigation launches preferred map app with destination
- ✅ Flight information updates in real-time (if available)
- ✅ Special requests and preferences are prominently shown
- ✅ Action buttons are large and easily tappable
- ✅ Previous customer notes/preferences display
- ✅ Earnings breakdown is clear and accurate

This screen should give you everything you need to provide excellent, personalized service to each customer.
```

### Step 2.3: Weekly Schedule View

**Claude Code Prompt:**
```
TASK 2.3: BUILD WEEKLY SCHEDULE OVERVIEW

CONTEXT:
You need to see your week ahead to plan routes, identify busy periods, and manage your time effectively.

REQUIREMENTS:

1. WEEKLY CALENDAR LAYOUT:
```
┌─────────────────────────────────┐
│ ← Back      This Week           │
│          Feb 12-18, 2024        │
├─────────────────────────────────┤
│ Mon 12  Tue 13  Wed 14  Thu 15 │
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐│
│ │8:30 │ │9:00 │ │     │ │7:00 ││
│ │2:00 │ │1:30 │ │10:00│ │2:30 ││
│ │5:30 │ │     │ │4:00 │ │     ││
│ └─────┘ └─────┘ └─────┘ └─────┘│
│                                 │
│ Fri 16  Sat 17  Sun 18         │
│ ┌─────┐ ┌─────┐ ┌─────┐        │
│ │11:00│ │9:00 │ │     │        │
│ │6:00 │ │11:30│ │2:00 │        │
│ │     │ │8:00 │ │     │        │
│ └─────┘ └─────┘ └─────┘        │
├─────────────────────────────────┤
│ Week Summary:                   │
│ 12 rides • $640 estimated       │
│ Busiest: Tuesday (3 rides)      │
│ Longest: Wed 4:00 PM (2.5 hrs)  │
└─────────────────────────────────┘
```

2. WEEKLY SCHEDULE DATA:
```typescript
interface WeeklySchedule {
  weekRange: {
    startDate: Date;
    endDate: Date;
  };
  dailySchedules: DailySchedule[];
  summary: {
    totalRides: number;
    estimatedEarnings: number;
    busiestDay: string;
    longestRide: {
      day: string;
      duration: number;
      service: string;
    };
  };
}

interface DailySchedule {
  date: Date;
  rides: ScheduledRide[];
  dailyEarnings: number;
  workingHours: number;
}
```

3. COMPONENTS TO CREATE:
```typescript
// src/components/weekly/
├── WeeklyCalendar.tsx       # 7-day calendar grid
├── DayColumn.tsx           # Single day with time slots
├── RideSlot.tsx            # Individual ride time slot
├── WeekSummary.tsx         # Week statistics
└── WeekNavigation.tsx      # Previous/next week navigation
```

4. FEATURES:
- **Tap day** - Navigate to daily detail view
- **Tap ride** - Go to ride details
- **Swipe navigation** - Previous/next week
- **Week summary** - Key metrics and insights
- **Color coding** - Different service types, earnings levels
- **Conflict detection** - Highlight potential scheduling issues

5. TIME MANAGEMENT FEATURES:
```typescript
interface TimeManagement {
  conflictDetection: {
    overlappingRides: boolean;
    insufficientTravelTime: boolean;
    backToBackBookings: boolean;
  };
  travelTimeEstimates: {
    betweenRides: number;
    bufferTimeNeeded: number;
    routeOptimization: string[];
  };
  workloadAnalysis: {
    hoursPerDay: number;
    ridesPerDay: number;
    earningsPerDay: number;
    restPeriods: number;
  };
}
```

6. WEEK NAVIGATION:
- Previous/Next week buttons
- "Go to Today" quick action
- Month view option
- Search/filter rides

BUSINESS INSIGHTS:
- Identify peak booking periods
- Spot potential scheduling conflicts
- Calculate travel time between rides
- Show earnings distribution across the week

ACCEPTANCE CRITERIA:
- ✅ Weekly calendar shows all scheduled rides clearly
- ✅ Day/ride tapping navigates to appropriate detail screens
- ✅ Week navigation (previous/next) works smoothly
- ✅ Summary statistics are accurate and helpful
- ✅ Color coding makes different ride types easily distinguishable
- ✅ Conflict detection highlights potential issues
- ✅ Travel time estimates help with scheduling
- ✅ Performance is smooth with large number of rides

This view should help you plan your week effectively and identify optimization opportunities.
```

---

## Phase 3: Active Ride Management (Week 3)

### Step 3.1: Active Ride Interface

**Claude Code Prompt:**
```
TASK 3.1: BUILD ACTIVE RIDE MANAGEMENT INTERFACE

CONTEXT:
When you start a ride, you need a focused, driving-optimized interface that helps you navigate, communicate with customers, and track ride progress without distraction.

REQUIREMENTS:

1. ACTIVE RIDE SCREEN LAYOUT (DRIVING-FOCUSED):
```
┌─────────────────────────────────┐
│ ← End Ride          8:30 AM     │
├─────────────────────────────────┤
│ JOHN SMITH                      │
│ One-Way to DFW Terminal A       │
│ [📞] [💬] [🎵]                  │
├─────────────────────────────────┤
│ NAVIGATION                      │
│ 📍 Currently: 5 min to pickup   │
│ 🗺️ [OPEN MAPS] ETA: 8:25 AM    │
│ ⚠️ Traffic: Light delays        │
├─────────────────────────────────┤
│ RIDE STATUS                     │
│ 🚗 EN ROUTE TO PICKUP           │
│                                 │
│ ┌─────────────────────────────┐ │
│ │     ARRIVED AT PICKUP       │ │
│ │        TAP WHEN READY       │ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ SPECIAL NOTES                   │
│ • Flight AA 1234 at 9:45 AM     │
│ • Luggage assistance needed     │
│ • Gate code: 1234               │
└─────────────────────────────────┘
```

2. RIDE STATUS FLOW:
```typescript
interface RideStatus {
  current: 'en_route_pickup' | 'arrived_pickup' | 'passenger_aboard' | 'en_route_destination' | 'arrived_destination' | 'completed';
  timeline: {
    rideStarted?: Date;
    departedToPickup?: Date;
    arrivedAtPickup?: Date;
    passengerAboard?: Date;
    arrivedAtDestination?: Date;
    rideCompleted?: Date;
  };
  location: {
    currentLat: number;
    currentLng: number;
    destination: Location;
    eta: Date;
  };
}
```

3. LARGE STATUS BUTTON PROGRESSION:
```typescript
const statusProgression = {
  'en_route_pickup': {
    button: 'ARRIVED AT PICKUP',
    action: 'markArrivedAtPickup',
    color: 'blue',
    autoNotify: 'Customer notified of your arrival'
  },
  'arrived_pickup': {
    button: 'PASSENGER ABOARD',
    action: 'markPassengerAboard',
    color: 'green',
    autoNotify: 'Trip started notification sent'
  },
  'passenger_aboard': {
    button: 'ARRIVED AT DESTINATION',
    action: 'markArrivedAtDestination',
    color: 'orange',
    autoNotify: 'Arrival notification sent'
  },
  'arrived_destination': {
    button: 'COMPLETE RIDE',
    action: 'completeRide',
    color: 'purple',
    autoNotify: 'Ride completion processed'
  }
};
```

4. NAVIGATION INTEGRATION:
```typescript
interface NavigationIntegration {
  mapProviders: {
    google: 'Google Maps',
    waze: 'Waze',
    apple: 'Apple Maps'
  };
  actions: {
    launchNavigation: (destination: Location) => void;
    shareLocation: (customer: Customer) => void;
    updateETA: (newETA: Date) => void;
  };
  tracking: {
    currentLocation: Location;
    isTracking: boolean;
    shareWithCustomer: boolean;
  };
}
```

5. CUSTOMER COMMUNICATION PANEL:
```typescript
interface CustomerCommunication {
  quickActions: {
    call: () => void;           // 📞 Direct call
    message: () => void;        // 💬 Quick messages
    music: () => void;          // 🎵 Music preferences
  };
  quickMessages: [
    "On my way to pickup location",
    "Arriving in 5 minutes",
    "I've arrived at pickup",
    "Running 5 minutes late due to traffic",
    "Please meet me at the pickup location"
  ];
  autoNotifications: {
    onArrival: boolean;
    onDeparture: boolean;
    onDelay: boolean;
  };
}
```

6. COMPONENTS TO CREATE:
```typescript
// src/components/active-ride/
├── ActiveRideHeader.tsx     # Customer name and service type
├── NavigationPanel.tsx      # Map integration and ETA
├── StatusButton.tsx         # Large status progression button
├── QuickCommunication.tsx   # Call/message/preferences
├── SpecialNotes.tsx         # Important ride information
└── RideTimer.tsx           # Trip duration tracking
```

SAFETY FEATURES:
- Large, easy-to-tap buttons
- Voice command integration (future)
- Minimal text input while driving
- Emergency contact quick access
- One-handed operation optimized

ACCEPTANCE CRITERIA:
- ✅ Status progression works smoothly through all stages
- ✅ Large buttons are easily tappable while driving
- ✅ Navigation launches preferred map app correctly
- ✅ Customer notifications send automatically at each stage
- ✅ Communication features work reliably
- ✅ Special notes and requirements are prominently displayed
- ✅ Location sharing works properly (if enabled)
- ✅ Interface is optimized for single-handed use

This interface should keep you focused on driving while ensuring excellent customer service.
```

### Step 3.2: GPS Navigation & Location Tracking

**Claude Code Prompt:**
```
TASK 3.2: IMPLEMENT GPS NAVIGATION AND LOCATION TRACKING

CONTEXT:
Integrate with device GPS and map applications to provide seamless navigation and optional customer location sharing.

REQUIREMENTS:

1. LOCATION TRACKING SERVICE:
```typescript
interface LocationService {
  permissions: {
    requestLocationPermission(): Promise<boolean>;
    requestBackgroundPermission(): Promise<boolean>;
    checkPermissionStatus(): Promise<'granted' | 'denied' | 'restricted'>;
  };
  tracking: {
    startTracking(): Promise<void>;
    stopTracking(): Promise<void>;
    getCurrentLocation(): Promise<Location>;
    watchLocation(callback: (location: Location) => void): () => void;
  };
  settings: {
    accuracy: 'high' | 'balanced' | 'low';
    distanceFilter: number; // meters
    updateInterval: number; // milliseconds
  };
}
```

2. NAVIGATION INTEGRATION:
```typescript
interface NavigationService {
  providers: {
    googleMaps: {
      available: boolean;
      launchNavigation: (destination: Location) => Promise<void>;
    };
    waze: {
      available: boolean;
      launchNavigation: (destination: Location) => Promise<void>;
    };
    appleMaps: {
      available: boolean;
      launchNavigation: (destination: Location) => Promise<void>;
    };
  };
  
  // Launch user's preferred navigation app
  openNavigation(destination: Location, provider?: string): Promise<void>;
  
  // Calculate route information
  getRouteInfo(origin: Location, destination: Location): Promise<{
    distance: number;
    duration: number;
    eta: Date;
  }>;
}
```

3. CUSTOMER LOCATION SHARING:
```typescript
interface LocationSharing {
  isEnabled: boolean;
  shareLocation(customerId: string, rideId: string): Promise<void>;
  stopSharing(rideId: string): Promise<void>;
  updateCustomerLocation(location: Location): Promise<void>;
  
  // Customer receives updates like:
  // "Your driver is 5 minutes away"
  // "Your driver has arrived"
  // Real-time map showing driver location
}
```

4. MAP INTEGRATION COMPONENT:
```typescript
// src/components/navigation/MapPreview.tsx
interface MapPreviewProps {
  currentLocation: Location;
  destination: Location;
  showRoute?: boolean;
  onNavigate: () => void;
}

const MapPreview = ({ currentLocation, destination, showRoute, onNavigate }: MapPreviewProps) => {
  return (
    <View style={styles.mapContainer}>
      <MapView
        region={{
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        <Marker coordinate={currentLocation} title="You are here" />
        <Marker coordinate={destination} title="Destination" />
        {showRoute && <Polyline coordinates={[currentLocation, destination]} />}
      </MapView>
      
      <TouchableOpacity style={styles.navigateButton} onPress={onNavigate}>
        <Text>Open Navigation</Text>
      </TouchableOpacity>
    </View>
  );
};
```

5. LOCATION TRACKING HOOK:
```typescript
// src/hooks/useLocationTracking.ts
interface UseLocationTrackingResult {
  currentLocation: Location | null;
  isTracking: boolean;
  accuracy: number;
  error: string | null;
  startTracking: () => Promise<void>;
  stopTracking: () => void;
  shareWithCustomer: (customerId: string) => Promise<void>;
}

const useLocationTracking = (): UseLocationTrackingResult => {
  // Real-time location tracking
  // Battery optimization
  // Error handling
  // Permission management
};
```

6. BACKEND INTEGRATION:
```typescript
// Additional API endpoints needed:
POST /api/driver/location/share      # Start sharing location with customer
DELETE /api/driver/location/share    # Stop sharing location
PUT /api/driver/location/update      # Update current location
GET /api/driver/navigation/route     # Get route information

// WebSocket events for real-time updates:
// driver_location_update
// driver_eta_update
// driver_arrived
```

FEATURES TO IMPLEMENT:

1. **Permission Management:**
   - Request location permissions on first use
   - Explain why permissions are needed
   - Handle permission denied gracefully
   - Background location for active rides only

2. **Navigation Provider Selection:**
   - Detect installed navigation apps
   - User preference for default app
   - Fallback to built-in maps if preferred app unavailable

3. **Real-Time Tracking:**
   - Track location only during active rides
   - Send location updates to customer (optional)
   - Calculate and update ETAs
   - Handle poor GPS signal gracefully

4. **Battery Optimization:**
   - Adjust tracking frequency based on movement
   - Stop tracking when ride is complete
   - Use efficient location APIs
   - Background task management

ACCEPTANCE CRITERIA:
- ✅ Location permissions are handled properly
- ✅ GPS tracking starts/stops with ride status
- ✅ Navigation apps launch correctly with destination
- ✅ Customer location sharing works (when enabled)
- ✅ ETA calculations are accurate
- ✅ Battery usage is optimized
- ✅ Works properly in background during rides
- ✅ Handles poor GPS signal gracefully
- ✅ Location accuracy is sufficient for customer tracking

This should provide professional-level location services that enhance the customer experience.
```

### Step 3.3: Customer Communication System

**Claude Code Prompt:**
```
TASK 3.3: BUILD CUSTOMER COMMUNICATION SYSTEM

CONTEXT:
Create a streamlined communication system that allows professional, efficient customer interaction during rides.

REQUIREMENTS:

1. QUICK MESSAGE SYSTEM:
```typescript
interface QuickMessageSystem {
  templates: {
    departure: [
      "On my way to pickup location",
      "Departing now, arriving in [ETA] minutes",
      "Starting my drive to you"
    ];
    arrival: [
      "Arriving in 5 minutes",
      "Arriving in 2 minutes",
      "I've arrived at pickup location"
    ];
    delays: [
      "Running 5 minutes late due to traffic",
      "Slight delay due to previous ride",
      "Traffic is heavier than expected"
    ];
    instructions: [
      "Please meet me at the pickup location",
      "I'm in a [vehicle description]",
      "Please call when you're ready"
    ];
    completion: [
      "Thank you for riding with Stable Ride",
      "Hope you have a great day!",
      "Safe travels!"
    ];
  };
  
  customMessage: {
    compose: string;
    send: (message: string, customerId: string) => Promise<void>;
  };
}
```

2. COMMUNICATION INTERFACE:
```
┌─────────────────────────────────┐
│ ← Back    Message John Smith    │
├─────────────────────────────────┤
│ QUICK MESSAGES                  │
│ ┌─────────────────────────────┐ │
│ │ On my way to pickup         │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ Arriving in 5 minutes       │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ I've arrived at pickup      │ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ CUSTOM MESSAGE                  │
│ ┌─────────────────────────────┐ │
│ │ Type your message here...   │ │
│ │                             │ │
│ └─────────────────────────────┘ │
│           [SEND MESSAGE]         │
├─────────────────────────────────┤
│ RECENT MESSAGES                 │
│ You: "On my way" - 2 min ago    │
│ John: "Thank you!" - 1 min ago  │
└─────────────────────────────────┘
```

3. DIRECT CALLING INTEGRATION:
```typescript
interface CallingService {
  dialCustomer(phoneNumber: string): Promise<void>;
  dialEmergency(): Promise<void>;
  
  // Call history for reference
  callHistory: {
    customerId: string;
    phoneNumber: string;
    timestamp: Date;
    duration?: number;
  }[];
}
```

4. AUTOMATIC NOTIFICATIONS:
```typescript
interface AutoNotifications {
  settings: {
    onDeparture: boolean;          // "Driver is on the way"
    onArrival: boolean;            // "Driver has arrived"
    onDelay: boolean;              // "Driver is running late"
    onCompletion: boolean;         // "Ride completed"
  };
  
  triggers: {
    sendDepartureNotification(customerId: string, eta: number): Promise<void>;
    sendArrivalNotification(customerId: string, location: string): Promise<void>;
    sendDelayNotification(customerId: string, delayMinutes: number): Promise<void>;
    sendCompletionNotification(customerId: string): Promise<void>;
  };
}
```

5. COMPONENTS TO CREATE:
```typescript
// src/components/communication/
├── QuickMessageGrid.tsx     # Grid of quick message buttons
├── CustomMessageInput.tsx   # Text input for custom messages
├── MessageHistory.tsx       # Recent message exchange
├── CallButton.tsx          # Large call customer button
├── AutoNotificationToggle.tsx # Enable/disable auto notifications
└── CommunicationModal.tsx   # Full-screen communication interface
```

6. COMMUNICATION HOOK:
```typescript
// src/hooks/useCommunication.ts
interface UseCommunicationResult {
  sendQuickMessage: (template: string, customerId: string) => Promise<void>;
  sendCustomMessage: (message: string, customerId: string) => Promise<void>;
  callCustomer: (phoneNumber: string) => Promise<void>;
  messageHistory: Message[];
  isLoading: boolean;
  error: string | null;
}

const useCommunication = (customerId: string): UseCommunicationResult => {
  // Message sending logic
  // Call integration
  // Message history management
  // Error handling
};
```

INTEGRATION WITH RIDE STATUS:
```typescript
// Automatic message triggers based on ride status
const autoMessageTriggers = {
  'en_route_pickup': () => sendQuickMessage('departure', customerId),
  'arrived_pickup': () => sendQuickMessage('arrival', customerId),
  'passenger_aboard': () => sendQuickMessage('trip_started', customerId),
  'arrived_destination': () => sendQuickMessage('completion', customerId)
};
```

BACKEND INTEGRATION:
```typescript
// API endpoints needed:
POST /api/driver/messages/send      # Send message to customer
GET  /api/driver/messages/history   # Get message history
POST /api/driver/notifications/auto # Send automatic notification
GET  /api/customers/:id/preferences # Get customer communication preferences
```

FEATURES:

1. **Quick Actions During Driving:**
   - Large, easy-to-tap message buttons
   - Voice-to-text for custom messages (future)
   - One-tap calling
   - Automatic notifications reduce manual messaging

2. **Professional Templates:**
   - Pre-written professional messages
   - Consistent tone and branding
   - Customizable with dynamic data (ETA, location)
   - Multiple language support (future)

3. **Customer Preferences:**
   - Some customers prefer calls over messages
   - Some prefer minimal communication
   - Remember preferences for future rides

4. **Message History:**
   - See recent communication with customer
   - Reference previous conversations
   - Track communication patterns

ACCEPTANCE CRITERIA:
- ✅ Quick message buttons send messages instantly
- ✅ Custom message input works with predictive text
- ✅ Direct calling integrates with device phone app
- ✅ Automatic notifications send at appropriate times
- ✅ Message history displays chronologically
- ✅ Interface is optimized for use while driving
- ✅ All messages maintain professional tone
- ✅ Communication preferences are respected
- ✅ Error handling works for failed messages

This system should make customer communication effortless while maintaining professionalism.
```

---

## Continue to Part 2

This completes Part 1 of the React Native Driver App Implementation Guide, covering Phases 1-3 (Foundation, Schedule Management, and Active Ride Management).

**Next:** Part 2 will cover Phases 4-5 (Earnings & Analytics, and Polish & Launch) with the remaining implementation steps.

**Ready for Claude Code:** You can start implementing these first 9 steps with Claude Code while I prepare Part 2 with the remaining phases.