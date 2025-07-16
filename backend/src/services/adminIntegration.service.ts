import { PrismaClient } from '@prisma/client'
import { auditLogService } from './auditLog.service'
import { ApiError } from '../utils/errors'
import * as crypto from 'crypto'

const prisma = new PrismaClient()

export interface IntegrationData {
  name: string
  provider: string
  config: any
  isActive: boolean
  environment: 'sandbox' | 'production'
}

export interface IntegrationOverview {
  totalIntegrations: number
  activeIntegrations: number
  byProvider: { provider: string; count: number }[]
  byEnvironment: { environment: string; count: number }[]
}

class AdminIntegrationService {
  private readonly encryptionKey = process.env.INTEGRATION_ENCRYPTION_KEY || 'default-key-change-in-production'
  
  async getIntegrationOverview(): Promise<IntegrationOverview> {
    const integrations = await prisma.integration.findMany()
    
    const byProvider = integrations.reduce((acc, int) => {
      const existing = acc.find(p => p.provider === int.provider)
      if (existing) {
        existing.count++
      } else {
        acc.push({ provider: int.provider, count: 1 })
      }
      return acc
    }, [] as { provider: string; count: number }[])
    
    const byEnvironment = integrations.reduce((acc, int) => {
      const existing = acc.find(e => e.environment === int.environment)
      if (existing) {
        existing.count++
      } else {
        acc.push({ environment: int.environment, count: 1 })
      }
      return acc
    }, [] as { environment: string; count: number }[])
    
    return {
      totalIntegrations: integrations.length,
      activeIntegrations: integrations.filter(i => i.isActive).length,
      byProvider,
      byEnvironment
    }
  }
  
