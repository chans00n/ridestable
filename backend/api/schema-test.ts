import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../src/config/database'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Check if tables exist
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `
    
    // Count users
    let userCount = 0
    try {
      userCount = await prisma.user.count()
    } catch (e) {
      // Table might not exist
    }
    
    res.status(200).json({
      status: 'ok',
      message: 'Schema check successful',
      tables,
      userCount,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    res.status(500).json({
      error: 'Schema check failed',
      message: error.message,
      code: error.code,
      timestamp: new Date().toISOString()
    })
  }
}