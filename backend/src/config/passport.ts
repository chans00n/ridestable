import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import { Strategy as AppleStrategy } from 'passport-apple'
import { prisma } from '../config/database'
import { config } from './index'
import { logger } from '../config/logger'

// Google OAuth Strategy - Only register if credentials are configured
if (config.oauth.google.clientId && 
    config.oauth.google.clientId !== '' &&
    config.oauth.google.clientSecret && 
    config.oauth.google.clientSecret !== '') {
  passport.use(
    new GoogleStrategy(
      {
        clientID: config.oauth.google.clientId,
        clientSecret: config.oauth.google.clientSecret,
        callbackURL: config.oauth.google.callbackUrl,
        scope: ['profile', 'email']
      },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value
        const firstName = profile.name?.givenName || ''
        const lastName = profile.name?.familyName || ''

        logger.info('Google OAuth callback:', {
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
          email,
          profileId: profile.id
        })

        if (!email) {
          return done(new Error('No email found in Google profile'), false)
        }

        // Check if OAuth provider already exists
        const existingProvider = await prisma.oAuthProvider.findUnique({
          where: {
            provider_providerId: {
              provider: 'google',
              providerId: profile.id
            }
          },
          include: { user: true }
        })

        if (existingProvider) {
          // Update tokens
          await prisma.oAuthProvider.update({
            where: { id: existingProvider.id },
            data: {
              accessToken,
              refreshToken: refreshToken || undefined
            }
          })
          return done(null, existingProvider.user)
        }

        // Check if user exists with this email
        let user = await prisma.user.findUnique({
          where: { email }
        })

        if (!user) {
          // Create new user with transaction to handle race conditions
          try {
            user = await prisma.user.create({
              data: {
                email,
                firstName,
                lastName,
                emailVerified: true, // OAuth users are considered verified
                providers: {
                  create: {
                    provider: 'google',
                    providerId: profile.id,
                    accessToken,
                    refreshToken: refreshToken || undefined
                  }
                }
              }
            })
          } catch (error: any) {
            // If user was created by another request (race condition), find it
            if (error.code === 'P2002') {
              user = await prisma.user.findUnique({
                where: { email }
              })
              if (!user) {
                throw new Error('Failed to create or find user')
              }
            } else {
              throw error
            }
          }
        } else {
          // Check if OAuth provider is already linked to this user
          const existingLink = await prisma.oAuthProvider.findFirst({
            where: {
              userId: user.id,
              provider: 'google'
            }
          })

          if (!existingLink) {
            // Link OAuth provider to existing user
            try {
              await prisma.oAuthProvider.create({
                data: {
                  userId: user.id,
                  provider: 'google',
                  providerId: profile.id,
                  accessToken,
                  refreshToken: refreshToken || undefined
                }
              })
            } catch (error: any) {
              // If provider was already linked (race condition), continue
              if (error.code !== 'P2002') {
                throw error
              }
            }
          } else {
            // Update tokens for existing link
            await prisma.oAuthProvider.update({
              where: { id: existingLink.id },
              data: {
                accessToken,
                refreshToken: refreshToken || existingLink.refreshToken // Keep existing refresh token if new one not provided
              }
            })
          }
        }

        return done(null, user)
      } catch (error) {
        logger.error('Google OAuth error:', error)
        return done(error as Error, false)
      }
    }
    )
  )
} else {
  logger.info('Google OAuth strategy not configured - missing credentials')
}

// Apple OAuth Strategy - Only register if credentials are configured
if (config.oauth.apple.clientId && 
    config.oauth.apple.clientId !== 'your-apple-client-id' &&
    config.oauth.apple.teamId && 
    config.oauth.apple.teamId !== 'your-apple-team-id') {
  passport.use(
    new AppleStrategy(
      {
        clientID: config.oauth.apple.clientId,
        teamID: config.oauth.apple.teamId,
        keyID: config.oauth.apple.keyId,
        privateKeyLocation: config.oauth.apple.privateKeyPath,
        callbackURL: config.oauth.apple.callbackUrl,
        passReqToCallback: false
      },
    async (accessToken: string, refreshToken: string, _idToken: any, profile: any, done: any) => {
      try {
        const email = profile.email
        const firstName = profile.name?.firstName || ''
        const lastName = profile.name?.lastName || ''

        if (!email) {
          return done(new Error('No email found in Apple profile'), false)
        }

        // Check if OAuth provider already exists
        const existingProvider = await prisma.oAuthProvider.findUnique({
          where: {
            provider_providerId: {
              provider: 'apple',
              providerId: profile.id
            }
          },
          include: { user: true }
        })

        if (existingProvider) {
          // Update tokens
          await prisma.oAuthProvider.update({
            where: { id: existingProvider.id },
            data: {
              accessToken,
              refreshToken: refreshToken || undefined
            }
          })
          return done(null, existingProvider.user)
        }

        // Check if user exists with this email
        let user = await prisma.user.findUnique({
          where: { email }
        })

        if (!user) {
          // Create new user
          user = await prisma.user.create({
            data: {
              email,
              firstName,
              lastName,
              emailVerified: true, // OAuth users are considered verified
              providers: {
                create: {
                  provider: 'apple',
                  providerId: profile.id,
                  accessToken,
                  refreshToken: refreshToken || undefined
                }
              }
            }
          })
        } else {
          // Check if OAuth provider is already linked to this user
          const existingLink = await prisma.oAuthProvider.findFirst({
            where: {
              userId: user.id,
              provider: 'apple'
            }
          })

          if (!existingLink) {
            // Link OAuth provider to existing user
            await prisma.oAuthProvider.create({
              data: {
                userId: user.id,
                provider: 'apple',
                providerId: profile.id,
                accessToken,
                refreshToken: refreshToken || undefined
              }
            })
          }
        }

        return done(null, user)
      } catch (error) {
        logger.error('Apple OAuth error:', error)
        return done(error as Error, false)
      }
    }
    )
  )
} else {
  logger.info('Apple OAuth strategy not configured - missing credentials')
}

// Serialize user for session
passport.serializeUser((user: any, done) => {
  done(null, user.id)
})

// Deserialize user from session
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id }
    })
    done(null, user)
  } catch (error) {
    done(error, null)
  }
})

export default passport