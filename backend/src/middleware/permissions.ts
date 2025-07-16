import { Request, Response, NextFunction } from 'express'
import { ApiError } from '../utils/errors'

// Define permission types for the admin system
export type Permission = 
  | 'dashboard:read'
  | 'bookings:read' | 'bookings:write' | 'bookings:delete'
  | 'customers:read' | 'customers:write' | 'customers:delete'
  | 'financial:read' | 'financial:write'
  | 'pricing:read' | 'pricing:write'
  | 'configuration:read' | 'configuration:write'
  | 'users:read' | 'users:write' | 'users:delete'
  | 'settings:read' | 'settings:write'
  | 'audit:read'
  | 'analytics:read'
  | 'reports:read' | 'reports:write'
  | 'content:read' | 'content:write'
  | 'system:admin'

// Role-based permissions mapping
const rolePermissions: Record<string, Permission[]> = {
  SUPER_ADMIN: [
    'dashboard:read',
    'bookings:read', 'bookings:write', 'bookings:delete',
    'customers:read', 'customers:write', 'customers:delete',
    'financial:read', 'financial:write',
    'pricing:read', 'pricing:write',
    'configuration:read', 'configuration:write',
    'users:read', 'users:write', 'users:delete',
    'settings:read', 'settings:write',
    'audit:read',
    'analytics:read',
    'reports:read', 'reports:write',
    'content:read', 'content:write',
    'system:admin'
  ],
  OPERATIONS_MANAGER: [
    'dashboard:read',
    'bookings:read', 'bookings:write', 'bookings:delete',
    'customers:read', 'customers:write',
    'financial:read',
    'pricing:read', 'pricing:write',
    'configuration:read', 'configuration:write',
    'analytics:read',
    'reports:read', 'reports:write',
    'audit:read'
  ],
  FINANCE_MANAGER: [
    'dashboard:read',
    'bookings:read',
    'customers:read',
    'financial:read', 'financial:write',
    'pricing:read', 'pricing:write',
    'configuration:read',
    'analytics:read',
    'reports:read', 'reports:write',
    'audit:read'
  ],
  CUSTOMER_SERVICE: [
    'dashboard:read',
    'bookings:read', 'bookings:write',
    'customers:read', 'customers:write',
    'analytics:read'
  ]
}

// Check if a role has a specific permission
export function hasPermission(role: string, permission: Permission): boolean {
  const permissions = rolePermissions[role] || []
  return permissions.includes(permission)
}

// Get all permissions for a role
export function getRolePermissions(role: string): Permission[] {
  return rolePermissions[role] || []
}

// Middleware to check permissions
export function requirePermission(permission: Permission) {
  return (req: Request, res: Response, next: NextFunction) => {
    const admin = (req as any).admin
    
    if (!admin) {
      throw new ApiError(401, 'Authentication required')
    }

    if (!hasPermission(admin.role, permission)) {
      throw new ApiError(403, `Insufficient permissions. Required: ${permission}`)
    }

    next()
  }
}

// Middleware to check multiple permissions (user needs ALL of them)
export function requireAllPermissions(permissions: Permission[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const admin = (req as any).admin
    
    if (!admin) {
      throw new ApiError(401, 'Authentication required')
    }

    const missingPermissions = permissions.filter(permission => 
      !hasPermission(admin.role, permission)
    )

    if (missingPermissions.length > 0) {
      throw new ApiError(403, `Insufficient permissions. Missing: ${missingPermissions.join(', ')}`)
    }

    next()
  }
}

// Middleware to check multiple permissions (user needs ANY of them)
export function requireAnyPermission(permissions: Permission[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const admin = (req as any).admin
    
    if (!admin) {
      throw new ApiError(401, 'Authentication required')
    }

    const hasAnyPermission = permissions.some(permission => 
      hasPermission(admin.role, permission)
    )

    if (!hasAnyPermission) {
      throw new ApiError(403, `Insufficient permissions. Required one of: ${permissions.join(', ')}`)
    }

    next()
  }
}

// Check if admin is super admin
export function requireSuperAdmin() {
  return (req: Request, res: Response, next: NextFunction) => {
    const admin = (req as any).admin
    
    if (!admin) {
      throw new ApiError(401, 'Authentication required')
    }

    if (admin.role !== 'SUPER_ADMIN') {
      throw new ApiError(403, 'Super Admin access required')
    }

    next()
  }
}