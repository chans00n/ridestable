import type { VercelRequest, VercelResponse } from '@vercel/node'
import app from '../src/app'

// For Vercel, we need to handle the serverless function explicitly
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Log incoming request for debugging
  console.log(`${req.method} ${req.url}`)
  
  // Pass the request to Express app
  return app(req, res)
}