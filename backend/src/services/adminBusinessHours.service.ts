import { PrismaClient } from '@prisma/client'
import { auditLogService } from './auditLog.service'
import { ApiError } from '../utils/errors'
import { startOfDay, endOfDay, format, parse } from 'date-fns'

const prisma = new PrismaClient()

export interface BusinessHoursData {
  dayOfWeek: number // 0 = Sunday, 6 = Saturday
  openTime: string // HH:MM format
  closeTime: string // HH:MM format
  isClosed: boolean
  timezone?: string
}

export interface HolidayData {
  name: string
  date: Date | string
  isClosed: boolean
  openTime?: string
  closeTime?: string
  surchargePercentage?: number
}

export interface BusinessHoursOverview {
  regularHours: BusinessHoursData[]
  upcomingHolidays: any[]
  timezone: string
  is24x7: boolean
  hasWeekendHours: boolean
}

class AdminBusinessHoursService {
  async getBusinessHoursOverview(): Promise<BusinessHoursOverview> {
    const [regularHours, upcomingHolidays] = await Promise.all([
      this.getAllBusinessHours(),
      this.getUpcomingHolidays(30) // Next 30 days
    ])

    const timezone = regularHours[0]?.timezone || 'America/Los_Angeles'
    const is24x7 = this.checkIf24x7(regularHours)
    const hasWeekendHours = this.checkWeekendHours(regularHours)

    return {
      regularHours,
      upcomingHolidays,
      timezone,
      is24x7,
      hasWeekendHours
    }
  }

  async getAllBusinessHours(): Promise<any[]> {
    const hours = await prisma.businessHours.findMany({
      orderBy: { dayOfWeek: 'asc' }
    })

    // If no hours exist, create default hours
    if (hours.length === 0) {
      return this.createDefaultBusinessHours()
    }

    return hours.map(h => ({
      ...h,
      dayName: this.getDayName(h.dayOfWeek)
    }))
  }

  async updateBusinessHours(dayOfWeek: number, data: Partial<BusinessHoursData>, adminId: string) {
    // Validate time format
    if (data.openTime && !this.isValidTimeFormat(data.openTime)) {
      throw new ApiError(400, 'Invalid open time format. Use HH:MM')
    }
    if (data.closeTime && !this.isValidTimeFormat(data.closeTime)) {
      throw new ApiError(400, 'Invalid close time format. Use HH:MM')
    }

    const businessHours = await prisma.businessHours.upsert({
      where: { dayOfWeek },
      update: data,
      create: {
        dayOfWeek,
        openTime: data.openTime || '09:00',
        closeTime: data.closeTime || '18:00',
        isClosed: data.isClosed || false,
        timezone: data.timezone || 'America/Los_Angeles'
      }
    })

    await auditLogService.log({
      adminId,
      action: 'update',
      resource: 'business_hours',
      resourceId: businessHours.id,
      details: {
        dayOfWeek,
        dayName: this.getDayName(dayOfWeek),
        changes: data
      }
    })

    return {
      ...businessHours,
      dayName: this.getDayName(businessHours.dayOfWeek)
    }
  }

  async bulkUpdateBusinessHours(updates: BusinessHoursData[], adminId: string) {
    const results = []

    for (const update of updates) {
      const result = await this.updateBusinessHours(update.dayOfWeek, update, adminId)
      results.push(result)
    }

    return results
  }

