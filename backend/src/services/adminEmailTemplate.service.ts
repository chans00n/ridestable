import { PrismaClient } from '@prisma/client'
import { auditLogService } from './auditLog.service'
import { ApiError } from '../utils/errors'

const prisma = new PrismaClient()

export interface EmailTemplateData {
  key: string
  name: string
  subject: string
  content: string
  contentHtml?: string
  category: string
  variables: string[]
  isActive: boolean
}

export interface EmailTemplateOverview {
  totalTemplates: number
  activeTemplates: number
  byCategory: { category: string; count: number }[]
  recentlyUpdated: any[]
}

class AdminEmailTemplateService {
  async getEmailTemplateOverview(): Promise<EmailTemplateOverview> {
    const templates = await prisma.emailTemplate.findMany({
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
    
    const recentlyUpdated = await prisma.emailTemplate.findMany({
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
    
    return {
      totalTemplates: templates.length,
      activeTemplates: templates.filter(t => t.isActive).length,
      byCategory,
      recentlyUpdated
    }
  }
  
  async getAllEmailTemplates() {
    return prisma.emailTemplate.findMany({
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
  
  async getEmailTemplateByKey(key: string) {
    const template = await prisma.emailTemplate.findUnique({
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
      throw new ApiError(404, 'Email template not found')
    }
    
    return template
  }
  
  async createEmailTemplate(data: EmailTemplateData, adminId: string) {
    // Check if key already exists
    const existing = await prisma.emailTemplate.findUnique({
      where: { key: data.key }
    })
    
    if (existing) {
      throw new ApiError(400, 'Template with this key already exists')
    }
    
    const template = await prisma.emailTemplate.create({
      data: {
        ...data,
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
      resource: 'email_template',
      resourceId: template.id,
      details: {
        key: template.key,
        name: template.name
      }
    })
    
    return template
  }
  
  async updateEmailTemplate(key: string, data: Partial<EmailTemplateData>, adminId: string) {
    const existing = await this.getEmailTemplateByKey(key)
    
    const template = await prisma.emailTemplate.update({
      where: { key },
      data: {
        ...data,
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
      resource: 'email_template',
      resourceId: template.id,
      details: {
        key: template.key,
        changes: data
      }
    })
    
    return template
  }
  
  async deleteEmailTemplate(key: string, adminId: string) {
    const template = await this.getEmailTemplateByKey(key)
    
    await prisma.emailTemplate.delete({
      where: { key }
    })
    
    await auditLogService.log({
      adminId,
      action: 'delete',
      resource: 'email_template',
      resourceId: template.id,
      details: {
        key: template.key,
        name: template.name
      }
    })
    
    return { success: true }
  }
  
  async toggleEmailTemplate(key: string, isActive: boolean, adminId: string) {
    const template = await prisma.emailTemplate.update({
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
      resource: 'email_template',
      resourceId: template.id,
      details: {
        key: template.key,
        isActive
      }
    })
    
    return template
  }
  
  async duplicateEmailTemplate(key: string, newKey: string, adminId: string) {
    const source = await this.getEmailTemplateByKey(key)
    
    // Check if new key already exists
    const existing = await prisma.emailTemplate.findUnique({
      where: { key: newKey }
    })
    
    if (existing) {
      throw new ApiError(400, 'Template with this key already exists')
    }
    
    const template = await prisma.emailTemplate.create({
      data: {
        key: newKey,
        name: `${source.name} (Copy)`,
        subject: source.subject,
        content: source.content,
        contentHtml: source.contentHtml,
        category: source.category,
        variables: source.variables,
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
      resource: 'email_template',
      resourceId: template.id,
      details: {
        sourceKey: key,
        newKey: newKey
      }
    })
    
    return template
  }
  
  async previewEmailTemplate(key: string, sampleData: any = {}) {
    const template = await this.getEmailTemplateByKey(key)
    
    // Replace variables with sample data
    let subject = template.subject
    let content = template.content
    let contentHtml = template.contentHtml || template.content
    
    // Default sample data
    const defaultData = {
      customerName: 'John Doe',
      customerEmail: 'john.doe@example.com',
      bookingId: 'BOOK-12345',
      pickupDate: new Date().toLocaleDateString(),
      pickupTime: '10:00 AM',
      pickupAddress: '123 Main St, San Francisco, CA',
      dropoffAddress: '456 Market St, San Francisco, CA',
      vehicleType: 'Standard Sedan',
      price: '$75.00',
      driverName: 'Michael Smith',
      companyName: 'Stable Ride',
      supportEmail: 'support@stableride.com',
      supportPhone: '(555) 123-4567'
    }
    
    const data = { ...defaultData, ...sampleData }
    
    // Replace variables in subject and content
    Object.entries(data).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g')
      subject = subject.replace(regex, String(value))
      content = content.replace(regex, String(value))
      contentHtml = contentHtml.replace(regex, String(value))
    })
    
    return {
      subject,
      content,
      contentHtml,
      variables: template.variables,
      sampleData: data
    }
  }
  
  async sendTestEmail(key: string, recipientEmail: string, adminId: string) {
    const template = await this.getEmailTemplateByKey(key)
    const preview = await this.previewEmailTemplate(key)
    
    // Here you would integrate with your email service (SendGrid, etc.)
    // For now, we'll just log and return success
    console.log('Sending test email:', {
      to: recipientEmail,
      subject: preview.subject,
      template: key
    })
    
    await auditLogService.log({
      adminId,
      action: 'test_email',
      resource: 'email_template',
      resourceId: template.id,
      details: {
        key: template.key,
        recipient: recipientEmail
      }
    })
    
    return {
      success: true,
      message: `Test email sent to ${recipientEmail}`
    }
  }
  
  async getEmailTemplateDefaults() {
    return {
      categories: [
        'booking_confirmation',
        'booking_reminder',
        'booking_cancelled',
        'payment_receipt',
        'driver_assigned',
        'customer_welcome',
        'password_reset',
        'account_verification'
      ],
      variables: [
        'customerName',
        'customerEmail',
        'bookingId',
        'pickupDate',
        'pickupTime',
        'pickupAddress',
        'dropoffAddress',
        'vehicleType',
        'price',
        'driverName',
        'driverPhone',
        'companyName',
        'supportEmail',
        'supportPhone',
        'confirmationUrl',
        'cancelUrl',
        'modifyUrl'
      ],
      templates: {
        booking_confirmation: {
          key: 'booking_confirmation',
          name: 'Booking Confirmation',
          subject: 'Your Stable Ride Booking Confirmation - {{bookingId}}',
          content: `Hi {{customerName}},

Thank you for booking with {{companyName}}! Your ride has been confirmed.

Booking Details:
- Booking ID: {{bookingId}}
- Pickup Date: {{pickupDate}}
- Pickup Time: {{pickupTime}}
- Pickup Location: {{pickupAddress}}
- Dropoff Location: {{dropoffAddress}}
- Vehicle Type: {{vehicleType}}
- Total Price: {{price}}

You will receive another email once a driver has been assigned to your booking.

If you need to make any changes or cancel your booking, please contact us at {{supportEmail}} or {{supportPhone}}.

Thank you for choosing {{companyName}}!

Best regards,
The {{companyName}} Team`,
          category: 'booking_confirmation',
          variables: ['customerName', 'companyName', 'bookingId', 'pickupDate', 'pickupTime', 'pickupAddress', 'dropoffAddress', 'vehicleType', 'price', 'supportEmail', 'supportPhone']
        }
      }
    }
  }
}

export const adminEmailTemplateService = new AdminEmailTemplateService()