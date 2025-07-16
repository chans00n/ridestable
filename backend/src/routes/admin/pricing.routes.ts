import { Router } from 'express'
import { adminPricingService } from '../../services/adminPricing.service'
import { authenticateAdmin } from '../../middleware/adminAuth'
import { requirePermission } from '../../middleware/permissions'
import { ApiError } from '../../utils/errors'

const router = Router()

// Apply admin authentication to all routes
router.use(authenticateAdmin)

// GET /admin/pricing/overview
router.get('/overview', requirePermission('pricing:read'), async (req, res, next) => {
  try {
    const overview = await adminPricingService.getPricingOverview()
    res.json(overview)
  } catch (error) {
    next(error)
  }
})

// GET /admin/pricing/rules
router.get('/rules', requirePermission('pricing:read'), async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const filters = {
      serviceType: req.query.serviceType as string,
      ruleType: req.query.ruleType as string,
      isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
      search: req.query.search as string
    }

    const result = await adminPricingService.getAllPricingRules(page, limit, filters)
    res.json(result)
  } catch (error) {
    next(error)
  }
})

// GET /admin/pricing/rules/:id
router.get('/rules/:id', requirePermission('pricing:read'), async (req, res, next) => {
  try {
    const rule = await adminPricingService.getPricingRuleById(req.params.id)
    res.json(rule)
  } catch (error) {
    next(error)
  }
})

// POST /admin/pricing/rules
router.post('/rules', requirePermission('pricing:write'), async (req, res, next) => {
  try {
    const adminId = req.admin?.id
    if (!adminId) {
      throw new ApiError(401, 'Unauthorized')
    }

    // Validate the pricing rule data
    const validation = await adminPricingService.validatePricingRule(req.body)
    if (!validation.isValid) {
      throw new ApiError(400, 'Validation failed', validation.errors)
    }

    const rule = await adminPricingService.createPricingRule(req.body, adminId)
    res.status(201).json(rule)
  } catch (error) {
    next(error)
  }
})

// PUT /admin/pricing/rules/:id
router.put('/rules/:id', requirePermission('pricing:write'), async (req, res, next) => {
  try {
    const adminId = req.admin?.id
    if (!adminId) {
      throw new ApiError(401, 'Unauthorized')
    }

    const rule = await adminPricingService.updatePricingRule(req.params.id, req.body, adminId)
    res.json(rule)
  } catch (error) {
    next(error)
  }
})

// DELETE /admin/pricing/rules/:id
router.delete('/rules/:id', requirePermission('pricing:write'), async (req, res, next) => {
  try {
    const adminId = req.admin?.id
    if (!adminId) {
      throw new ApiError(401, 'Unauthorized')
    }

    await adminPricingService.deletePricingRule(req.params.id, adminId)
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

// PATCH /admin/pricing/rules/:id/toggle
router.patch('/rules/:id/toggle', requirePermission('pricing:write'), async (req, res, next) => {
  try {
    const adminId = req.admin?.id
    if (!adminId) {
      throw new ApiError(401, 'Unauthorized')
    }

    const { isActive } = req.body
    const rule = await adminPricingService.togglePricingRule(req.params.id, isActive, adminId)
    res.json(rule)
  } catch (error) {
    next(error)
  }
})

// POST /admin/pricing/rules/:id/duplicate
router.post('/rules/:id/duplicate', requirePermission('pricing:write'), async (req, res, next) => {
  try {
    const adminId = req.admin?.id
    if (!adminId) {
      throw new ApiError(401, 'Unauthorized')
    }

    const rule = await adminPricingService.duplicatePricingRule(req.params.id, adminId)
    res.status(201).json(rule)
  } catch (error) {
    next(error)
  }
})

// POST /admin/pricing/rules/validate
router.post('/rules/validate', requirePermission('pricing:read'), async (req, res, next) => {
  try {
    const validation = await adminPricingService.validatePricingRule(req.body)
    res.json(validation)
  } catch (error) {
    next(error)
  }
})

export default router