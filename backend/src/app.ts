import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
import passport from './config/passport'
import { config } from './config'
import { errorHandler } from './middleware/error'
import routes from './routes'
import { logger } from './config/logger'

const app = express()

// Log startup in Vercel
if (process.env.VERCEL) {
  logger.info('App starting in Vercel serverless environment')
}

// Trust proxy headers when deployed to Vercel
// Use specific number of proxies for security
if (process.env.VERCEL) {
  app.set('trust proxy', 1)
}

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
const webhookPath = process.env.VERCEL ? '/payments/webhook' : '/api/payments/webhook'
app.use(webhookPath, express.raw({ type: 'application/json' }))

// JSON parsing for all other routes
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(morgan('combined'))

// Initialize passport
app.use(passport.initialize())

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

// When deployed to Vercel, the app is already mounted at /api
const routePrefix = process.env.VERCEL ? '' : '/api'
app.use(routePrefix, limiter)
app.use(routePrefix, routes)

app.use(errorHandler)

export default app