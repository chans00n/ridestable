import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../src/config/database'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Test basic connection
    const result = await prisma.$queryRaw`SELECT 1 as test`
    
    res.status(200).json({
      status: 'ok',
      message: 'Database connected',
      result,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
      error: error.message,
      code: error.code,
      timestamp: new Date().toISOString()
    })
  }
}