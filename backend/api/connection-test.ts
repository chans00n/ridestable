import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Client } from 'pg'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const dbUrl = process.env.DATABASE_URL || ''
  
  // Parse connection string
  let connectionInfo: any = {}
  try {
    const url = new URL(dbUrl)
    connectionInfo = {
      host: url.hostname,
      port: url.port,
      database: url.pathname.slice(1),
      user: url.username,
      hasPassword: !!url.password,
      protocol: url.protocol,
      searchParams: Object.fromEntries(url.searchParams),
    }
  } catch (e) {
    connectionInfo = { error: 'Failed to parse DATABASE_URL' }
  }
  
  // Try direct PostgreSQL connection
  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  })
  
  try {
    await client.connect()
    const result = await client.query('SELECT NOW(), current_database()')
    await client.end()
    
    res.status(200).json({
      status: 'ok',
      message: 'Direct PostgreSQL connection successful',
      result: result.rows[0],
      connectionInfo,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: 'Direct PostgreSQL connection failed',
      error: error.message,
      code: error.code,
      connectionInfo,
      timestamp: new Date().toISOString()
    })
  }
}