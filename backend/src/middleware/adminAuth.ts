import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { config } from '../config';
import { AppError } from '../utils/errors';
import { AdminAuthRequest, AdminTokenPayload, ADMIN_PERMISSIONS } from '../types/admin';
import { adminAuthService } from '../services/adminAuth.service';

const prisma = new PrismaClient();

export const authenticateAdmin = async (
  req: AdminAuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractToken(req);
    if (!token) {
      throw new AppError('No token provided', 401);
    }

    const decoded = jwt.verify(token, config.jwt.secret) as AdminTokenPayload;
    
    if (!decoded.adminId) {
      console.error('Admin token payload missing adminId:', decoded);
      throw new AppError('Invalid token payload', 401);
    }
    
    const admin = await prisma.adminUser.findUnique({
      where: { id: decoded.adminId }
    });

    if (!admin || !admin.isActive) {
      throw new AppError('Invalid token', 401);
    }

    const permissions = ADMIN_PERMISSIONS[admin.role];

    req.admin = {
      id: admin.id,
      email: admin.email,
      firstName: admin.firstName,
      lastName: admin.lastName,
      role: admin.role,
      permissions
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      next(new AppError('Token expired', 401));
    } else if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Invalid token', 401));
    } else {
      next(error);
    }
  }
};

export const authorizeAdmin = (resource: string, action: string) => {
  return async (req: AdminAuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.admin) {
        throw new AppError('Unauthorized', 401);
      }

      const hasPermission = await adminAuthService.hasPermission(
        req.admin.id,
        resource,
        action
      );

      if (!hasPermission) {
        // Log unauthorized access attempt
        await adminAuthService.logAuditEntry(
          req.admin.id,
          'UNAUTHORIZED_ACCESS_ATTEMPT',
          resource,
          undefined,
          { action, role: req.admin.role },
          req.ip,
          req.get('user-agent')
        );

        throw new AppError('Insufficient permissions', 403);
      }

      // Log authorized access
      await adminAuthService.logAuditEntry(
        req.admin.id,
        `${action.toUpperCase()}_${resource.toUpperCase()}`,
        resource,
        undefined,
        undefined,
        req.ip,
        req.get('user-agent')
      );

      next();
    } catch (error) {
      next(error);
    }
  };
};

export const requireRole = (roles: string[]) => {
  return (req: AdminAuthRequest, res: Response, next: NextFunction): void => {
    if (!req.admin) {
      next(new AppError('Unauthorized', 401));
      return;
    }

    if (!roles.includes(req.admin.role)) {
      next(new AppError('Insufficient permissions', 403));
      return;
    }

    next();
  };
};

function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}