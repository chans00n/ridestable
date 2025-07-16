import { prisma } from '../config/database'
import { redisClient } from '../config/redis'
import { hashPassword, comparePassword } from '../utils/password'
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt'
import { generateSecureToken, generateTokenExpiry } from '../utils/token'
import { AppError } from '../middleware/error'
import { EmailService } from './email.service'
import { logger } from '../config/logger'
import type {
  RegisterDto,
  LoginDto,
  AuthResponse,
  UserDto,
  RefreshTokenDto,
} from '@stable-ride/shared'

const MAX_LOGIN_ATTEMPTS = 5
const LOCKOUT_DURATION = 30 * 60 * 1000 // 30 minutes

export class AuthService {
  private static toUserDto(user: any): UserDto {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    }
  }

  static async register(data: RegisterDto): Promise<AuthResponse> {
    let user: any
    let verificationToken: string
    
    try {
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
      })

      if (existingUser) {
        throw new AppError(409, 'Email already registered')
      }

      const hashedPassword = await hashPassword(data.password)
      verificationToken = generateSecureToken()
      const verificationExpires = generateTokenExpiry(24)

      user = await prisma.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          emailVerificationToken: verificationToken,
          emailVerificationExpires: verificationExpires,
        },
      })
    } catch (error: any) {
      logger.error('Registration error:', error)
      if (error.code === 'P1010') {
        throw new AppError(500, 'Database connection error. Please try again.')
      }
      throw error
    }

    // Send verification email (non-blocking for development)
    EmailService.sendVerificationEmail(user.email, verificationToken).catch((error) => {
      logger.error('Failed to send verification email:', error)
      // In development, we'll log the verification link
      if (process.env.NODE_ENV === 'development') {
        logger.info(`Verification link: ${process.env.APP_URL}/auth/verify-email?token=${verificationToken}`)
      }
    })

    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      isDriver: user.isDriver,
      driverStatus: user.driverStatus || undefined,
    })

    const refreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
      isDriver: user.isDriver,
      driverStatus: user.driverStatus || undefined,
    })

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
      },
    })

    await redisClient.setEx(`session:${user.id}`, 3600, JSON.stringify({ userId: user.id }))

    return {
      user: this.toUserDto(user),
      accessToken,
      refreshToken,
    }
  }

  static async login(data: LoginDto, rememberMe: boolean = false): Promise<AuthResponse> {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    })

    if (!user) {
      throw new AppError(401, 'Invalid credentials')
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000)
      throw new AppError(429, `Account locked. Try again in ${minutesLeft} minutes`)
    }

    // Check if user has a password (OAuth users might not)
    if (!user.password) {
      throw new AppError(401, 'Please use your social login provider')
    }

    const isPasswordValid = await comparePassword(data.password, user.password)

    if (!isPasswordValid) {
      // Increment login attempts
      const attempts = user.loginAttempts + 1
      const updateData: any = { loginAttempts: attempts }

      if (attempts >= MAX_LOGIN_ATTEMPTS) {
        updateData.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION)
        updateData.loginAttempts = 0
      }

      await prisma.user.update({
        where: { id: user.id },
        data: updateData,
      })

      if (attempts >= MAX_LOGIN_ATTEMPTS) {
        throw new AppError(429, 'Too many failed attempts. Account locked for 30 minutes')
      }

      throw new AppError(401, 'Invalid credentials')
    }

    // Reset login attempts and update last login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        loginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    })

    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      isDriver: user.isDriver,
      driverStatus: user.driverStatus || undefined,
    })

    const refreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
      isDriver: user.isDriver,
      driverStatus: user.driverStatus || undefined,
    })

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + (rememberMe ? 30 : 7))

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
      },
    })

    const sessionDuration = rememberMe ? 86400 : 3600 // 24 hours if remember me, else 1 hour
    await redisClient.setEx(`session:${user.id}`, sessionDuration, JSON.stringify({ userId: user.id }))

    logger.info(`User ${user.email} logged in successfully`)

    return {
      user: this.toUserDto(user),
      accessToken,
      refreshToken,
    }
  }

  static async verifyEmail(token: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { emailVerificationToken: token },
    })

    if (!user) {
      throw new AppError(400, 'Invalid verification token')
    }

    if (user.emailVerificationExpires && user.emailVerificationExpires < new Date()) {
      throw new AppError(400, 'Verification token has expired')
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
      },
    })

    // Send welcome email
    await EmailService.sendWelcomeEmail(user.email, user.firstName)

    logger.info(`Email verified for user ${user.email}`)
  }

  static async resendVerificationEmail(email: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      throw new AppError(404, 'User not found')
    }

    if (user.emailVerified) {
      throw new AppError(400, 'Email already verified')
    }

    const verificationToken = generateSecureToken()
    const verificationExpires = generateTokenExpiry(24)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires,
      },
    })

    await EmailService.sendVerificationEmail(user.email, verificationToken)

    logger.info(`Verification email resent to ${user.email}`)
  }

  static async requestPasswordReset(email: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      // Don't reveal if user exists
      return
    }

    // Check rate limiting for password resets
    const resetKey = `password-reset:${user.id}`
    const resetCount = await redisClient.get(resetKey)
    
    if (resetCount && parseInt(resetCount) >= 3) {
      throw new AppError(429, 'Too many password reset requests. Try again later')
    }

    const resetToken = generateSecureToken()
    const resetExpires = generateTokenExpiry(24)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires,
      },
    })

    // Increment rate limit counter
    const ttl = 3600 // 1 hour
    if (resetCount) {
      await redisClient.setEx(resetKey, ttl, (parseInt(resetCount) + 1).toString())
    } else {
      await redisClient.setEx(resetKey, ttl, '1')
    }

    await EmailService.sendPasswordResetEmail(user.email, resetToken)

    logger.info(`Password reset requested for ${user.email}`)
  }

  static async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { passwordResetToken: token },
    })

    if (!user) {
      throw new AppError(400, 'Invalid reset token')
    }

    if (user.passwordResetExpires && user.passwordResetExpires < new Date()) {
      throw new AppError(400, 'Reset token has expired')
    }

    const hashedPassword = await hashPassword(newPassword)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
        loginAttempts: 0,
        lockedUntil: null,
      },
    })

    // Invalidate all refresh tokens
    await prisma.refreshToken.deleteMany({
      where: { userId: user.id },
    })

    // Clear session
    await redisClient.del(`session:${user.id}`)

    logger.info(`Password reset for user ${user.email}`)
  }

  static async refreshToken(data: RefreshTokenDto): Promise<AuthResponse> {
    const payload = verifyRefreshToken(data.refreshToken)

    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: data.refreshToken },
      include: { user: true },
    })

    if (!storedToken || storedToken.expiresAt < new Date()) {
      throw new AppError(401, 'Invalid or expired refresh token')
    }

    await prisma.refreshToken.delete({
      where: { id: storedToken.id },
    })

    const accessToken = generateAccessToken({
      userId: storedToken.user.id,
      email: storedToken.user.email,
    })

    const refreshToken = generateRefreshToken({
      userId: storedToken.user.id,
      email: storedToken.user.email,
    })

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: storedToken.user.id,
        expiresAt,
      },
    })

    return {
      user: this.toUserDto(storedToken.user),
      accessToken,
      refreshToken,
    }
  }

  static async logout(userId: string, refreshToken?: string): Promise<void> {
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({
        where: {
          OR: [{ token: refreshToken }, { userId }],
        },
      })
    } else {
      await prisma.refreshToken.deleteMany({
        where: { userId },
      })
    }

    await redisClient.del(`session:${userId}`)

    logger.info(`User ${userId} logged out`)
  }

  static async updateProfile(userId: string, data: { firstName?: string; lastName?: string; phone?: string }): Promise<UserDto> {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        updatedAt: new Date()
      }
    })

    return this.toUserDto(updatedUser)
  }
}