import { Router } from 'express'
import { authenticateAdmin } from '../../middleware/adminAuth'
import { requirePermission } from '../../middleware/permissions'
import { adminPolicyService } from '../../services/adminPolicy.service'
import { asyncHandler } from '../../utils/asyncHandler'
import { ApiError } from '../../utils/errors'

const router = Router()

// Apply admin auth to all routes
router.use(authenticateAdmin)

// Get policy overview
router.get('/overview', requirePermission('content:read'), asyncHandler(async (req, res) => {
  const overview = await adminPolicyService.getPolicyOverview()
  res.json(overview)
}))

// Get policy defaults and templates
router.get('/defaults', requirePermission('content:read'), asyncHandler(async (req, res) => {
  const defaults = await adminPolicyService.getPolicyDefaults()
  res.json(defaults)
}))

// Get all policies
router.get('/', requirePermission('content:read'), asyncHandler(async (req, res) => {
  const policies = await adminPolicyService.getAllPolicies()
  res.json(policies)
}))

// Get policy by key
router.get('/:key', requirePermission('content:read'), asyncHandler(async (req, res) => {
  const policy = await adminPolicyService.getPolicyByKey(req.params.key)
  res.json(policy)
}))

// Get policy history
router.get('/:key/history', requirePermission('content:read'), asyncHandler(async (req, res) => {
  const history = await adminPolicyService.getPolicyHistory(req.params.key)
  res.json(history)
}))

// Export policy
router.get('/:key/export/:format', requirePermission('content:read'), asyncHandler(async (req, res) => {
  const format = req.params.format as 'html' | 'pdf' | 'markdown'
  
  if (!['html', 'pdf', 'markdown'].includes(format)) {
    throw new ApiError(400, 'Invalid export format. Use html, pdf, or markdown')
  }
  
  const result = await adminPolicyService.exportPolicy(req.params.key, format)
  
  if (format === 'html') {
    res.setHeader('Content-Type', 'text/html')
  } else if (format === 'markdown') {
    res.setHeader('Content-Type', 'text/markdown')
  }
  
  res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`)
  res.send(result.content)
}))

// Create new policy
router.post('/', requirePermission('content:write'), asyncHandler(async (req, res) => {
  const adminId = (req as any).admin.id
  const policy = await adminPolicyService.createPolicy(req.body, adminId)
  res.status(201).json(policy)
}))

// Update policy
router.put('/:key', requirePermission('content:write'), asyncHandler(async (req, res) => {
  const adminId = (req as any).admin.id
  const policy = await adminPolicyService.updatePolicy(req.params.key, req.body, adminId)
  res.json(policy)
}))

// Delete policy
router.delete('/:key', requirePermission('content:write'), asyncHandler(async (req, res) => {
  const adminId = (req as any).admin.id
  const result = await adminPolicyService.deletePolicy(req.params.key, adminId)
  res.json(result)
}))

// Publish policy
router.post('/:key/publish', requirePermission('content:write'), asyncHandler(async (req, res) => {
  const adminId = (req as any).admin.id
  const policy = await adminPolicyService.publishPolicy(req.params.key, adminId)
  res.json(policy)
}))

// Unpublish policy
router.post('/:key/unpublish', requirePermission('content:write'), asyncHandler(async (req, res) => {
  const adminId = (req as any).admin.id
  const policy = await adminPolicyService.unpublishPolicy(req.params.key, adminId)
  res.json(policy)
}))

// Duplicate policy
router.post('/:key/duplicate', requirePermission('content:write'), asyncHandler(async (req, res) => {
  const adminId = (req as any).admin.id
  const { newKey } = req.body
  
  if (!newKey) {
    throw new ApiError(400, 'newKey is required')
  }
  
  const policy = await adminPolicyService.duplicatePolicy(req.params.key, newKey, adminId)
  res.json(policy)
}))

export default router