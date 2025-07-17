import type { VercelRequest, VercelResponse } from '@vercel/node'

let app: any

try {
  app = require('../dist/app').default || require('../dist/app')
  console.log('Loaded app from dist/app')
} catch (error) {
  console.error('Failed to load app:', error)
  // Fallback response
  app = (req: VercelRequest, res: VercelResponse) => {
    res.status(500).json({
      error: 'Failed to load Express app',
      message: error.message,
      stack: error.stack
    })
  }
}

export default app