import { Request, Response, NextFunction } from 'express';
import { adminUserService } from '../services/adminUser.service';
import { AdminAuthRequest } from '../types/admin';
import { AppError } from '../utils/errors';
import { z } from 'zod';
import { AdminRole } from '@prisma/client';

const createAdminSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  ),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  role: z.enum(['SUPER_ADMIN', 'OPERATIONS_MANAGER', 'FINANCE_MANAGER', 'CUSTOMER_SERVICE'])
});

const updateAdminSchema = z.object({
  email: z.string().email().optional(),
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  role: z.enum(['SUPER_ADMIN', 'OPERATIONS_MANAGER', 'FINANCE_MANAGER', 'CUSTOMER_SERVICE']).optional(),
  isActive: z.boolean().optional(),
  sessionTimeout: z.number().min(300).max(86400).optional() // 5 min to 24 hours
});

export class AdminUserController {
  async createAdmin(req: AdminAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.admin) {
        throw new AppError('Unauthorized', 401);
      }

      const validatedData = createAdminSchema.parse(req.body);
      
      const admin = await adminUserService.createAdminUser(
        validatedData,
        req.admin.id
      );

      res.status(201).json({
        status: 'success',
        data: {
          id: admin.id,
          email: admin.email,
          firstName: admin.firstName,
          lastName: admin.lastName,
          role: admin.role,
          isActive: admin.isActive,
          createdAt: admin.createdAt
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async updateAdmin(req: AdminAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.admin) {
        throw new AppError('Unauthorized', 401);
      }

      const { adminId } = req.params;
      const validatedData = updateAdminSchema.parse(req.body);

      // Prevent non-super admins from changing roles
      if (validatedData.role && req.admin.role !== 'SUPER_ADMIN') {
        throw new AppError('Only super admins can change roles', 403);
      }

      const admin = await adminUserService.updateAdminUser(
        adminId,
        validatedData,
        req.admin.id
      );

      res.json({
        status: 'success',
        data: {
          id: admin.id,
          email: admin.email,
          firstName: admin.firstName,
          lastName: admin.lastName,
          role: admin.role,
          isActive: admin.isActive,
          updatedAt: admin.updatedAt
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteAdmin(req: AdminAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.admin) {
        throw new AppError('Unauthorized', 401);
      }

      const { adminId } = req.params;

      await adminUserService.deleteAdminUser(adminId, req.admin.id);

      res.json({
        status: 'success',
        message: 'Admin user deactivated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async getAdmins(req: AdminAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.admin) {
        throw new AppError('Unauthorized', 401);
      }

      const {
        page = '1',
        limit = '20',
        role,
        isActive,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const filters = {
        role: role as AdminRole | undefined,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        search: search as string | undefined
      };

      const pagination = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc'
      };

      const result = await adminUserService.getAdminUsers(filters, pagination);

      res.json({
        status: 'success',
        data: result.data,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getAdminById(req: AdminAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.admin) {
        throw new AppError('Unauthorized', 401);
      }

      const { adminId } = req.params;

      const admin = await adminUserService.getAdminUserById(adminId);

      if (!admin) {
        throw new AppError('Admin user not found', 404);
      }

      res.json({
        status: 'success',
        data: admin
      });
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: AdminAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.admin) {
        throw new AppError('Unauthorized', 401);
      }

      const { adminId } = req.params;

      const tempPassword = await adminUserService.resetAdminPassword(
        adminId,
        req.admin.id
      );

      res.json({
        status: 'success',
        data: {
          temporaryPassword: tempPassword,
          message: 'Password has been reset. Please share this temporary password securely with the admin user.'
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async unlockAdmin(req: AdminAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.admin) {
        throw new AppError('Unauthorized', 401);
      }

      const { adminId } = req.params;

      await adminUserService.unlockAdminUser(adminId, req.admin.id);

      res.json({
        status: 'success',
        message: 'Admin user unlocked successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async getAdminActivity(req: AdminAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.admin) {
        throw new AppError('Unauthorized', 401);
      }

      const { adminId } = req.params;
      const { days = '30' } = req.query;

      const activities = await adminUserService.getAdminActivity(
        adminId,
        parseInt(days as string)
      );

      res.json({
        status: 'success',
        data: activities
      });
    } catch (error) {
      next(error);
    }
  }
}

export const adminUserController = new AdminUserController();