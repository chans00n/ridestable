import { Router } from 'express'
import { authenticateAdmin } from '../../middleware/adminAuth'
import { requirePermission } from '../../middleware/permissions'
import { adminIntegrationService } from '../../services/adminIntegration.service'
import { asyncHandler } from '../../utils/asyncHandler'
import { ApiError } from '../../utils/errors'

const router = Router()

// Apply admin auth to all routes
router.use(authenticateAdmin)

// Get integration overview
router.get('/overview', requirePermission('configuration:read'), asyncHandler(async (req, res) => {
  const overview = await adminIntegrationService.getIntegrationOverview()
  res.json(overview)
}))

// Get all integrations
router.get('/', requirePermission('configuration:read'), asyncHandler(async (req, res) => {
  const integrations = await adminIntegrationService.getAllIntegrations()
  res.json(integrations)
}))

// Get integration by ID
router.get('/:id', requirePermission('configuration:read'), asyncHandler(async (req, res) => {
  const integration = await adminIntegrationService.getIntegrationById(req.params.id)
  res.json(integration)
}))

// Create new integration
router.post('/', requirePermission('configuration:write'), asyncHandler(async (req, res) => {
  const adminId = (req as any).admin.id
  const integration = await adminIntegrationService.createIntegration(req.body, adminId)
  res.status(201).json(integration)
}))

// Update integration
router.put('/:id', requirePermission('configuration:write'), asyncHandler(async (req, res) => {
  const adminId = (req as any).admin.id
  const integration = await adminIntegrationService.updateIntegration(req.params.id, req.body, adminId)
  res.json(integration)
}))

// Delete integration
router.delete('/:id', requirePermission('configuration:write'), asyncHandler(async (req, res) => {
  const adminId = (req as any).admin.id
  const result = await adminIntegrationService.deleteIntegration(req.params.id, adminId)
  res.json(result)
}))

// Toggle integration active status
router.patch('/:id/toggle', requirePermission('configuration:write'), asyncHandler(async (req, res) => {
  const adminId = (req as any).admin.id
  const { isActive } = req.body
  
  if (typeof isActive !== 'boolean') {
    throw new ApiError(400, 'isActive must be a boolean value')
  }
  
  const integration = await adminIntegrationService.toggleIntegration(req.params.id, isActive, adminId)
  res.json(integration)
}))

// Test integration
router.post('/:id/test', requirePermission('configuration:write'), asyncHandler(async (req, res) => {
  const adminId = (req as any).admin.id
  const result = await adminIntegrationService.testIntegration(req.params.id, adminId)
  res.json(result)
}))

// Get integration templates/presets
router.get('/templates/:provider', requirePermission('configuration:read'), asyncHandler(async (req, res) => {
  const templates = {
    stripe: {
      name: 'Stripe Payment Processing',
      provider: 'stripe',
      config: {
        publishableKey: '',
        secretKey: '',
        webhookSecret: ''
      },
      environment: 'sandbox'
    },
    twilio: {
      name: 'Twilio SMS',
      provider: 'twilio',
      config: {
        accountSid: '',
        authToken: '',
        messagingServiceSid: '',
        fromNumber: ''
      },
      environment: 'sandbox'
    },
    sendgrid: {
      name: 'SendGrid Email',
      provider: 'sendgrid',
      config: {
        apiKey: '',
        fromEmail: '',
        fromName: 'Stable Ride'
      },
      environment: 'sandbox'
    },
    google_maps: {
      name: 'Google Maps',
      provider: 'google_maps',
      config: {
        apiKey: '',
        region: 'US'
      },
      environment: 'production'
    }
  }
  
  const provider = req.params.provider
  if (!templates[provider as keyof typeof templates]) {
    throw new ApiError(404, 'Template not found')
  }
  
  res.json(templates[provider as keyof typeof templates])
}))

export default router