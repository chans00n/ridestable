import { PrismaClient, AdminUser, AdminRole, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { AppError } from '../utils/errors';
import { adminAuthService } from './adminAuth.service';
import { ADMIN_PERMISSIONS } from '../types/admin';

const prisma = new PrismaClient();

export interface AdminUserCreateDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: AdminRole;
}

export interface AdminUserUpdateDto {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: AdminRole;
  isActive?: boolean;
  sessionTimeout?: number;
}

export interface AdminUserFilters {
  role?: AdminRole;
  isActive?: boolean;
  search?: string;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class AdminUserService {
  async createAdminUser(
    data: AdminUserCreateDto,
    createdByAdminId: string
  ): Promise<AdminUser> {
    // Check if email already exists
    const existingAdmin = await prisma.adminUser.findUnique({
      where: { email: data.email.toLowerCase() }
    });

    if (existingAdmin) {
      throw new AppError('Email already in use', 409);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create admin user
    const admin = await prisma.adminUser.create({
      data: {
        ...data,
        email: data.email.toLowerCase(),
        password: hashedPassword,
        permissions: JSON.stringify([])
      }
    });

    // Log creation
    await adminAuthService.logAuditEntry(
      createdByAdminId,
      'ADMIN_USER_CREATED',
      'admin_users',
      admin.id,
      { email: admin.email, role: admin.role }
    );

    return admin;
  }

  async updateAdminUser(
    adminId: string,
    data: AdminUserUpdateDto,
    updatedByAdminId: string
  ): Promise<AdminUser> {
    // Check if admin exists
    const admin = await prisma.adminUser.findUnique({
      where: { id: adminId }
    });

    if (!admin) {
      throw new AppError('Admin user not found', 404);
    }

    // Check if email is being changed and already exists
    if (data.email && data.email !== admin.email) {
      const existingAdmin = await prisma.adminUser.findUnique({
        where: { email: data.email.toLowerCase() }
      });

      if (existingAdmin) {
        throw new AppError('Email already in use', 409);
      }
    }

    // Update admin user
    const updatedAdmin = await prisma.adminUser.update({
      where: { id: adminId },
      data: {
        ...data,
        email: data.email?.toLowerCase()
      }
    });

    // Log update
    await adminAuthService.logAuditEntry(
      updatedByAdminId,
      'ADMIN_USER_UPDATED',
      'admin_users',
      adminId,
      { changes: data }
    );

    return updatedAdmin;
  }

  async deleteAdminUser(
    adminId: string,
    deletedByAdminId: string
  ): Promise<void> {
    // Check if admin exists
    const admin = await prisma.adminUser.findUnique({
      where: { id: adminId }
    });

    if (!admin) {
      throw new AppError('Admin user not found', 404);
    }

    // Prevent self-deletion
    if (adminId === deletedByAdminId) {
      throw new AppError('Cannot delete your own account', 400);
    }

    // Soft delete by deactivating
    await prisma.adminUser.update({
      where: { id: adminId },
      data: { isActive: false }
    });

    // Log deletion
    await adminAuthService.logAuditEntry(
      deletedByAdminId,
      'ADMIN_USER_DEACTIVATED',
      'admin_users',
      adminId,
      { email: admin.email }
    );
  }

  async getAdminUsers(
    filters: AdminUserFilters = {},
    pagination: PaginationOptions = { page: 1, limit: 20 }
  ): Promise<{
    data: AdminUser[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { role, isActive, search } = filters;
    const { page, limit, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;

    const where: Prisma.AdminUserWhereInput = {};

    if (role) {
      where.role = role;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [data, total] = await Promise.all([
      prisma.adminUser.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          lastLoginAt: true,
          mfaEnabled: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      prisma.adminUser.count({ where })
    ]);

    return {
      data: data as AdminUser[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getAdminUserById(adminId: string): Promise<AdminUser | null> {
    const admin = await prisma.adminUser.findUnique({
      where: { id: adminId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        mfaEnabled: true,
        sessionTimeout: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!admin) {
      return null;
    }

    return {
      ...admin,
      permissions: ADMIN_PERMISSIONS[admin.role]
    } as any;
  }

  async resetAdminPassword(
    adminId: string,
    resetByAdminId: string
  ): Promise<string> {
    const admin = await prisma.adminUser.findUnique({
      where: { id: adminId }
    });

    if (!admin) {
      throw new AppError('Admin user not found', 404);
    }

    // Generate temporary password
    const tempPassword = this.generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Update password
    await prisma.adminUser.update({
      where: { id: adminId },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null
      }
    });

    // Log password reset
    await adminAuthService.logAuditEntry(
      resetByAdminId,
      'ADMIN_PASSWORD_RESET',
      'admin_users',
      adminId
    );

    return tempPassword;
  }

  async unlockAdminUser(
    adminId: string,
    unlockedByAdminId: string
  ): Promise<void> {
    const admin = await prisma.adminUser.findUnique({
      where: { id: adminId }
    });

    if (!admin) {
      throw new AppError('Admin user not found', 404);
    }

    await prisma.adminUser.update({
      where: { id: adminId },
      data: {
        loginAttempts: 0,
        lockedUntil: null
      }
    });

    // Log unlock
    await adminAuthService.logAuditEntry(
      unlockedByAdminId,
      'ADMIN_USER_UNLOCKED',
      'admin_users',
      adminId
    );
  }

  async getAdminActivity(
    adminId: string,
    days: number = 30
  ): Promise<any[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const activities = await prisma.auditLog.findMany({
      where: {
        adminId,
        createdAt: { gte: since }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    return activities;
  }

  private generateTempPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }
}

export const adminUserService = new AdminUserService();