  async getAllHolidays(year?: number) {
    const whereClause: any = {}
    
    if (year) {
      const startDate = new Date(year, 0, 1)
      const endDate = new Date(year, 11, 31)
      whereClause.date = {
        gte: startDate,
        lte: endDate
      }
    }

    return prisma.holiday.findMany({
      where: whereClause,
      orderBy: { date: 'asc' },
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

  async getUpcomingHolidays(days: number = 30) {
    const today = startOfDay(new Date())
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + days)

    return prisma.holiday.findMany({
      where: {
        date: {
          gte: today,
          lte: endOfDay(futureDate)
        }
      },
      orderBy: { date: 'asc' },
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

  async createHoliday(data: HolidayData, adminId: string) {
    // Validate time format if provided
    if (data.openTime && !this.isValidTimeFormat(data.openTime)) {
      throw new ApiError(400, 'Invalid open time format. Use HH:MM')
    }
    if (data.closeTime && !this.isValidTimeFormat(data.closeTime)) {
      throw new ApiError(400, 'Invalid close time format. Use HH:MM')
    }

    // Check for duplicate holiday on the same date
    const existingHoliday = await prisma.holiday.findUnique({
      where: { date: new Date(data.date) }
    })

    if (existingHoliday) {
      throw new ApiError(400, 'A holiday already exists on this date')
    }

    const holiday = await prisma.holiday.create({
      data: {
        name: data.name,
        date: new Date(data.date),
        isClosed: data.isClosed,
        openTime: data.openTime,
        closeTime: data.closeTime,
        surchargePercentage: data.surchargePercentage,
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
      resource: 'holiday',
      resourceId: holiday.id,
      details: {
        name: holiday.name,
        date: holiday.date
      }
    })

    return holiday
  }

  async updateHoliday(id: string, data: Partial<HolidayData>, adminId: string) {
    const existingHoliday = await prisma.holiday.findUnique({
      where: { id }
    })

    if (!existingHoliday) {
      throw new ApiError(404, 'Holiday not found')
    }

    // Validate time format if provided
    if (data.openTime && !this.isValidTimeFormat(data.openTime)) {
      throw new ApiError(400, 'Invalid open time format. Use HH:MM')
    }
    if (data.closeTime && !this.isValidTimeFormat(data.closeTime)) {
      throw new ApiError(400, 'Invalid close time format. Use HH:MM')
    }

    const holiday = await prisma.holiday.update({
      where: { id },
      data: {
        ...data,
        date: data.date ? new Date(data.date) : undefined
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
      resource: 'holiday',
      resourceId: id,
      details: {
        name: holiday.name,
        changes: data
      }
    })

    return holiday
  }

  async deleteHoliday(id: string, adminId: string) {
    const holiday = await prisma.holiday.findUnique({
      where: { id }
    })

    if (!holiday) {
      throw new ApiError(404, 'Holiday not found')
    }

    await prisma.holiday.delete({
      where: { id }
    })

    await auditLogService.log({
      adminId,
      action: 'delete',
      resource: 'holiday',
      resourceId: id,
      details: {
        name: holiday.name,
        date: holiday.date
      }
    })

    return { success: true }
  }

  async checkIfOpen(dateTime: Date): Promise<{ isOpen: boolean; reason?: string }> {
    const dayOfWeek = dateTime.getDay()
    const timeString = format(dateTime, 'HH:mm')
    const dateOnly = startOfDay(dateTime)

    // Check holidays first
    const holiday = await prisma.holiday.findUnique({
      where: { date: dateOnly }
    })

    if (holiday) {
      if (holiday.isClosed) {
        return { isOpen: false, reason: `Closed for ${holiday.name}` }
      }
      if (holiday.openTime && holiday.closeTime) {
        const isWithinHolidayHours = this.isTimeWithinRange(
          timeString,
          holiday.openTime,
          holiday.closeTime
        )
        if (!isWithinHolidayHours) {
          return { isOpen: false, reason: `Outside ${holiday.name} hours` }
        }
      }
    }

    // Check regular business hours
    const businessHours = await prisma.businessHours.findUnique({
      where: { dayOfWeek }
    })

    if (!businessHours || businessHours.isClosed) {
      return { isOpen: false, reason: 'Closed on this day' }
    }

    const isWithinBusinessHours = this.isTimeWithinRange(
      timeString,
      businessHours.openTime,
      businessHours.closeTime
    )

    if (!isWithinBusinessHours) {
      return { isOpen: false, reason: 'Outside business hours' }
    }

    return { isOpen: true }
  }

  private async createDefaultBusinessHours() {
    const defaultHours = [
      { dayOfWeek: 0, openTime: '09:00', closeTime: '18:00', isClosed: false }, // Sunday
      { dayOfWeek: 1, openTime: '09:00', closeTime: '18:00', isClosed: false }, // Monday
      { dayOfWeek: 2, openTime: '09:00', closeTime: '18:00', isClosed: false }, // Tuesday
      { dayOfWeek: 3, openTime: '09:00', closeTime: '18:00', isClosed: false }, // Wednesday
      { dayOfWeek: 4, openTime: '09:00', closeTime: '18:00', isClosed: false }, // Thursday
      { dayOfWeek: 5, openTime: '09:00', closeTime: '18:00', isClosed: false }, // Friday
      { dayOfWeek: 6, openTime: '09:00', closeTime: '18:00', isClosed: false }  // Saturday
    ]

    const created = []
    for (const hours of defaultHours) {
      const businessHours = await prisma.businessHours.create({
        data: {
          ...hours,
          timezone: 'America/Los_Angeles'
        }
      })
      created.push({
        ...businessHours,
        dayName: this.getDayName(businessHours.dayOfWeek)
      })
    }

    return created
  }

  private getDayName(dayOfWeek: number): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    return days[dayOfWeek] || 'Unknown'
  }

  private isValidTimeFormat(time: string): boolean {
    const regex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    return regex.test(time)
  }

  private isTimeWithinRange(time: string, start: string, end: string): boolean {
    const timeMinutes = this.timeToMinutes(time)
    const startMinutes = this.timeToMinutes(start)
    const endMinutes = this.timeToMinutes(end)

    // Handle cases where end time is after midnight
    if (endMinutes < startMinutes) {
      return timeMinutes >= startMinutes || timeMinutes <= endMinutes
    }

    return timeMinutes >= startMinutes && timeMinutes <= endMinutes
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
  }

  private checkIf24x7(hours: any[]): boolean {
    return hours.every(h => 
      !h.isClosed && h.openTime === '00:00' && h.closeTime === '23:59'
    )
  }

  private checkWeekendHours(hours: any[]): boolean {
    const weekend = hours.filter(h => h.dayOfWeek === 0 || h.dayOfWeek === 6)
    return weekend.some(h => !h.isClosed)
  }
}

export const adminBusinessHoursService = new AdminBusinessHoursService()