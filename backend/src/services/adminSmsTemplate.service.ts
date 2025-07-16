import { PrismaClient } from '@prisma/client'
import { auditLogService } from './auditLog.service'
import { ApiError } from '../utils/errors'

const prisma = new PrismaClient()

export interface SmsTemplateData {
  key: string
  name: string
  content: string
  category: string
  variables: string[]
  characterCount: number
  segmentCount: number
  isActive: boolean
}

export interface SmsTemplateOverview {
  totalTemplates: number
  activeTemplates: number
  byCategory: { category: string; count: number }[]
  averageLength: number
  recentlyUpdated: any[]
}

class AdminSmsTemplateService {
  private readonly SMS_SEGMENT_LENGTH = 160
  private readonly SMS_MULTIPART_LENGTH = 153
  
  async getSmsTemplateOverview(): Promise<SmsTemplateOverview> {
    const templates = await prisma.smsTemplate.findMany({
      orderBy: { updatedAt: 'desc' }
    })
    
    const byCategory = templates.reduce((acc, template) => {
      const existing = acc.find(c => c.category === template.category)
      if (existing) {
        existing.count++
      } else {
        acc.push({ category: template.category, count: 1 })
      }
      return acc
    }, [] as { category: string; count: number }[])
    
    const recentlyUpdated = await prisma.smsTemplate.findMany({
      take: 5,
      orderBy: { updatedAt: 'desc' },
      include: {
        createdBy: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    })
    
    const totalCharacters = templates.reduce((sum, t) => sum + (t.characterCount || 0), 0)
    const averageLength = templates.length > 0 ? Math.round(totalCharacters / templates.length) : 0
    
    return {
      totalTemplates: templates.length,
      activeTemplates: templates.filter(t => t.isActive).length,
      byCategory,
      averageLength,
      recentlyUpdated
    }
  }
  
  async getAllSmsTemplates() {
    return prisma.smsTemplate.findMany({
      orderBy: { category: 'asc' },
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
  
  async getSmsTemplateByKey(key: string) {
    const template = await prisma.smsTemplate.findUnique({
      where: { key },
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
    
    if (!template) {
      throw new ApiError(404, 'SMS template not found')
    }
    
    return template
  }
  
  async createSmsTemplate(data: SmsTemplateData, adminId: string) {
    // Check if key already exists
    const existing = await prisma.smsTemplate.findUnique({
      where: { key: data.key }
    })
    
    if (existing) {
      throw new ApiError(400, 'Template with this key already exists')
    }
    
    // Calculate character and segment count
    const { characterCount, segmentCount } = this.calculateSmsLength(data.content)
    
    const template = await prisma.smsTemplate.create({
      data: {
        ...data,
        characterCount,
        segmentCount,
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
      resource: 'sms_template',
      resourceId: template.id,
      details: {
        key: template.key,
        name: template.name
      }
    })
    
    return template
  }
  
  async updateSmsTemplate(key: string, data: Partial<SmsTemplateData>, adminId: string) {
    const existing = await this.getSmsTemplateByKey(key)
    
    // Recalculate character count if content changed
    let characterCount = existing.characterCount
    let segmentCount = existing.segmentCount
    
    if (data.content) {
      const calculated = this.calculateSmsLength(data.content)
      characterCount = calculated.characterCount
      segmentCount = calculated.segmentCount
    }
    
    const template = await prisma.smsTemplate.update({
      where: { key },
      data: {
        ...data,
        characterCount,
        segmentCount,
        updatedAt: new Date()
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
      resource: 'sms_template',
      resourceId: template.id,
      details: {
        key: template.key,
        changes: data
      }
    })
    
    return template
  }
  
  async deleteSmsTemplate(key: string, adminId: string) {
    const template = await this.getSmsTemplateByKey(key)
    
    await prisma.smsTemplate.delete({
      where: { key }
    })
    
    await auditLogService.log({
      adminId,
      action: 'delete',
      resource: 'sms_template',
      resourceId: template.id,
      details: {
        key: template.key,
        name: template.name
      }
    })
    
    return { success: true }
  }
  
  async toggleSmsTemplate(key: string, isActive: boolean, adminId: string) {
    const template = await prisma.smsTemplate.update({
      where: { key },
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
      resource: 'sms_template',
      resourceId: template.id,
      details: {
        key: template.key,
        isActive
      }
    })
    
    return template
  }
  
  async duplicateSmsTemplate(key: string, newKey: string, adminId: string) {
    const source = await this.getSmsTemplateByKey(key)
    
    // Check if new key already exists
    const existing = await prisma.smsTemplate.findUnique({
      where: { key: newKey }
    })
    
    if (existing) {
      throw new ApiError(400, 'Template with this key already exists')
    }
    
    const template = await prisma.smsTemplate.create({
      data: {
        key: newKey,
        name: `${source.name} (Copy)`,
        content: source.content,
        category: source.category,
        variables: source.variables,
        characterCount: source.characterCount,
        segmentCount: source.segmentCount,
        isActive: false, // Start as inactive
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
      action: 'duplicate',
      resource: 'sms_template',
      resourceId: template.id,
      details: {
        sourceKey: key,
        newKey: newKey
      }
    })
    
    return template
  }
  
  async previewSmsTemplate(key: string, sampleData: any = {}) {
    const template = await this.getSmsTemplateByKey(key)
    
    // Replace variables with sample data
    let content = template.content
    
    // Default sample data
    const defaultData = {
      customerName: 'John Doe',
      bookingId: 'BOOK-12345',
      pickupTime: '10:00 AM',
      pickupDate: new Date().toLocaleDateString(),
      pickupAddress: '123 Main St',
      driverName: 'Michael Smith',
      driverPhone: '(555) 123-4567',
      vehicleType: 'Standard Sedan',
      confirmationCode: '1234',
      companyName: 'Stable Ride'
    }
    
    const data = { ...defaultData, ...sampleData }
    
    // Replace variables in content
    Object.entries(data).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g')
      content = content.replace(regex, String(value))
    })
    
    const { characterCount, segmentCount } = this.calculateSmsLength(content)
    
    return {
      content,
      characterCount,
      segmentCount,
      variables: template.variables,
      sampleData: data
    }
  }
  
  async sendTestSms(key: string, recipientPhone: string, adminId: string) {
    const template = await this.getSmsTemplateByKey(key)
    const preview = await this.previewSmsTemplate(key)
    
    // Here you would integrate with your SMS service (Twilio, etc.)
    // For now, we'll just log and return success
    console.log('Sending test SMS:', {
      to: recipientPhone,
      content: preview.content,
      template: key
    })
    
    await auditLogService.log({
      adminId,
      action: 'test_sms',
      resource: 'sms_template',
      resourceId: template.id,
      details: {
        key: template.key,
        recipient: recipientPhone
      }
    })
    
    return {
      success: true,
      message: `Test SMS sent to ${recipientPhone}`,
      characterCount: preview.characterCount,
      segmentCount: preview.segmentCount
    }
  }
  
  calculateSmsLength(content: string): { characterCount: number; segmentCount: number } {
    const characterCount = content.length
    
    // Check if content contains Unicode characters
    const hasUnicode = /[^\x00-\x7F]/.test(content)
    const segmentLength = hasUnicode ? 70 : this.SMS_SEGMENT_LENGTH
    const multipartLength = hasUnicode ? 67 : this.SMS_MULTIPART_LENGTH
    
    let segmentCount = 1
    
    if (characterCount > segmentLength) {
      segmentCount = Math.ceil(characterCount / multipartLength)
    }
    
    return { characterCount, segmentCount }
  }
  
  async getSmsTemplateDefaults() {
    return {
      categories: [
        'booking_confirmation',
        'booking_reminder',
        'driver_assigned',
        'driver_arrival',
        'booking_cancelled',
        'payment_confirmation',
        'verification_code'
      ],
      variables: [
        'customerName',
        'bookingId',
        'pickupTime',
        'pickupDate',
        'pickupAddress',
        'dropoffAddress',
        'driverName',
        'driverPhone',
        'vehicleType',
        'confirmationCode',
        'companyName',
        'supportPhone'
      ],
      templates: {
        booking_confirmation: {
          key: 'booking_confirmation_sms',
          name: 'Booking Confirmation SMS',
          content: 'Hi {{customerName}}, your {{companyName}} booking {{bookingId}} is confirmed for {{pickupDate}} at {{pickupTime}}. Pickup: {{pickupAddress}}',
          category: 'booking_confirmation',
          variables: ['customerName', 'companyName', 'bookingId', 'pickupDate', 'pickupTime', 'pickupAddress']
        },
        driver_assigned: {
          key: 'driver_assigned_sms',
          name: 'Driver Assigned SMS',
          content: '{{companyName}}: Your driver {{driverName}} has been assigned to booking {{bookingId}}. Contact: {{driverPhone}}',
          category: 'driver_assigned',
          variables: ['companyName', 'driverName', 'bookingId', 'driverPhone']
        },
        verification_code: {
          key: 'verification_code_sms',
          name: 'Verification Code SMS',
          content: 'Your {{companyName}} verification code is {{confirmationCode}}. This code expires in 10 minutes.',
          category: 'verification_code',
          variables: ['companyName', 'confirmationCode']
        }
      }
    }
  }
}

export const adminSmsTemplateService = new AdminSmsTemplateService()