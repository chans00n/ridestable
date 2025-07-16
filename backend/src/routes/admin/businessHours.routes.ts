import { Router } from 'express'
import { adminBusinessHoursService } from '../../services/adminBusinessHours.service'
import { authenticateAdmin } from '../../middleware/adminAuth'
import { requirePermission } from '../../middleware/permissions'
import { ApiError } from '../../utils/errors'
import { asyncHandler } from '../../middleware/async'

const router = Router()

// Apply admin authentication to all routes
router.use(authenticateAdmin)

// GET /admin/business-hours/overview
router.get('/overview', requirePermission('settings:read'), asyncHandler(async (req, res) => {
  const overview = await adminBusinessHoursService.getBusinessHoursOverview()
  res.json(overview)
}))

// GET /admin/business-hours
router.get('/', requirePermission('settings:read'), asyncHandler(async (req, res) => {
  const hours = await adminBusinessHoursService.getAllBusinessHours()
  res.json(hours)
}))

// PUT /admin/business-hours/:dayOfWeek
router.put('/:dayOfWeek', requirePermission('settings:write'), asyncHandler(async (req, res) => {
  const adminId = req.admin?.id
  if (!adminId) {
    throw new ApiError(401, 'Unauthorized')
  }

  const dayOfWeek = parseInt(req.params.dayOfWeek)
  if (isNaN(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
    throw new ApiError(400, 'Invalid day of week. Must be 0-6')
  }

  const businessHours = await adminBusinessHoursService.updateBusinessHours(
    dayOfWeek,
    req.body,
    adminId
  )
  res.json(businessHours)
}))

// PUT /admin/business-hours/bulk
router.put('/bulk', requirePermission('settings:write'), asyncHandler(async (req, res) => {
  const adminId = req.admin?.id
  if (!adminId) {
    throw new ApiError(401, 'Unauthorized')
  }

  const results = await adminBusinessHoursService.bulkUpdateBusinessHours(
    req.body.hours,
    adminId
  )
  res.json(results)
}))

// GET /admin/business-hours/holidays
router.get('/holidays', requirePermission('settings:read'), asyncHandler(async (req, res) => {
  const year = req.query.year ? parseInt(req.query.year as string) : undefined
  const holidays = await adminBusinessHoursService.getAllHolidays(year)
  res.json(holidays)
}))

// GET /admin/business-hours/holidays/upcoming
router.get('/holidays/upcoming', requirePermission('settings:read'), asyncHandler(async (req, res) => {
  const days = req.query.days ? parseInt(req.query.days as string) : 30
  const holidays = await adminBusinessHoursService.getUpcomingHolidays(days)
  res.json(holidays)
}))

// POST /admin/business-hours/holidays
router.post('/holidays', requirePermission('settings:write'), asyncHandler(async (req, res) => {
  const adminId = req.admin?.id
  if (!adminId) {
    throw new ApiError(401, 'Unauthorized')
  }

  const holiday = await adminBusinessHoursService.createHoliday(req.body, adminId)
  res.status(201).json(holiday)
}))

// PUT /admin/business-hours/holidays/:id
router.put('/holidays/:id', requirePermission('settings:write'), asyncHandler(async (req, res) => {
  const adminId = req.admin?.id
  if (!adminId) {
    throw new ApiError(401, 'Unauthorized')
  }

  const holiday = await adminBusinessHoursService.updateHoliday(
    req.params.id,
    req.body,
    adminId
  )
  res.json(holiday)
}))

// DELETE /admin/business-hours/holidays/:id
router.delete('/holidays/:id', requirePermission('settings:write'), asyncHandler(async (req, res) => {
  const adminId = req.admin?.id
  if (!adminId) {
    throw new ApiError(401, 'Unauthorized')
  }

  await adminBusinessHoursService.deleteHoliday(req.params.id, adminId)
  res.json({ success: true })
}))

// POST /admin/business-hours/check
router.post('/check', requirePermission('settings:read'), asyncHandler(async (req, res) => {
  const { dateTime } = req.body
  if (!dateTime) {
    throw new ApiError(400, 'dateTime is required')
  }

  const result = await adminBusinessHoursService.checkIfOpen(new Date(dateTime))
  res.json(result)
}))

export default router