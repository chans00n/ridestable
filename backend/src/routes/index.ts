import { Router } from 'express'
import { prisma } from '../config/database'
import { cache } from '../utils/cache'
import authRoutes from './auth.routes'
import oauthRoutes from './oauth.routes'
import locationRoutes from './location.routes'
import quoteRoutes from './quote.routes'
import paymentRoutes from './payment.routes'
import bookingRoutes from './booking.routes'
import enhancementRoutes from './enhancement.routes'
import bookingLifecycleRoutes from './bookingLifecycle.routes'
import dashboardRoutes from './dashboard.routes'
import receiptRoutes from './receipt.routes'
import driverRoutes from './driver.routes'
import adminRoutes from './admin.routes'
import adminAuthRoutes from './adminAuth.routes'
import adminUserRoutes from './adminUser.routes'
import adminDashboardRoutes from './adminDashboard.routes'
import adminBookingRoutes from './adminBooking.routes'
import adminCustomerRoutes from './adminCustomer.routes'
import adminFinancialRoutes from './adminFinancial.routes'
import adminPricingRoutes from './admin/pricing.routes'
import adminBusinessHoursRoutes from './admin/businessHours.routes'
import adminServiceAreaRoutes from './admin/serviceArea.routes'
import adminIntegrationRoutes from './admin/integration.routes'
import adminEmailTemplateRoutes from './admin/emailTemplate.routes'
import adminSmsTemplateRoutes from './admin/smsTemplate.routes'
import adminPolicyRoutes from './admin/policy.routes'

const router = Router()

router.use('/auth', authRoutes)
router.use('/auth', oauthRoutes) // OAuth routes under /auth path
router.use('/locations', locationRoutes)
router.use('/quotes', quoteRoutes)
router.use('/payments', paymentRoutes)
router.use('/bookings', bookingRoutes)
router.use('/enhancements', enhancementRoutes)
router.use('/dashboard', dashboardRoutes)
router.use('/receipts', receiptRoutes)
router.use('/driver', driverRoutes)

// Admin routes - auth routes must come before general admin routes
router.use('/admin/auth', adminAuthRoutes)
router.use('/admin/users', adminUserRoutes)
router.use('/admin/dashboard', adminDashboardRoutes)
router.use('/admin/bookings', adminBookingRoutes)
router.use('/admin/customers', adminCustomerRoutes)
router.use('/admin/financial', adminFinancialRoutes)
router.use('/admin/pricing', adminPricingRoutes)
router.use('/admin/business-hours', adminBusinessHoursRoutes)
router.use('/admin/service-areas', adminServiceAreaRoutes)
router.use('/admin/integrations', adminIntegrationRoutes)
router.use('/admin/email-templates', adminEmailTemplateRoutes)
router.use('/admin/sms-templates', adminSmsTemplateRoutes)
router.use('/admin/policies', adminPolicyRoutes)
router.use('/admin', adminRoutes) // This should be last as it applies auth middleware

// Basic health check (no dependencies)
router.get('/health', (_req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    vercel: !!process.env.VERCEL
  })
})

// Test endpoint for debugging
router.get('/test', (_req, res) => {
  res.json({
    message: 'API is working',
    env: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: !!process.env.VERCEL,
      DATABASE_URL: !!process.env.DATABASE_URL,
      DIRECT_URL: !!process.env.DIRECT_URL,
    },
    timestamp: new Date().toISOString(),
  })
})

// Detailed health check (with dependencies)
router.get('/health/detailed', async (_req, res) => {
  try {
    const checks = {
      api: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: 'checking',
      cache: 'checking'
    }
    
    // Check database
    try {
      await prisma.$queryRaw`SELECT 1`
      checks.database = 'ok'
    } catch (error) {
      checks.database = 'error'
    }
    
    // Check cache
    try {
      await cache.setEx('health-check', 10, 'ok')
      const value = await cache.get('health-check')
      checks.cache = value === 'ok' ? 'ok' : 'error'
    } catch (error) {
      checks.cache = 'error'
    }
    
    const allOk = Object.values(checks).every(v => v === 'ok' || typeof v === 'string')
    res.status(allOk ? 200 : 503).json(checks)
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: 'Health check failed',
      timestamp: new Date().toISOString()
    })
  }
})

export default router