import { PrismaClient } from '@prisma/client'
import { auditLogService } from './auditLog.service'

const prisma = new PrismaClient()

export interface PricingRuleData {
  name: string
  description?: string
  ruleType: 'base_rate' | 'distance_multiplier' | 'time_multiplier' | 'surcharge' | 'discount'
  serviceType: 'ONE_WAY' | 'ROUNDTRIP' | 'HOURLY'
  conditions: any
  calculation: any
  priority: number
  effectiveFrom: Date
  effectiveTo?: Date
  isActive: boolean
}

export interface PricingOverview {
  totalRules: number
  activeRules: number
  expiredRules: number
  pendingRules: number
  rulesByType: Record<string, number>
  recentChanges: any[]
}

class AdminPricingService {
  async getPricingOverview(): Promise<PricingOverview> {
    const now = new Date()
    
    const [
      totalRules,
      activeRules,
      expiredRules,
      pendingRules,
      rulesByType,
      recentChanges
    ] = await Promise.all([
      prisma.pricingRule.count(),
      prisma.pricingRule.count({
        where: {
          isActive: true,
          effectiveFrom: { lte: now },
          OR: [
            { effectiveTo: null },
            { effectiveTo: { gte: now } }
          ]
        }
      }),
      prisma.pricingRule.count({
        where: {
          effectiveTo: { lt: now }
        }
      }),
      prisma.pricingRule.count({
        where: {
          effectiveFrom: { gt: now }
        }
      }),
      prisma.pricingRule.groupBy({
        by: ['ruleType'],
        _count: true
      }),
      prisma.pricingRule.findMany({
        take: 10,
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
    ])

    const rulesByTypeMap = rulesByType.reduce((acc, item) => {
      acc[item.ruleType] = item._count
      return acc
    }, {} as Record<string, number>)

    return {
      totalRules,
      activeRules,
      expiredRules,
      pendingRules,
      rulesByType: rulesByTypeMap,
      recentChanges: recentChanges.map(rule => ({
        id: rule.id,
        name: rule.name,
        ruleType: rule.ruleType,
        serviceType: rule.serviceType,
        isActive: rule.isActive,
        updatedAt: rule.updatedAt,
        createdBy: rule.createdBy ? `${rule.createdBy.firstName} ${rule.createdBy.lastName}` : 'System'
      }))
    }
  }

  async getAllPricingRules(page = 1, limit = 20, filters: any = {}) {
    const skip = (page - 1) * limit
    const where: any = {}

    if (filters.serviceType) {
      where.serviceType = filters.serviceType
    }

    if (filters.ruleType) {
      where.ruleType = filters.ruleType
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } }
      ]
    }

    const [rules, total] = await Promise.all([
      prisma.pricingRule.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' }
        ],
        include: {
          createdBy: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      }),
      prisma.pricingRule.count({ where })
    ])

    return {
      rules: rules.map(rule => ({
        ...rule,
        createdBy: rule.createdBy ? `${rule.createdBy.firstName} ${rule.createdBy.lastName}` : 'System'
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  }

  async getPricingRuleById(id: string) {
    const rule = await prisma.pricingRule.findUnique({
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

    if (!rule) {
      throw new Error('Pricing rule not found')
    }

    return {
      ...rule,
      createdBy: rule.createdBy ? {
        name: `${rule.createdBy.firstName} ${rule.createdBy.lastName}`,
        email: rule.createdBy.email
      } : null
    }
  }

  async createPricingRule(data: PricingRuleData, adminId: string) {
    const rule = await prisma.pricingRule.create({
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
      resource: 'pricing_rule',
      resourceId: rule.id,
      details: {
        name: rule.name,
        ruleType: rule.ruleType,
        serviceType: rule.serviceType
      }
    })

    return {
      ...rule,
      createdBy: rule.createdBy ? `${rule.createdBy.firstName} ${rule.createdBy.lastName}` : 'System'
    }
  }

  async updatePricingRule(id: string, data: Partial<PricingRuleData>, adminId: string) {
    const existingRule = await prisma.pricingRule.findUnique({
      where: { id }
    })

    if (!existingRule) {
      throw new Error('Pricing rule not found')
    }

    const rule = await prisma.pricingRule.update({
      where: { id },
      data,
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
      resource: 'pricing_rule',
      resourceId: rule.id,
      details: {
        name: rule.name,
        changes: data
      }
    })

    return {
      ...rule,
      createdBy: rule.createdBy ? `${rule.createdBy.firstName} ${rule.createdBy.lastName}` : 'System'
    }
  }

  async deletePricingRule(id: string, adminId: string) {
    const rule = await prisma.pricingRule.findUnique({
      where: { id }
    })

    if (!rule) {
      throw new Error('Pricing rule not found')
    }

    await prisma.pricingRule.delete({
      where: { id }
    })

    await auditLogService.log({
      adminId,
      action: 'delete',
      resource: 'pricing_rule',
      resourceId: id,
      details: {
        name: rule.name,
        ruleType: rule.ruleType
      }
    })

    return { success: true }
  }

  async togglePricingRule(id: string, isActive: boolean, adminId: string) {
    const rule = await prisma.pricingRule.update({
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
      resource: 'pricing_rule',
      resourceId: id,
      details: {
        name: rule.name,
        isActive
      }
    })

    return {
      ...rule,
      createdBy: rule.createdBy ? `${rule.createdBy.firstName} ${rule.createdBy.lastName}` : 'System'
    }
  }

  async duplicatePricingRule(id: string, adminId: string) {
    const originalRule = await prisma.pricingRule.findUnique({
      where: { id }
    })

    if (!originalRule) {
      throw new Error('Pricing rule not found')
    }

    const { id: _, createdById: __, createdAt: ___, updatedAt: ____, ...ruleData } = originalRule

    const duplicatedRule = await prisma.pricingRule.create({
      data: {
        ...ruleData,
        name: `${originalRule.name} (Copy)`,
        isActive: false, // Duplicates start as inactive
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
      resource: 'pricing_rule',
      resourceId: duplicatedRule.id,
      details: {
        originalRuleId: id,
        originalRuleName: originalRule.name,
        newRuleName: duplicatedRule.name
      }
    })

    return {
      ...duplicatedRule,
      createdBy: duplicatedRule.createdBy ? `${duplicatedRule.createdBy.firstName} ${duplicatedRule.createdBy.lastName}` : 'System'
    }
  }

  async validatePricingRule(data: PricingRuleData) {
    const errors: string[] = []

    // Basic validation
    if (!data.name || data.name.trim().length === 0) {
      errors.push('Name is required')
    }

    if (!data.ruleType) {
      errors.push('Rule type is required')
    }

    if (!data.serviceType) {
      errors.push('Service type is required')
    }

    if (!data.calculation || Object.keys(data.calculation).length === 0) {
      errors.push('Calculation configuration is required')
    }

    if (data.effectiveFrom >= (data.effectiveTo || new Date('2099-12-31'))) {
      errors.push('Effective from date must be before effective to date')
    }

    // Check for conflicting rules
    const conflictingRules = await prisma.pricingRule.count({
      where: {
        serviceType: data.serviceType,
        ruleType: data.ruleType,
        priority: data.priority,
        isActive: true,
        effectiveFrom: { lte: data.effectiveTo || new Date('2099-12-31') },
        OR: [
          { effectiveTo: null },
          { effectiveTo: { gte: data.effectiveFrom } }
        ]
      }
    })

    if (conflictingRules > 0) {
      errors.push('A rule with the same type, service, and priority already exists for this time period')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

export const adminPricingService = new AdminPricingService()