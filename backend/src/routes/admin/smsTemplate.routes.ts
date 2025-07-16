import { Router } from 'express'
import { authenticateAdmin } from '../../middleware/adminAuth'
import { requirePermission } from '../../middleware/permissions'
import { adminSmsTemplateService } from '../../services/adminSmsTemplate.service'
import { asyncHandler } from '../../utils/asyncHandler'
import { ApiError } from '../../utils/errors'

const router = Router()

// Apply admin auth to all routes
router.use(authenticateAdmin)

// Get SMS template overview
router.get('/overview', requirePermission('content:read'), asyncHandler(async (req, res) => {
  const overview = await adminSmsTemplateService.getSmsTemplateOverview()
  res.json(overview)
}))

// Get template defaults and variables
router.get('/defaults', requirePermission('content:read'), asyncHandler(async (req, res) => {
  const defaults = await adminSmsTemplateService.getSmsTemplateDefaults()
  res.json(defaults)
}))

// Get all SMS templates
router.get('/', requirePermission('content:read'), asyncHandler(async (req, res) => {
  const templates = await adminSmsTemplateService.getAllSmsTemplates()
  res.json(templates)
}))

// Get SMS template by key
router.get('/:key', requirePermission('content:read'), asyncHandler(async (req, res) => {
  const template = await adminSmsTemplateService.getSmsTemplateByKey(req.params.key)
  res.json(template)
}))

// Preview SMS template
router.post('/:key/preview', requirePermission('content:read'), asyncHandler(async (req, res) => {
  const preview = await adminSmsTemplateService.previewSmsTemplate(req.params.key, req.body.sampleData)
  res.json(preview)
}))

// Send test SMS
router.post('/:key/test', requirePermission('content:write'), asyncHandler(async (req, res) => {
  const adminId = (req as any).admin.id
  const { recipientPhone } = req.body
  
  if (!recipientPhone) {
    throw new ApiError(400, 'recipientPhone is required')
  }
  
  const result = await adminSmsTemplateService.sendTestSms(req.params.key, recipientPhone, adminId)
  res.json(result)
}))

// Calculate SMS length
router.post('/calculate-length', requirePermission('content:read'), asyncHandler(async (req, res) => {
  const { content } = req.body
  
  if (!content) {
    throw new ApiError(400, 'content is required')
  }
  
  const result = adminSmsTemplateService.calculateSmsLength(content)
  res.json(result)
}))

// Create new SMS template
router.post('/', requirePermission('content:write'), asyncHandler(async (req, res) => {
  const adminId = (req as any).admin.id
  const template = await adminSmsTemplateService.createSmsTemplate(req.body, adminId)
  res.status(201).json(template)
}))

// Update SMS template
router.put('/:key', requirePermission('content:write'), asyncHandler(async (req, res) => {
  const adminId = (req as any).admin.id
  const template = await adminSmsTemplateService.updateSmsTemplate(req.params.key, req.body, adminId)
  res.json(template)
}))

// Delete SMS template
router.delete('/:key', requirePermission('content:write'), asyncHandler(async (req, res) => {
  const adminId = (req as any).admin.id
  const result = await adminSmsTemplateService.deleteSmsTemplate(req.params.key, adminId)
  res.json(result)
}))

// Toggle SMS template active status
router.patch('/:key/toggle', requirePermission('content:write'), asyncHandler(async (req, res) => {
  const adminId = (req as any).admin.id
  const { isActive } = req.body
  
  if (typeof isActive !== 'boolean') {
    throw new ApiError(400, 'isActive must be a boolean value')
  }
  
  const template = await adminSmsTemplateService.toggleSmsTemplate(req.params.key, isActive, adminId)
  res.json(template)
}))

// Duplicate SMS template
router.post('/:key/duplicate', requirePermission('content:write'), asyncHandler(async (req, res) => {
  const adminId = (req as any).admin.id
  const { newKey } = req.body
  
  if (!newKey) {
    throw new ApiError(400, 'newKey is required')
  }
  
  const template = await adminSmsTemplateService.duplicateSmsTemplate(req.params.key, newKey, adminId)
  res.json(template)
}))

export default router