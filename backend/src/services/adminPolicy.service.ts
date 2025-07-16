import { PrismaClient } from '@prisma/client'
import { auditLogService } from './auditLog.service'
import { ApiError } from '../utils/errors'

const prisma = new PrismaClient()

export interface PolicyData {
  key: string
  title: string
  content: string
  contentHtml?: string
  version: string
  category: 'terms_of_service' | 'privacy_policy' | 'cookie_policy' | 'refund_policy' | 'accessibility'
  effectiveDate: Date
  isActive: boolean
  requiresAcceptance: boolean
  metadata?: any
}

export interface PolicyOverview {
  totalPolicies: number
  activePolicies: number
  byCategory: { category: string; count: number }[]
  requiresUpdate: number
  recentChanges: any[]
}

class AdminPolicyService {
  async getPolicyOverview(): Promise<PolicyOverview> {
    const policies = await prisma.contentBlock.findMany({
      where: { contentType: 'policy' }
    })
    
    const byCategory = policies.reduce((acc, policy) => {
      const category = (policy.metadata as any)?.category || 'other'
      const existing = acc.find(c => c.category === category)
      if (existing) {
        existing.count++
      } else {
        acc.push({ category, count: 1 })
      }
      return acc
    }, [] as { category: string; count: number }[])
    
    const recentChanges = await prisma.contentBlock.findMany({
      where: { contentType: 'policy' },
      take: 5,
      orderBy: { updatedAt: 'desc' },
      include: {
        publishedBy: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    })
    
    // Count policies that haven't been updated in 6 months
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    
    const requiresUpdate = policies.filter(p => 
      p.updatedAt < sixMonthsAgo && p.isPublished
    ).length
    
    return {
      totalPolicies: policies.length,
      activePolicies: policies.filter(p => p.isPublished).length,
      byCategory,
      requiresUpdate,
      recentChanges
    }
  }
  
  async getAllPolicies() {
    return prisma.contentBlock.findMany({
      where: { contentType: 'policy' },
      orderBy: { key: 'asc' },
      include: {
        createdBy: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        publishedBy: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    })
  }
  
  async getPolicyByKey(key: string) {
    const policy = await prisma.contentBlock.findUnique({
      where: { key },
      include: {
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        publishedBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })
    
    if (!policy || policy.contentType !== 'policy') {
      throw new ApiError(404, 'Policy not found')
    }
    
    return policy
  }
  
  async getPolicyHistory(key: string) {
    // In a real implementation, you'd have a policy_versions table
    // For now, we'll return the current version
    const policy = await this.getPolicyByKey(key)
    
    return [{
      version: (policy.metadata as any)?.version || '1.0.0',
      effectiveDate: (policy.metadata as any)?.effectiveDate || policy.publishedAt,
      changes: 'Initial version',
      publishedBy: policy.publishedBy,
      publishedAt: policy.publishedAt
    }]
  }
  
  async createPolicy(data: PolicyData, adminId: string) {
    // Check if key already exists
    const existing = await prisma.contentBlock.findUnique({
      where: { key: data.key }
    })
    
    if (existing) {
      throw new ApiError(400, 'Policy with this key already exists')
    }
    
    const policy = await prisma.contentBlock.create({
      data: {
        key: data.key,
        title: data.title,
        content: data.content,
        contentHtml: data.contentHtml,
        contentType: 'policy',
        isPublished: data.isActive,
        publishedAt: data.isActive ? new Date() : null,
        metadata: {
          category: data.category,
          version: data.version,
          effectiveDate: data.effectiveDate,
          requiresAcceptance: data.requiresAcceptance,
          ...(data.metadata || {})
        },
        createdById: adminId,
        publishedById: data.isActive ? adminId : null
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
      resource: 'policy',
      resourceId: policy.id,
      details: {
        key: policy.key,
        title: policy.title,
        category: data.category
      }
    })
    
    return policy
  }
  
  async updatePolicy(key: string, data: Partial<PolicyData>, adminId: string) {
    const existing = await this.getPolicyByKey(key)
    
    const policy = await prisma.contentBlock.update({
      where: { key },
      data: {
        title: data.title,
        content: data.content,
        contentHtml: data.contentHtml,
        isPublished: data.isActive !== undefined ? data.isActive : existing.isPublished,
        publishedAt: data.isActive ? new Date() : existing.publishedAt,
        metadata: {
          ...(existing.metadata as any || {}),
          category: data.category || (existing.metadata as any)?.category,
          version: data.version || (existing.metadata as any)?.version,
          effectiveDate: data.effectiveDate || (existing.metadata as any)?.effectiveDate,
          requiresAcceptance: data.requiresAcceptance !== undefined 
            ? data.requiresAcceptance 
            : (existing.metadata as any)?.requiresAcceptance,
          ...(data.metadata || {})
        },
        publishedById: data.isActive ? adminId : existing.publishedById,
        updatedAt: new Date()
      },
      include: {
        createdBy: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        publishedBy: {
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
      resource: 'policy',
      resourceId: policy.id,
      details: {
        key: policy.key,
        changes: data
      }
    })
    
    return policy
  }
  
  async deletePolicy(key: string, adminId: string) {
    const policy = await this.getPolicyByKey(key)
    
    await prisma.contentBlock.delete({
      where: { key }
    })
    
    await auditLogService.log({
      adminId,
      action: 'delete',
      resource: 'policy',
      resourceId: policy.id,
      details: {
        key: policy.key,
        title: policy.title
      }
    })
    
    return { success: true }
  }
  
  async publishPolicy(key: string, adminId: string) {
    const policy = await prisma.contentBlock.update({
      where: { key },
      data: {
        isPublished: true,
        publishedAt: new Date(),
        publishedById: adminId
      },
      include: {
        publishedBy: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    })
    
    await auditLogService.log({
      adminId,
      action: 'publish',
      resource: 'policy',
      resourceId: policy.id,
      details: {
        key: policy.key,
        title: policy.title
      }
    })
    
    return policy
  }
  
  async unpublishPolicy(key: string, adminId: string) {
    const policy = await prisma.contentBlock.update({
      where: { key },
      data: {
        isPublished: false
      }
    })
    
    await auditLogService.log({
      adminId,
      action: 'unpublish',
      resource: 'policy',
      resourceId: policy.id,
      details: {
        key: policy.key,
        title: policy.title
      }
    })
    
    return policy
  }
  
  async duplicatePolicy(key: string, newKey: string, adminId: string) {
    const source = await this.getPolicyByKey(key)
    
    // Check if new key already exists
    const existing = await prisma.contentBlock.findUnique({
      where: { key: newKey }
    })
    
    if (existing) {
      throw new ApiError(400, 'Policy with this key already exists')
    }
    
    const metadata = source.metadata as any || {}
    
    const policy = await prisma.contentBlock.create({
      data: {
        key: newKey,
        title: `${source.title} (Copy)`,
        content: source.content,
        contentHtml: source.contentHtml,
        contentType: 'policy',
        isPublished: false,
        metadata: {
          ...metadata,
          version: '1.0.0', // Reset version for copy
          copiedFrom: source.key
        },
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
      resource: 'policy',
      resourceId: policy.id,
      details: {
        sourceKey: key,
        newKey: newKey
      }
    })
    
    return policy
  }
  
  async exportPolicy(key: string, format: 'html' | 'pdf' | 'markdown' = 'html') {
    const policy = await this.getPolicyByKey(key)
    const metadata = policy.metadata as any || {}
    
    if (format === 'html') {
      const html = `
<!DOCTYPE html>
<html>
<head>
  <title>${policy.title}</title>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { color: #333; }
    .metadata { color: #666; margin-bottom: 30px; }
  </style>
</head>
<body>
  <h1>${policy.title}</h1>
  <div class="metadata">
    <p>Version: ${metadata.version || '1.0.0'}</p>
    <p>Effective Date: ${metadata.effectiveDate ? new Date(metadata.effectiveDate).toLocaleDateString() : 'N/A'}</p>
    <p>Last Updated: ${policy.updatedAt.toLocaleDateString()}</p>
  </div>
  <div class="content">
    ${policy.contentHtml || policy.content.replace(/\n/g, '<br>')}
  </div>
</body>
</html>`
      
      return { format: 'html', content: html, filename: `${key}.html` }
    } else if (format === 'markdown') {
      const markdown = `# ${policy.title}

**Version:** ${metadata.version || '1.0.0'}  
**Effective Date:** ${metadata.effectiveDate ? new Date(metadata.effectiveDate).toLocaleDateString() : 'N/A'}  
**Last Updated:** ${policy.updatedAt.toLocaleDateString()}

---

${policy.content}`
      
      return { format: 'markdown', content: markdown, filename: `${key}.md` }
    }
    
    // PDF would require a library like puppeteer or pdfkit
    throw new ApiError(400, 'PDF export not yet implemented')
  }
  
  async getPolicyDefaults() {
    return {
      categories: [
        { value: 'terms_of_service', label: 'Terms of Service' },
        { value: 'privacy_policy', label: 'Privacy Policy' },
        { value: 'cookie_policy', label: 'Cookie Policy' },
        { value: 'refund_policy', label: 'Refund Policy' },
        { value: 'accessibility', label: 'Accessibility Statement' }
      ],
      templates: {
        terms_of_service: {
          key: 'terms_of_service',
          title: 'Terms of Service',
          category: 'terms_of_service',
          version: '1.0.0',
          requiresAcceptance: true,
          content: `# Terms of Service

Last updated: ${new Date().toLocaleDateString()}

## 1. Acceptance of Terms

By accessing and using Stable Ride's services, you accept and agree to be bound by these Terms of Service.

## 2. Description of Service

Stable Ride provides premium transportation services through our platform...

## 3. User Responsibilities

Users of our service agree to:
- Provide accurate information
- Treat drivers and vehicles with respect
- Pay for services rendered
- Follow all applicable laws

## 4. Limitation of Liability

Stable Ride shall not be liable for any indirect, incidental, special, consequential, or punitive damages...

## 5. Contact Information

If you have any questions about these Terms, please contact us at legal@stableride.com.`
        },
        privacy_policy: {
          key: 'privacy_policy',
          title: 'Privacy Policy',
          category: 'privacy_policy',
          version: '1.0.0',
          requiresAcceptance: true,
          content: `# Privacy Policy

Last updated: ${new Date().toLocaleDateString()}

## 1. Information We Collect

We collect information you provide directly to us, such as:
- Name and contact information
- Payment information
- Location data
- Communication preferences

## 2. How We Use Your Information

We use the information we collect to:
- Provide and improve our services
- Process transactions
- Send notifications
- Ensure safety and security

## 3. Information Sharing

We do not sell or rent your personal information to third parties...

## 4. Data Security

We take reasonable measures to protect your information from unauthorized access...

## 5. Contact Us

If you have questions about this Privacy Policy, contact us at privacy@stableride.com.`
        }
      }
    }
  }
}

export const adminPolicyService = new AdminPolicyService()