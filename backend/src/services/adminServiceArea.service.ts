import { PrismaClient } from '@prisma/client'
import { auditLogService } from './auditLog.service'
import { ApiError } from '../utils/errors'

const prisma = new PrismaClient()

export interface ServiceAreaData {
  name: string
  description?: string
  polygon: any // GeoJSON polygon coordinates
  center: any // Center point {lat, lng}
  radius?: number // For circular areas
  surchargeAmount?: number
  surchargePercentage?: number
  isActive: boolean
  restrictions?: any // Service restrictions (e.g., no hourly service)
}

export interface ServiceAreaOverview {
  totalAreas: number
  activeAreas: number
  areasWithSurcharge: number
  totalCoverage: number // Approximate square miles/km
  overlappingAreas: number
}

class AdminServiceAreaService {
  async getServiceAreaOverview(): Promise<ServiceAreaOverview> {
    const [
      totalAreas,
      activeAreas,
      areasWithSurcharge,
      overlappingAreas
    ] = await Promise.all([
      prisma.serviceArea.count(),
      prisma.serviceArea.count({ where: { isActive: true } }),
      prisma.serviceArea.count({
        where: {
          OR: [
            { NOT: { surchargeAmount: null } },
            { NOT: { surchargePercentage: null } }
          ]
        }
      }),
      this.countOverlappingAreas()
    ])

    // Calculate approximate total coverage
    const totalCoverage = await this.calculateTotalCoverage()

    return {
      totalAreas,
      activeAreas,
      areasWithSurcharge,
      totalCoverage,
      overlappingAreas
    }
  }