  async getAllIntegrations() {
    const integrations = await prisma.integration.findMany({
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
    
    // Decrypt sensitive config data
    return integrations.map(int => ({
      ...int,
      config: this.decryptConfig(int.config as any)
    }))
  }
  
  async getIntegrationById(id: string) {
    const integration = await prisma.integration.findUnique({
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
    
    if (!integration) {
      throw new ApiError(404, 'Integration not found')
    }
    
    return {
      ...integration,
      config: this.decryptConfig(integration.config as any)
    }
  }
  
  async createIntegration(data: IntegrationData, adminId: string) {
    // Encrypt sensitive config data
    const encryptedConfig = this.encryptConfig(data.config)
    
    const integration = await prisma.integration.create({
      data: {
        name: data.name,
        provider: data.provider,
        config: encryptedConfig,
        isActive: data.isActive,
        environment: data.environment,
        createdById: adminId,
        lastTestedAt: null
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
      resource: 'integration',
      resourceId: integration.id,
      details: {
        name: integration.name,
        provider: integration.provider,
        environment: integration.environment
      }
    })
    
    return {
      ...integration,
      config: data.config // Return unencrypted for response
    }
  }
  
  async updateIntegration(id: string, data: Partial<IntegrationData>, adminId: string) {
    const existing = await this.getIntegrationById(id)
    
    const updateData: any = {
      ...data,
      updatedAt: new Date()
    }
    
    // Encrypt config if provided
    if (data.config) {
      updateData.config = this.encryptConfig(data.config)
    }
    
    const integration = await prisma.integration.update({
      where: { id },
      data: updateData,
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
      resource: 'integration',
      resourceId: id,
      details: {
        name: integration.name,
        changes: data
      }
    })
    
    return {
      ...integration,
      config: data.config || this.decryptConfig(integration.config as any)
    }
  }
  
  async deleteIntegration(id: string, adminId: string) {
    const integration = await this.getIntegrationById(id)
    
    await prisma.integration.delete({
      where: { id }
    })
    
    await auditLogService.log({
      adminId,
      action: 'delete',
      resource: 'integration',
      resourceId: id,
      details: {
        name: integration.name,
        provider: integration.provider
      }
    })
    
    return { success: true }
  }
  
  async toggleIntegration(id: string, isActive: boolean, adminId: string) {
    const integration = await prisma.integration.update({
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
      resource: 'integration',
      resourceId: id,
      details: {
        name: integration.name,
        isActive
      }
    })
    
    return {
      ...integration,
      config: this.decryptConfig(integration.config as any)
    }
  }
  
  async testIntegration(id: string, adminId: string) {
    const integration = await this.getIntegrationById(id)
    
    let testResult = {
      success: false,
      message: '',
      details: {}
    }
    
    try {
      // Test based on provider
      switch (integration.provider) {
        case 'stripe':
          testResult = await this.testStripeIntegration(integration.config)
          break
        case 'twilio':
          testResult = await this.testTwilioIntegration(integration.config)
          break
        case 'sendgrid':
          testResult = await this.testSendGridIntegration(integration.config)
          break
        case 'google_maps':
          testResult = await this.testGoogleMapsIntegration(integration.config)
          break
        default:
          throw new ApiError(400, `Unknown provider: ${integration.provider}`)
      }
      
      // Update last tested timestamp
      await prisma.integration.update({
        where: { id },
        data: { lastTestedAt: new Date() }
      })
      
      await auditLogService.log({
        adminId,
        action: 'test',
        resource: 'integration',
        resourceId: id,
        details: {
          name: integration.name,
          success: testResult.success,
          message: testResult.message
        }
      })
      
      return testResult
    } catch (error: any) {
      testResult = {
        success: false,
        message: error.message || 'Test failed',
        details: error
      }
      
      await auditLogService.log({
        adminId,
        action: 'test',
        resource: 'integration',
        resourceId: id,
        details: {
          name: integration.name,
          success: false,
          error: error.message
        }
      })
      
      return testResult
    }
  }
  
  private async testStripeIntegration(config: any) {
    // Import Stripe dynamically to avoid initialization issues
    const stripe = require('stripe')(config.secretKey)
    
    try {
      // Try to retrieve account info
      const account = await stripe.accounts.retrieve()
      
      return {
        success: true,
        message: 'Successfully connected to Stripe',
        details: {
          accountId: account.id,
          businessProfile: account.business_profile?.name
        }
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Stripe connection failed: ${error.message}`,
        details: error
      }
    }
  }
  
  private async testTwilioIntegration(config: any) {
    const twilio = require('twilio')(config.accountSid, config.authToken)
    
    try {
      // Try to fetch account details
      const account = await twilio.api.accounts(config.accountSid).fetch()
      
      return {
        success: true,
        message: 'Successfully connected to Twilio',
        details: {
          accountName: account.friendlyName,
          status: account.status
        }
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Twilio connection failed: ${error.message}`,
        details: error
      }
    }
  }
  
  private async testSendGridIntegration(config: any) {
    const sgMail = require('@sendgrid/mail')
    sgMail.setApiKey(config.apiKey)
    
    try {
      // Verify API key by sending a test request
      const response = await fetch('https://api.sendgrid.com/v3/scopes', {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`
        }
      })
      
      if (response.ok) {
        const scopes = await response.json()
        return {
          success: true,
          message: 'Successfully connected to SendGrid',
          details: {
            scopes: scopes.scopes || []
          }
        }
      } else {
        throw new Error(`API returned ${response.status}`)
      }
    } catch (error: any) {
      return {
        success: false,
        message: `SendGrid connection failed: ${error.message}`,
        details: error
      }
    }
  }
  
  private async testGoogleMapsIntegration(config: any) {
    try {
      // Test geocoding API
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=1600+Amphitheatre+Parkway,+Mountain+View,+CA&key=${config.apiKey}`
      )
      
      const data = await response.json()
      
      if (data.status === 'OK') {
        return {
          success: true,
          message: 'Successfully connected to Google Maps',
          details: {
            status: data.status
          }
        }
      } else {
        throw new Error(data.error_message || data.status)
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Google Maps connection failed: ${error.message}`,
        details: error
      }
    }
  }
  
  private encryptConfig(config: any): any {
    const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey)
    let encrypted = cipher.update(JSON.stringify(config), 'utf8', 'hex')
    encrypted += cipher.final('hex')
    return { encrypted }
  }
  
  private decryptConfig(config: any): any {
    if (!config.encrypted) return config
    
    try {
      const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey)
      let decrypted = decipher.update(config.encrypted, 'hex', 'utf8')
      decrypted += decipher.final('utf8')
      return JSON.parse(decrypted)
    } catch (error) {
      console.error('Failed to decrypt config:', error)
      return {}
    }
  }
}

export const adminIntegrationService = new AdminIntegrationService()