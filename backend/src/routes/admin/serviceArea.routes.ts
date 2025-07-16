import { Router } from 'express'
import { authenticateAdmin } from '../../middleware/adminAuth'
import { requirePermission } from '../../middleware/permissions'
import { adminServiceAreaService } from '../../services/adminServiceArea.service'
import { asyncHandler } from '../../utils/asyncHandler'
import { ApiError } from '../../utils/errors'

const router = Router()

// Apply admin auth to all routes
router.use(authenticateAdmin)

// Get service area overview
router.get('/overview', requirePermission('configuration:read'), asyncHandler(async (req, res) => {
  const overview = await adminServiceAreaService.getServiceAreaOverview()
  res.json(overview)
}))

// Get all service areas
router.get('/', requirePermission('configuration:read'), asyncHandler(async (req, res) => {
  const areas = await adminServiceAreaService.getAllServiceAreas()
  res.json(areas)
}))

// Get active service areas
router.get('/active', requirePermission('configuration:read'), asyncHandler(async (req, res) => {
  const areas = await adminServiceAreaService.getActiveServiceAreas()
  res.json(areas)
}))

// Get service area by ID
router.get('/:id', requirePermission('configuration:read'), asyncHandler(async (req, res) => {
  const area = await adminServiceAreaService.getServiceAreaById(req.params.id)
  res.json(area)
}))

// Create new service area
router.post('/', requirePermission('configuration:write'), asyncHandler(async (req, res) => {
  const adminId = (req as any).admin.id
  const area = await adminServiceAreaService.createServiceArea(req.body, adminId)
  res.status(201).json(area)
}))

// Update service area
router.put('/:id', requirePermission('configuration:write'), asyncHandler(async (req, res) => {
  const adminId = (req as any).admin.id
  const area = await adminServiceAreaService.updateServiceArea(req.params.id, req.body, adminId)
  res.json(area)
}))

// Delete service area
router.delete('/:id', requirePermission('configuration:write'), asyncHandler(async (req, res) => {
  const adminId = (req as any).admin.id
  const result = await adminServiceAreaService.deleteServiceArea(req.params.id, adminId)
  res.json(result)
}))

// Toggle service area active status
router.patch('/:id/toggle', requirePermission('configuration:write'), asyncHandler(async (req, res) => {
  const adminId = (req as any).admin.id
  const { isActive } = req.body
  
  if (typeof isActive !== 'boolean') {
    throw new ApiError(400, 'isActive must be a boolean value')
  }
  
  const area = await adminServiceAreaService.toggleServiceArea(req.params.id, isActive, adminId)
  res.json(area)
}))

// Check service availability at a location
router.post('/check-availability', requirePermission('configuration:read'), asyncHandler(async (req, res) => {
  const { lat, lng } = req.body
  
  if (!lat || !lng) {
    throw new ApiError(400, 'lat and lng are required')
  }
  
  const availability = await adminServiceAreaService.checkServiceAvailability(lat, lng)
  res.json(availability)
}))

// Export service areas
router.get('/export/:format', requirePermission('configuration:read'), asyncHandler(async (req, res) => {
  const format = req.params.format as 'geojson' | 'kml'
  
  if (!['geojson', 'kml'].includes(format)) {
    throw new ApiError(400, 'Invalid export format. Use geojson or kml')
  }
  
  const data = await adminServiceAreaService.exportServiceAreas(format)
  
  res.setHeader('Content-Type', format === 'geojson' ? 'application/geo+json' : 'application/vnd.google-earth.kml+xml')
  res.setHeader('Content-Disposition', `attachment; filename="service-areas.${format}"`)
  res.json(data)
}))

export default router