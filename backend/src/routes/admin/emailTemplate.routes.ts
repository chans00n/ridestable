import { Router } from 'express'
import { authenticateAdmin } from '../../middleware/adminAuth'
import { requirePermission } from '../../middleware/permissions'
import { adminEmailTemplateService } from '../../services/adminEmailTemplate.service'
import { asyncHandler } from '../../utils/asyncHandler'
import { ApiError } from '../../utils/errors'

const router = Router()

// Apply admin auth to all routes
router.use(authenticateAdmin)

// Get email template overview
router.get('/overview', requirePermission('content:read'), asyncHandler(async (req, res) => {
  const overview = await adminEmailTemplateService.getEmailTemplateOverview()
  res.json(overview)
}))

// Get template defaults and variables
router.get('/defaults', requirePermission('content:read'), asyncHandler(async (req, res) => {
  const defaults = await adminEmailTemplateService.getEmailTemplateDefaults()
  res.json(defaults)
}))

// Get all email templates
router.get('/', requirePermission('content:read'), asyncHandler(async (req, res) => {
  const templates = await adminEmailTemplateService.getAllEmailTemplates()
  res.json(templates)
}))

// Get email template by key
router.get('/:key', requirePermission('content:read'), asyncHandler(async (req, res) => {
  const template = await adminEmailTemplateService.getEmailTemplateByKey(req.params.key)
  res.json(template)
}))

// Preview email template
router.post('/:key/preview', requirePermission('content:read'), asyncHandler(async (req, res) => {
  const preview = await adminEmailTemplateService.previewEmailTemplate(req.params.key, req.body.sampleData)
  res.json(preview)
}))

// Send test email
router.post('/:key/test', requirePermission('content:write'), asyncHandler(async (req, res) => {
  const adminId = (req as any).admin.id
  const { recipientEmail } = req.body
  
  if (!recipientEmail) {
    throw new ApiError(400, 'recipientEmail is required')
  }
  
  const result = await adminEmailTemplateService.sendTestEmail(req.params.key, recipientEmail, adminId)
  res.json(result)
}))

// Create new email template
router.post('/', requirePermission('content:write'), asyncHandler(async (req, res) => {
  const adminId = (req as any).admin.id
  const template = await adminEmailTemplateService.createEmailTemplate(req.body, adminId)
  res.status(201).json(template)
}))

// Update email template
router.put('/:key', requirePermission('content:write'), asyncHandler(async (req, res) => {
  const adminId = (req as any).admin.id
  const template = await adminEmailTemplateService.updateEmailTemplate(req.params.key, req.body, adminId)
  res.json(template)
}))

// Delete email template
router.delete('/:key', requirePermission('content:write'), asyncHandler(async (req, res) => {
  const adminId = (req as any).admin.id
  const result = await adminEmailTemplateService.deleteEmailTemplate(req.params.key, adminId)
  res.json(result)
}))

// Toggle email template active status
router.patch('/:key/toggle', requirePermission('content:write'), asyncHandler(async (req, res) => {
  const adminId = (req as any).admin.id
  const { isActive } = req.body
  
  if (typeof isActive !== 'boolean') {
    throw new ApiError(400, 'isActive must be a boolean value')
  }
  
  const template = await adminEmailTemplateService.toggleEmailTemplate(req.params.key, isActive, adminId)
  res.json(template)
}))

// Duplicate email template
router.post('/:key/duplicate', requirePermission('content:write'), asyncHandler(async (req, res) => {
  const adminId = (req as any).admin.id
  const { newKey } = req.body
  
  if (!newKey) {
    throw new ApiError(400, 'newKey is required')
  }
  
  const template = await adminEmailTemplateService.duplicateEmailTemplate(req.params.key, newKey, adminId)
  res.json(template)
}))

export default router