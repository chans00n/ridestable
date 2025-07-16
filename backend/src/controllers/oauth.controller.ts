import { Request, Response, NextFunction } from 'express'
import passport from 'passport'
import jwt from 'jsonwebtoken'
import { nanoid } from 'nanoid'
import { config } from '../config'
import { logger } from '../config/logger'
import { prisma } from '../config/database'
import type { User } from '@prisma/client'

// Generate auth URL for OAuth provider
export const getAuthUrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { provider } = req.params

    if (provider !== 'google') {
      return res.status(400).json({ error: 'Invalid OAuth provider' })
    }

    // For Google, we can construct the URL manually
    if (provider === 'google') {
      const params = new URLSearchParams({
        client_id: config.oauth.google.clientId,
        redirect_uri: config.oauth.google.callbackUrl,
        response_type: 'code',
        scope: 'profile email',
        access_type: 'offline',
        prompt: 'consent'
      })
      
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
      return res.json({ authUrl })
    }

  } catch (error) {
    logger.error('OAuth URL generation error:', error)
    next(error)
  }
}

// Handle OAuth callback
export const handleCallback = async (req: Request, res: Response, next: NextFunction) => {
  const { provider } = req.params
  
  // Extract code from query params (GET) or body (POST)
  const code = req.query.code || req.body.code
  const state = req.query.state || req.body.state
  
  // If it's a GET request with code, redirect to frontend callback page
  if (req.method === 'GET' && code) {
    const frontendCallbackUrl = `${config.app.url}/auth/callback/${provider}?code=${code}&state=${state || ''}`
    return res.redirect(frontendCallbackUrl)
  }

  // Use passport authentication
  passport.authenticate(provider, { session: false }, async (err: Error | null, user: User | false) => {
    try {
      if (err || !user) {
        logger.error(`OAuth ${provider} callback error:`, err)
        // Check if it's just a warning about missing refresh token
        if (user && err?.message?.includes('refresh token')) {
          logger.warn('OAuth succeeded but no refresh token received')
          // Continue with authentication
        } else {
          return res.status(401).json({ 
            error: err?.message || 'Authentication failed' 
          })
        }
      }

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      })

      // Generate tokens
      const accessToken = jwt.sign(
        { userId: user.id, email: user.email },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      )

      const refreshToken = jwt.sign(
        { userId: user.id, tokenId: nanoid() },
        config.jwt.refreshSecret,
        { expiresIn: config.jwt.refreshExpiresIn }
      )

      // Store refresh token
      await prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        }
      })

      // Return user data and tokens
      res.json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          emailVerified: user.emailVerified
        },
        accessToken,
        refreshToken
      })
    } catch (error) {
      logger.error('OAuth callback processing error:', error)
      next(error)
    }
  })(req, res, next)
}

// Link OAuth provider to existing account
export const linkProvider = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { provider } = req.params
    const userId = (req as any).user.userId

    if (provider !== 'google') {
      return res.status(400).json({ error: 'Invalid OAuth provider' })
    }

    // Check if provider is already linked
    const existingProvider = await prisma.oAuthProvider.findFirst({
      where: {
        userId,
        provider
      }
    })

    if (existingProvider) {
      return res.status(400).json({ error: 'Provider already linked to your account' })
    }

    // Initiate OAuth flow for linking
    // This would typically redirect to the OAuth provider
    // For now, we'll return the auth URL
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${config.oauth.google.clientId}&redirect_uri=${config.oauth.google.callbackUrl}&response_type=code&scope=profile email&state=link_${userId}`

    res.json({ authUrl })
  } catch (error) {
    next(error)
  }
}

// Unlink OAuth provider from account
export const unlinkProvider = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { provider } = req.params
    const userId = (req as any).user.userId

    // Check if user has a password set
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { providers: true }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Don't allow unlinking if it's the only auth method and no password is set
    if (!user.password && user.providers.length === 1) {
      return res.status(400).json({ 
        error: 'Cannot unlink the only authentication method. Please set a password first.' 
      })
    }

    // Unlink the provider
    await prisma.oAuthProvider.deleteMany({
      where: {
        userId,
        provider
      }
    })

    res.json({ message: 'Provider unlinked successfully' })
  } catch (error) {
    next(error)
  }
}