  async getAllServiceAreas() {
    return prisma.serviceArea.findMany({
      orderBy: { name: 'asc' },
      include: {
        createdBy: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    })
  }

  async getActiveServiceAreas() {
    return prisma.serviceArea.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    })
  }

  async getServiceAreaById(id: string) {
    const area = await prisma.serviceArea.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    if (!area) {
      throw new ApiError(404, 'Service area not found')
    }

    return area
  }

  async createServiceArea(data: ServiceAreaData, adminId: string) {
    // Validate polygon or circle
    if (!data.polygon && !data.radius) {
      throw new ApiError(400, 'Service area must have either polygon boundaries or radius')
    }

    if (data.polygon && !this.isValidPolygon(data.polygon)) {
      throw new ApiError(400, 'Invalid polygon coordinates')
    }

    const serviceArea = await prisma.serviceArea.create({
      data: {
        name: data.name,
        description: data.description,
        polygon: data.polygon,
        center: data.center,
        radius: data.radius,
        surchargeAmount: data.surchargeAmount,
        surchargePercentage: data.surchargePercentage,
        isActive: data.isActive,
        restrictions: data.restrictions || {},
        createdById: adminId
      },
      include: {
        createdBy: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    })

    await auditLogService.log({
      adminId,
      action: 'create',
      resource: 'service_area',
      resourceId: serviceArea.id,
      details: {
        name: serviceArea.name,
        isActive: serviceArea.isActive
      }
    })

    return serviceArea
  }

  async updateServiceArea(id: string, data: Partial<ServiceAreaData>, adminId: string) {
    const existingArea = await this.getServiceAreaById(id)

    if (data.polygon && !this.isValidPolygon(data.polygon)) {
      throw new ApiError(400, 'Invalid polygon coordinates')
    }

    const serviceArea = await prisma.serviceArea.update({
      where: { id },
      data: {
        ...data,
        restrictions: data.restrictions !== undefined ? data.restrictions : existingArea.restrictions
      },
      include: {
        createdBy: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    })

    await auditLogService.log({
      adminId,
      action: 'update',
      resource: 'service_area',
      resourceId: id,
      details: {
        name: serviceArea.name,
        changes: data
      }
    })

    return serviceArea
  }

  async deleteServiceArea(id: string, adminId: string) {
    const area = await this.getServiceAreaById(id)

    await prisma.serviceArea.delete({
      where: { id }
    })

    await auditLogService.log({
      adminId,
      action: 'delete',
      resource: 'service_area',
      resourceId: id,
      details: {
        name: area.name
      }
    })

    return { success: true }
  }

  async toggleServiceArea(id: string, isActive: boolean, adminId: string) {
    const serviceArea = await prisma.serviceArea.update({
      where: { id },
      data: { isActive },
      include: {
        createdBy: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    })

    await auditLogService.log({
      adminId,
      action: isActive ? 'activate' : 'deactivate',
      resource: 'service_area',
      resourceId: id,
      details: {
        name: serviceArea.name,
        isActive
      }
    })

    return serviceArea
  }

  async checkServiceAvailability(lat: number, lng: number): Promise<{
    available: boolean
    areas: any[]
    surcharge?: {
      amount?: number
      percentage?: number
    }
  }> {
    const activeAreas = await this.getActiveServiceAreas()
    const matchingAreas = []
    let totalSurchargeAmount = 0
    let totalSurchargePercentage = 0

    for (const area of activeAreas) {
      let isInArea = false

      if (area.polygon) {
        isInArea = this.isPointInPolygon({ lat, lng }, area.polygon)
      } else if (area.radius && area.center) {
        isInArea = this.isPointInCircle(
          { lat, lng },
          area.center as any,
          area.radius as any
        )
      }

      if (isInArea) {
        matchingAreas.push({
          id: area.id,
          name: area.name,
          surchargeAmount: area.surchargeAmount,
          surchargePercentage: area.surchargePercentage,
          restrictions: area.restrictions
        })

        if (area.surchargeAmount) {
          totalSurchargeAmount += Number(area.surchargeAmount)
        }
        if (area.surchargePercentage) {
          totalSurchargePercentage += Number(area.surchargePercentage)
        }
      }
    }

    const available = matchingAreas.length > 0
    const surcharge = (totalSurchargeAmount > 0 || totalSurchargePercentage > 0) 
      ? {
          amount: totalSurchargeAmount > 0 ? totalSurchargeAmount : undefined,
          percentage: totalSurchargePercentage > 0 ? totalSurchargePercentage : undefined
        }
      : undefined

    return {
      available,
      areas: matchingAreas,
      surcharge
    }
  }

  async exportServiceAreas(format: 'geojson' | 'kml' = 'geojson') {
    const areas = await this.getAllServiceAreas()

    if (format === 'geojson') {
      return {
        type: 'FeatureCollection',
        features: areas.map(area => ({
          type: 'Feature',
          properties: {
            id: area.id,
            name: area.name,
            description: area.description,
            isActive: area.isActive,
            surchargeAmount: area.surchargeAmount,
            surchargePercentage: area.surchargePercentage
          },
          geometry: area.polygon || {
            type: 'Point',
            coordinates: [area.center.lng, area.center.lat]
          }
        }))
      }
    }

    // KML format would be implemented here
    throw new ApiError(400, 'KML export not yet implemented')
  }

  private isValidPolygon(polygon: any): boolean {
    // Basic validation for GeoJSON polygon
    if (!polygon || polygon.type !== 'Polygon' || !Array.isArray(polygon.coordinates)) {
      return false
    }

    const coordinates = polygon.coordinates[0]
    if (!Array.isArray(coordinates) || coordinates.length < 4) {
      return false
    }

    // Check if first and last coordinates are the same (closed polygon)
    const first = coordinates[0]
    const last = coordinates[coordinates.length - 1]
    if (first[0] !== last[0] || first[1] !== last[1]) {
      return false
    }

    return true
  }

  private isPointInPolygon(point: { lat: number; lng: number }, polygon: any): boolean {
    // Ray casting algorithm
    const coordinates = polygon.coordinates[0]
    let inside = false

    for (let i = 0, j = coordinates.length - 1; i < coordinates.length; j = i++) {
      const xi = coordinates[i][0], yi = coordinates[i][1]
      const xj = coordinates[j][0], yj = coordinates[j][1]

      const intersect = ((yi > point.lat) !== (yj > point.lat))
        && (point.lng < (xj - xi) * (point.lat - yi) / (yj - yi) + xi)

      if (intersect) inside = !inside
    }

    return inside
  }

  private isPointInCircle(
    point: { lat: number; lng: number },
    center: { lat: number; lng: number },
    radiusKm: number
  ): boolean {
    const distance = this.getDistanceFromLatLonInKm(
      point.lat,
      point.lng,
      center.lat,
      center.lng
    )
    return distance <= radiusKm
  }

  private getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371 // Radius of the earth in km
    const dLat = this.deg2rad(lat2 - lat1)
    const dLon = this.deg2rad(lon2 - lon1)
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    const d = R * c
    return d
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI/180)
  }

  private async countOverlappingAreas(): Promise<number> {
    // This is a simplified count - in production, we'd use PostGIS for accurate overlap detection
    const areas = await this.getActiveServiceAreas()
    let overlaps = 0

    for (let i = 0; i < areas.length; i++) {
      for (let j = i + 1; j < areas.length; j++) {
        // Check if centers are close (simplified check)
        if (areas[i].center && areas[j].center) {
          const distance = this.getDistanceFromLatLonInKm(
            (areas[i].center as any).lat,
            (areas[i].center as any).lng,
            (areas[j].center as any).lat,
            (areas[j].center as any).lng
          )
          
          const radius1 = (areas[i].radius as any) || 10 // Default 10km if polygon
          const radius2 = (areas[j].radius as any) || 10
          
          if (distance < (radius1 + radius2)) {
            overlaps++
          }
        }
      }
    }

    return overlaps
  }

  private async calculateTotalCoverage(): Promise<number> {
    const areas = await this.getActiveServiceAreas()
    let totalArea = 0

    for (const area of areas) {
      if (area.radius) {
        // Circle area
        totalArea += Math.PI * Math.pow(area.radius as any, 2)
      } else if (area.polygon) {
        // Simplified polygon area calculation
        totalArea += 100 // Default 100 sq km for polygons
      }
    }

    return Math.round(totalArea)
  }
}

export const adminServiceAreaService = new AdminServiceAreaService()