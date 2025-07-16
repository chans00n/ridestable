import { Request, Response, NextFunction } from 'express'
import { verifyAccessToken } from '../utils/jwt'
import { AppError } from './error'
import { prisma } from '../config/database'

export interface AuthRequest extends Request {
  user?: {
    id: string
    email: string
    emailVerified: boolean
    firstName: string
    lastName: string
    phone?: string | null
    isDriver?: boolean
    driverStatus?: string | null
    createdAt: Date
    updatedAt: Date
  }
}

export const authenticate = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(401, 'Missing or invalid authorization header')
    }

    const token = authHeader.substring(7)
    const payload = verifyAccessToken(token)

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { 
        id: true, 
        email: true,
        emailVerified: true,
        firstName: true,
        lastName: true,
        phone: true,
        isDriver: true,
        driverStatus: true,
        createdAt: true,
        updatedAt: true
      },
    })

    if (!user) {
      throw new AppError(401, 'User not found')
    }

    req.user = user
    next()
  } catch (error) {
    if (error instanceof AppError) {
      next(error)
    } else {
      next(new AppError(401, 'Invalid or expired token'))
    }
  }
}

export const optionalAuth = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without user
      return next()
    }

    const token = authHeader.substring(7)
    const payload = verifyAccessToken(token)

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { 
        id: true, 
        email: true,
        emailVerified: true,
        firstName: true,
        lastName: true,
        phone: true,
        isDriver: true,
        driverStatus: true,
        createdAt: true,
        updatedAt: true
      },
    })

    if (user) {
      req.user = user
    }
    
    next()
  } catch (error) {
    // Token is invalid, continue without user
    next()
  }
}

export const authorize = (roles: string[]) => {
  return async (req: AuthRequest, _res: Response, next: NextFunction) => {
    try {
      // For now, we'll just check if user exists
      // In a real implementation, you'd check user roles
      if (!req.user) {
        throw new AppError(401, 'Authentication required')
      }

      // TODO: Implement role-based authorization
      // For MVP, we'll allow all authenticated users to access admin routes
      next()
    } catch (error) {
      next(error)
    }
  }
}

// Alias for consistency with driver routes
export const requireAuth = authenticate