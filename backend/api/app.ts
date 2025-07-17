import type { VercelRequest, VercelResponse } from '@vercel/node'
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
logger.info('Express app starting in Vercel serverless environment')

// Trust proxy headers
app.set('trust proxy', 1)

// Security middleware
app.use(helmet())

// CORS configuration
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin) {
      return callback(null, true)
    }
    
    const allowedOrigins = config.cors.origin.split(',').map(o => o.trim())
    
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

// Body parsing - handle Stripe webhook separately
app.use('/payments/webhook', express.raw({ type: 'application/json' }))
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
  skip: () => config.env === 'development',
  validate: config.env === 'production' ? false : undefined,
})

app.use(limiter)

// Mount routes without /api prefix (Vercel handles that)
app.use('/', routes)

// Error handling
app.use(errorHandler)

// Export handler function for Vercel
export default function handler(req: VercelRequest, res: VercelResponse) {
  // Convert Vercel request/response to Express format
  app(req, res)
}

// Also export as module.exports for compatibility
module.exports = handler