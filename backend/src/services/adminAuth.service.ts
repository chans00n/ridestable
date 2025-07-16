import { PrismaClient, AdminUser, AdminRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import { config } from '../config';
import { AppError } from '../utils/errors';
import { 
  AdminLoginDto, 
  AdminLoginResponse, 
  AdminTokenPayload, 
  MfaSetupResponse,
  ADMIN_PERMISSIONS,
  Permission,
  AuditLogEntry
} from '../types/admin';
import crypto from 'crypto';

const prisma = new PrismaClient();

export class AdminAuthService {
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION = 30 * 60 * 1000; // 30 minutes
  private readonly TOKEN_EXPIRY = '1h';
  private readonly REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

  async login(loginDto: AdminLoginDto, ipAddress?: string, userAgent?: string): Promise<AdminLoginResponse> {
    const { email, password, mfaCode } = loginDto;

    // Find admin user
    const admin = await prisma.adminUser.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!admin) {
      throw new AppError('Invalid credentials', 401);
    }

    // Check if account is locked
    if (admin.lockedUntil && admin.lockedUntil > new Date()) {
      const remainingTime = Math.ceil((admin.lockedUntil.getTime() - Date.now()) / 60000);
      throw new AppError(`Account locked. Try again in ${remainingTime} minutes`, 423);
    }

    // Check if account is active
    if (!admin.isActive) {
      throw new AppError('Account is disabled', 403);
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, admin.password);
    if (!isValidPassword) {
      await this.handleFailedLogin(admin.id);
      throw new AppError('Invalid credentials', 401);
    }

    // Check MFA if enabled
    if (admin.mfaEnabled) {
      if (!mfaCode) {
        return { requiresMfa: true };
      }

      const isValidMfa = this.verifyMfaCode(admin.mfaSecret!, mfaCode);
      if (!isValidMfa) {
        await this.logAuditEntry(admin.id, 'LOGIN_MFA_FAILED', 'admin_auth', admin.id, { email }, ipAddress, userAgent);
        throw new AppError('Invalid MFA code', 401);
      }
    }

    // Reset login attempts on successful login
    await prisma.adminUser.update({
      where: { id: admin.id },
      data: {
        loginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date()
      }
    });

    // Generate tokens
    const sessionId = crypto.randomBytes(32).toString('hex');
    const accessToken = this.generateAccessToken(admin, sessionId);
    const refreshToken = await this.generateRefreshToken(admin.id);

    // Log successful login
    await this.logAuditEntry(admin.id, 'LOGIN_SUCCESS', 'admin_auth', admin.id, { email }, ipAddress, userAgent);

    const permissions = ADMIN_PERMISSIONS[admin.role];

    return {
      accessToken,
      refreshToken,
      admin: {
        id: admin.id,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
        role: admin.role,
        permissions
      }
    };
  }

  async logout(adminId: string, refreshToken: string): Promise<void> {
    await prisma.adminRefreshToken.deleteMany({
      where: {
        adminId,
        token: refreshToken
      }
    });

    await this.logAuditEntry(adminId, 'LOGOUT', 'admin_auth', adminId);
  }

  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const tokenRecord = await prisma.adminRefreshToken.findUnique({
      where: { token: refreshToken },
      include: { admin: true }
    });

    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      throw new AppError('Invalid or expired refresh token', 401);
    }

    const admin = tokenRecord.admin;
    if (!admin.isActive) {
      throw new AppError('Account is disabled', 403);
    }

    // Delete old refresh token
    await prisma.adminRefreshToken.delete({
      where: { id: tokenRecord.id }
    });

    // Generate new tokens
    const sessionId = crypto.randomBytes(32).toString('hex');
    const accessToken = this.generateAccessToken(admin, sessionId);
    const newRefreshToken = await this.generateRefreshToken(admin.id);

    return { accessToken, refreshToken: newRefreshToken };
  }

  async setupMfa(adminId: string): Promise<MfaSetupResponse> {
    const admin = await prisma.adminUser.findUnique({
      where: { id: adminId }
    });

    if (!admin) {
      throw new AppError('Admin not found', 404);
    }

    if (admin.mfaEnabled) {
      throw new AppError('MFA is already enabled', 400);
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `StableRide Admin (${admin.email})`,
      issuer: 'StableRide'
    });

    // Generate backup codes
    const backupCodes = Array.from({ length: 8 }, () => 
      crypto.randomBytes(4).toString('hex').toUpperCase()
    );

    // Save secret and backup codes (encrypted in production)
    await prisma.adminUser.update({
      where: { id: adminId },
      data: {
        mfaSecret: secret.base32,
        mfaBackupCodes: backupCodes
      }
    });

    // Generate QR code
    const qrCode = await qrcode.toDataURL(secret.otpauth_url!);

    await this.logAuditEntry(adminId, 'MFA_SETUP_INITIATED', 'admin_auth', adminId);

    return {
      secret: secret.base32,
      qrCode,
      backupCodes
    };
  }

  async enableMfa(adminId: string, code: string): Promise<void> {
    const admin = await prisma.adminUser.findUnique({
      where: { id: adminId }
    });

    if (!admin || !admin.mfaSecret) {
      throw new AppError('MFA setup not initiated', 400);
    }

    const isValid = this.verifyMfaCode(admin.mfaSecret, code);
    if (!isValid) {
      throw new AppError('Invalid MFA code', 400);
    }

    await prisma.adminUser.update({
      where: { id: adminId },
      data: { mfaEnabled: true }
    });

    await this.logAuditEntry(adminId, 'MFA_ENABLED', 'admin_auth', adminId);
  }

  async disableMfa(adminId: string, password: string): Promise<void> {
    const admin = await prisma.adminUser.findUnique({
      where: { id: adminId }
    });

    if (!admin) {
      throw new AppError('Admin not found', 404);
    }

    const isValidPassword = await bcrypt.compare(password, admin.password);
    if (!isValidPassword) {
      throw new AppError('Invalid password', 401);
    }

    await prisma.adminUser.update({
      where: { id: adminId },
      data: {
        mfaEnabled: false,
        mfaSecret: null,
        mfaBackupCodes: null
      }
    });

    await this.logAuditEntry(adminId, 'MFA_DISABLED', 'admin_auth', adminId);
  }

  async changePassword(adminId: string, currentPassword: string, newPassword: string): Promise<void> {
    const admin = await prisma.adminUser.findUnique({
      where: { id: adminId }
    });

    if (!admin) {
      throw new AppError('Admin not found', 404);
    }

    const isValidPassword = await bcrypt.compare(currentPassword, admin.password);
    if (!isValidPassword) {
      throw new AppError('Invalid current password', 401);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.adminUser.update({
      where: { id: adminId },
      data: { password: hashedPassword }
    });

    await this.logAuditEntry(adminId, 'PASSWORD_CHANGED', 'admin_auth', adminId);
  }

  async hasPermission(adminId: string, resource: string, action: string): Promise<boolean> {
    const admin = await prisma.adminUser.findUnique({
      where: { id: adminId }
    });

    if (!admin || !admin.isActive) {
      return false;
    }

    const permissions = ADMIN_PERMISSIONS[admin.role];
    return permissions.some(p => 
      p.resource === resource && p.actions.includes(action)
    );
  }

  private generateAccessToken(admin: AdminUser, sessionId: string): string {
    const payload: AdminTokenPayload = {
      adminId: admin.id,
      email: admin.email,
      role: admin.role,
      sessionId
    };

    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: this.TOKEN_EXPIRY
    });
  }

  private async generateRefreshToken(adminId: string): Promise<string> {
    const token = crypto.randomBytes(64).toString('hex');
    const expiresAt = new Date(Date.now() + this.REFRESH_TOKEN_EXPIRY);

    await prisma.adminRefreshToken.create({
      data: {
        token,
        adminId,
        expiresAt
      }
    });

    return token;
  }

  private verifyMfaCode(secret: string, code: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token: code,
      window: 2
    });
  }

  private async handleFailedLogin(adminId: string): Promise<void> {
    const admin = await prisma.adminUser.findUnique({
      where: { id: adminId }
    });

    if (!admin) return;

    const loginAttempts = admin.loginAttempts + 1;
    const updateData: any = { loginAttempts };

    if (loginAttempts >= this.MAX_LOGIN_ATTEMPTS) {
      updateData.lockedUntil = new Date(Date.now() + this.LOCKOUT_DURATION);
      await this.logAuditEntry(adminId, 'ACCOUNT_LOCKED', 'admin_auth', adminId, { reason: 'max_login_attempts' });
    }

    await prisma.adminUser.update({
      where: { id: adminId },
      data: updateData
    });
  }

  async logAuditEntry(
    adminId: string, 
    action: string, 
    resource: string, 
    resourceId?: string, 
    details?: any,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await prisma.auditLog.create({
      data: {
        adminId,
        action,
        resource,
        resourceId,
        details,
        ipAddress,
        userAgent
      }
    });
  }
}

export const adminAuthService = new AdminAuthService();