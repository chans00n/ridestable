import { Request } from 'express';
import { AdminRole } from '@prisma/client';

export interface AdminAuthRequest extends Request {
  admin?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: AdminRole;
    permissions: Permission[];
  };
}

export interface Permission {
  resource: string;
  actions: string[];
}

export interface AdminLoginDto {
  email: string;
  password: string;
  mfaCode?: string;
}

export interface AdminLoginResponse {
  requiresMfa?: boolean;
  accessToken?: string;
  refreshToken?: string;
  admin?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: AdminRole;
    permissions: Permission[];
  };
}

export interface AdminTokenPayload {
  adminId: string;
  email: string;
  role: AdminRole;
  sessionId: string;
}

export interface MfaSetupResponse {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export interface AuditLogEntry {
  action: string;
  resource: string;
  resourceId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
}

export const ADMIN_PERMISSIONS: Record<AdminRole, Permission[]> = {
  SUPER_ADMIN: [
    { resource: 'bookings', actions: ['read', 'write', 'delete', 'export'] },
    { resource: 'customers', actions: ['read', 'write', 'delete', 'export'] },
    { resource: 'payments', actions: ['read', 'write', 'refund', 'export'] },
    { resource: 'financial', actions: ['read', 'write', 'export'] },
    { resource: 'pricing', actions: ['read', 'write'] },
    { resource: 'settings', actions: ['read', 'write'] },
    { resource: 'admin_users', actions: ['read', 'write', 'delete'] },
    { resource: 'analytics', actions: ['read', 'export'] },
    { resource: 'audit_logs', actions: ['read', 'export'] },
  ],
  OPERATIONS_MANAGER: [
    { resource: 'bookings', actions: ['read', 'write', 'export'] },
    { resource: 'customers', actions: ['read', 'write', 'export'] },
    { resource: 'payments', actions: ['read'] },
    { resource: 'financial', actions: ['read'] },
    { resource: 'pricing', actions: ['read', 'write'] },
    { resource: 'analytics', actions: ['read', 'export'] },
  ],
  FINANCE_MANAGER: [
    { resource: 'bookings', actions: ['read'] },
    { resource: 'customers', actions: ['read'] },
    { resource: 'payments', actions: ['read', 'refund', 'export'] },
    { resource: 'financial', actions: ['read', 'write', 'export'] },
    { resource: 'pricing', actions: ['read', 'write'] },
    { resource: 'analytics', actions: ['read', 'export'] },
    { resource: 'settings', actions: ['read'] },
  ],
  CUSTOMER_SERVICE: [
    { resource: 'bookings', actions: ['read', 'write'] },
    { resource: 'customers', actions: ['read', 'write'] },
    { resource: 'payments', actions: ['read'] },
  ],
};