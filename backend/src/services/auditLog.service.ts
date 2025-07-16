import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuditLogData {
  adminId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
}

class AuditLogService {
  async log(data: AuditLogData): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          adminId: data.adminId,
          action: data.action,
          resource: data.resource,
          resourceId: data.resourceId,
          details: data.details,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent
        }
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
      // Don't throw error to prevent audit log failures from affecting operations
    }
  }

  async getAuditLogs(filters?: {
    adminId?: string;
    resource?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (filters?.adminId) {
      where.adminId = filters.adminId;
    }

    if (filters?.resource) {
      where.resource = filters.resource;
    }

    if (filters?.action) {
      where.action = filters.action;
    }

    if (filters?.startDate && filters?.endDate) {
      where.createdAt = {
        gte: filters.startDate,
        lte: filters.endDate
      };
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          admin: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: filters?.limit || 50,
        skip: filters?.offset || 0
      }),
      prisma.auditLog.count({ where })
    ]);

    return {
      logs,
      total,
      limit: filters?.limit || 50,
      offset: filters?.offset || 0
    };
  }

  async getAdminActivity(adminId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = await prisma.auditLog.findMany({
      where: {
        adminId,
        createdAt: {
          gte: startDate
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Group by action type
    const actionCounts: { [key: string]: number } = {};
    logs.forEach(log => {
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
    });

    return {
      totalActions: logs.length,
      actionCounts,
      recentLogs: logs.slice(0, 10)
    };
  }

  async getResourceHistory(resource: string, resourceId: string) {
    const logs = await prisma.auditLog.findMany({
      where: {
        resource,
        resourceId
      },
      include: {
        admin: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return logs;
  }
}

export const auditLogService = new AuditLogService();