import { Request, Response, NextFunction } from 'express';
import { adminAuthService } from '../services/adminAuth.service';
import { AdminLoginDto, AdminAuthRequest } from '../types/admin';
import { AppError } from '../utils/errors';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  mfaCode: z.string().length(6).optional()
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8).regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  )
});

export class AdminAuthController {
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = loginSchema.parse(req.body);
      const ipAddress = req.ip;
      const userAgent = req.get('user-agent');

      const result = await adminAuthService.login(validatedData, ipAddress, userAgent);

      if (result.requiresMfa) {
        res.json({
          status: 'mfa_required',
          message: 'MFA code required'
        });
        return;
      }

      // Set refresh token as HTTP-only cookie
      res.cookie('adminRefreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      res.json({
        status: 'success',
        data: {
          accessToken: result.accessToken,
          admin: result.admin
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req: AdminAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies.adminRefreshToken;
      if (refreshToken && req.admin) {
        await adminAuthService.logout(req.admin.id, refreshToken);
      }

      res.clearCookie('adminRefreshToken');
      res.json({
        status: 'success',
        message: 'Logged out successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies.adminRefreshToken;
      if (!refreshToken) {
        throw new AppError('Refresh token not provided', 401);
      }

      const result = await adminAuthService.refreshAccessToken(refreshToken);

      // Set new refresh token
      res.cookie('adminRefreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      res.json({
        status: 'success',
        data: {
          accessToken: result.accessToken
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async setupMfa(req: AdminAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.admin) {
        throw new AppError('Unauthorized', 401);
      }

      const result = await adminAuthService.setupMfa(req.admin.id);

      res.json({
        status: 'success',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async enableMfa(req: AdminAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.admin) {
        throw new AppError('Unauthorized', 401);
      }

      const { code } = req.body;
      if (!code || code.length !== 6) {
        throw new AppError('Invalid MFA code', 400);
      }

      await adminAuthService.enableMfa(req.admin.id, code);

      res.json({
        status: 'success',
        message: 'MFA enabled successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async disableMfa(req: AdminAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.admin) {
        throw new AppError('Unauthorized', 401);
      }

      const { password } = req.body;
      if (!password) {
        throw new AppError('Password required', 400);
      }

      await adminAuthService.disableMfa(req.admin.id, password);

      res.json({
        status: 'success',
        message: 'MFA disabled successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req: AdminAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.admin) {
        throw new AppError('Unauthorized', 401);
      }

      const validatedData = changePasswordSchema.parse(req.body);
      
      await adminAuthService.changePassword(
        req.admin.id,
        validatedData.currentPassword,
        validatedData.newPassword
      );

      res.json({
        status: 'success',
        message: 'Password changed successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req: AdminAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.admin) {
        throw new AppError('Unauthorized', 401);
      }

      res.json({
        status: 'success',
        data: {
          admin: req.admin
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

export const adminAuthController = new AdminAuthController();