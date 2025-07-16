import { Router } from 'express'
import { AuthController } from '../controllers/auth.controller'
import { validate } from '../middleware/validate'
import { authenticate } from '../middleware/auth'
import { RegisterSchema, LoginSchema, RefreshTokenSchema, ResetPasswordRequestSchema, ResetPasswordSchema } from '@stable-ride/shared'
import rateLimit from 'express-rate-limit'

const router = Router()

// Rate limiters
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 50 : 5, // More attempts in dev
  message: 'Too many attempts, please try again later',
})

const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 requests per hour
  message: 'Too many password reset requests, please try again later',
})

// Auth routes
router.post('/register', authLimiter, validate(RegisterSchema), AuthController.register)
router.post('/login', authLimiter, AuthController.login)
router.post('/refresh', validate(RefreshTokenSchema), AuthController.refreshToken)
router.post('/logout', authenticate, AuthController.logout)
router.get('/me', authenticate, AuthController.me)
router.patch('/profile', authenticate, AuthController.updateProfile)

// Email verification routes
router.get('/verify-email', AuthController.verifyEmail)
router.post('/resend-verification', authLimiter, AuthController.resendVerificationEmail)

// Password reset routes
router.post('/request-password-reset', passwordResetLimiter, validate(ResetPasswordRequestSchema), AuthController.requestPasswordReset)
router.post('/reset-password', authLimiter, validate(ResetPasswordSchema), AuthController.resetPassword)

export default router