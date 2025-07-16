import { Request, Response, NextFunction } from 'express'
import { AuthService } from '../services/auth.service'
import { AuthRequest } from '../middleware/auth'
import type { RegisterDto, LoginDto, RefreshTokenDto } from '@stable-ride/shared'

interface LoginRequestBody extends LoginDto {
  rememberMe?: boolean
}

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const data = req.body as RegisterDto
      const result = await AuthService.register(data)
      res.status(201).json(result)
    } catch (error) {
      next(error)
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, rememberMe } = req.body as LoginRequestBody
      console.log('Login attempt for:', email);
      const result = await AuthService.login({ email, password }, rememberMe || false)
      res.json(result)
    } catch (error) {
      console.error('Login error in controller:', error);
      next(error)
    }
  }

  static async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.query
      if (!token || typeof token !== 'string') {
        return res.status(400).json({ error: 'Verification token is required' })
      }
      await AuthService.verifyEmail(token)
      res.json({ message: 'Email verified successfully' })
    } catch (error) {
      next(error)
    }
  }

  static async resendVerificationEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body
      if (!email) {
        return res.status(400).json({ error: 'Email is required' })
      }
      await AuthService.resendVerificationEmail(email)
      res.json({ message: 'Verification email sent' })
    } catch (error) {
      next(error)
    }
  }

  static async requestPasswordReset(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body
      if (!email) {
        return res.status(400).json({ error: 'Email is required' })
      }
      await AuthService.requestPasswordReset(email)
      res.json({ message: 'Password reset email sent if account exists' })
    } catch (error) {
      next(error)
    }
  }

  static async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, password } = req.body
      if (!token || !password) {
        return res.status(400).json({ error: 'Token and password are required' })
      }
      await AuthService.resetPassword(token, password)
      res.json({ message: 'Password reset successfully' })
    } catch (error) {
      next(error)
    }
  }

  static async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const data = req.body as RefreshTokenDto
      const result = await AuthService.refreshToken(data)
      res.json(result)
    } catch (error) {
      next(error)
    }
  }

  static async logout(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.body.refreshToken
      await AuthService.logout(req.user!.id, refreshToken)
      res.status(204).send()
    } catch (error) {
      next(error)
    }
  }

  static async me(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      res.json({ user: req.user })
    } catch (error) {
      next(error)
    }
  }

  static async updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { firstName, lastName, phone } = req.body
      const updatedUser = await AuthService.updateProfile(req.user!.id, {
        firstName,
        lastName,
        phone
      })
      res.json({ user: updatedUser })
    } catch (error) {
      next(error)
    }
  }
}