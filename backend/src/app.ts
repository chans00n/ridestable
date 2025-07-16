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

const app = express()

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
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }))

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
})

app.use('/api', limiter)
app.use('/api', routes)

app.use(errorHandler)

export default app