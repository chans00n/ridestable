import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../src/config/database'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const dbUrl = process.env.DATABASE_URL || 'not set'
  const directUrl = process.env.DIRECT_URL || 'not set'
  
  // Mask password in URLs for security
  const maskPassword = (url: string) => {
    try {
      const u = new URL(url)
      if (u.password) {
        u.password = '***'
      }
      return u.toString()
    } catch {
      return 'invalid URL'
    }
  }
  
  try {
    // Try to connect
    await prisma.$connect()
    
    // Test basic query
    const result = await prisma.$queryRaw`SELECT 1 as test, current_database() as db`
    
    res.status(200).json({
      status: 'ok',
      message: 'Database connected successfully',
      result,
      connection: {
        DATABASE_URL: maskPassword(dbUrl),
        DIRECT_URL: maskPassword(directUrl),
        isPooling: dbUrl.includes('pgbouncer=true') || dbUrl.includes(':6543')
      },
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
      error: error.message,
      code: error.code,
      errorName: error.constructor.name,
      connection: {
        DATABASE_URL: maskPassword(dbUrl),
        DIRECT_URL: maskPassword(directUrl),
        isPooling: dbUrl.includes('pgbouncer=true') || dbUrl.includes(':6543')
      },
      timestamp: new Date().toISOString()
    })
  } finally {
    await prisma.$disconnect()
  }
}