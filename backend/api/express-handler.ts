import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
import passport from '../src/config/passport'
import { config } from '../src/config'
import { errorHandler } from '../src/middleware/error'
import routes from '../src/routes'
import { logger } from '../src/config/logger'

// Create Express app
const app = express()

// Log startup in Vercel
logger.info('Express handler starting in Vercel serverless environment')

// Trust proxy headers when deployed to Vercel
app.set('trust proxy', 1)

// Security middleware
app.use(helmet())

// CORS configuration supporting multiple origins
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true)
    }
    
    // Parse allowed origins from environment variable
    const allowedOrigins = config.cors.origin.split(',').map(o => o.trim())
    
    // Check if the origin is allowed
    if (allowedOrigins.includes(origin) || 
        allowedOrigins.includes('*') ||
        (config.env === 'development' && origin.includes('localhost'))) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
}

app.use(cors(corsOptions))

// Raw body parsing for Stripe webhooks - must come before express.json()
app.use('/payments/webhook', express.raw({ type: 'application/json' }))

// JSON parsing for all other routes
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(morgan('combined'))

// Initialize passport
app.use(passport.initialize())

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting in development
  skip: () => config.env === 'development',
  // Disable validation warnings in production
  validate: config.env === 'production' ? false : undefined,
})

// Apply rate limiting
app.use(limiter)

// Mount all routes
// When deployed to Vercel, the app is already mounted at /api
// so we don't need the /api prefix
app.use('/', routes)

// Error handler
app.use(errorHandler)

// Export for Vercel - MUST use module.exports
module.exports = app