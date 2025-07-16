import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { Layout } from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Toaster } from './components/ui/Toast'
import { Home } from './pages/Home'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { Dashboard } from './pages/Dashboard'
import { Booking } from './pages/Booking'
import { BookingNew } from './pages/BookingNew'
import { VerifyEmail } from './pages/auth/VerifyEmail'
import { ForgotPassword } from './pages/auth/ForgotPassword'
import { ResetPassword } from './pages/auth/ResetPassword'
import { SSOCallback } from './pages/auth/SSOCallback'
import { PaymentPage } from './pages/PaymentPage'
import { PaymentConfirmation } from './components/payment'
import { ModifyBooking } from './pages/ModifyBooking'
import { CancelBooking } from './pages/CancelBooking'
import { ProfileLayout } from './pages/Profile/ProfileLayout'
import { ProfileGeneral } from './pages/Profile/ProfileGeneral'
import { ProfileLocations } from './pages/Profile/ProfileLocations'
import { ProfileNotifications } from './pages/Profile/ProfileNotifications'
import { ProfilePaymentMethods } from './pages/Profile/ProfilePaymentMethods'
import { ThemeShowcase } from './pages/ThemeShowcase'

// Admin imports
import AdminLogin from './pages/admin/Login'
import AdminLayoutNew from './components/admin/AdminLayoutNew'
import AdminProtectedRoute from './components/admin/AdminProtectedRoute'
import AdminDashboard from './pages/admin/Dashboard'
import AdminBookings from './pages/admin/Bookings'
import AdminCustomers from './pages/admin/Customers'
import AdminAnalytics from './pages/admin/Analytics'
import AdminPayments from './pages/admin/Payments'
import AdminUsers from './pages/admin/Users'
import AdminSettings from './pages/admin/Settings'
import AdminFinancial from './pages/admin/Financial'
import AdminPricing from './pages/admin/Pricing'
import AdminBusinessHours from './pages/admin/BusinessHours'
import AdminServiceAreas from './pages/admin/ServiceAreas'
import AdminIntegrationSettings from './pages/admin/IntegrationSettings'
import AdminEmailTemplates from './pages/admin/EmailTemplates'
import AdminSmsTemplates from './pages/admin/SmsTemplates'
import AdminPolicies from './pages/admin/Policies'

function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <AuthProvider>
        <ThemeProvider>
          <Toaster />
          <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="auth/verify-email" element={<VerifyEmail />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
            <Route path="auth/reset-password" element={<ResetPassword />} />
            <Route path="auth/callback/:provider" element={<SSOCallback />} />
            <Route path="theme" element={<ThemeShowcase />} />
            <Route
              path="dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="booking"
              element={
                <ProtectedRoute>
                  <Booking />
                </ProtectedRoute>
              }
            />
            <Route
              path="booking/new"
              element={
                <ProtectedRoute>
                  <BookingNew />
                </ProtectedRoute>
              }
            />
            <Route
              path="payment/:bookingId"
              element={
                <ProtectedRoute>
                  <PaymentPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="payment/confirmation"
              element={
                <ProtectedRoute>
                  <PaymentConfirmation />
                </ProtectedRoute>
              }
            />
            <Route
              path="bookings/:bookingId/modify"
              element={
                <ProtectedRoute>
                  <ModifyBooking />
                </ProtectedRoute>
              }
            />
            <Route
              path="bookings/:bookingId/cancel"
              element={
                <ProtectedRoute>
                  <CancelBooking />
                </ProtectedRoute>
              }
            />
            <Route
              path="profile"
              element={
                <ProtectedRoute>
                  <ProfileLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<ProfileGeneral />} />
              <Route path="locations" element={<ProfileLocations />} />
              <Route path="notifications" element={<ProfileNotifications />} />
              <Route path="payment-methods" element={<ProfilePaymentMethods />} />
              <Route path="settings" element={<ProfileGeneral />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
          
          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={
              <AdminProtectedRoute>
                <AdminLayoutNew />
              </AdminProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="bookings" element={<AdminBookings />} />
            <Route path="customers" element={<AdminCustomers />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="payments" element={<AdminPayments />} />
            <Route path="financial" element={<AdminFinancial />} />
            <Route path="pricing" element={<AdminPricing />} />
            <Route path="business-hours" element={<AdminBusinessHours />} />
            <Route path="service-areas" element={<AdminServiceAreas />} />
            <Route path="integrations" element={<AdminIntegrationSettings />} />
            <Route path="email-templates" element={<AdminEmailTemplates />} />
            <Route path="sms-templates" element={<AdminSmsTemplates />} />
            <Route path="policies" element={<AdminPolicies />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="audit" element={<AdminSettings />} />
            <Route path="profile" element={<AdminSettings />} />
            <Route path="security" element={<AdminSettings />} />
          </Route>
          </Routes>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App