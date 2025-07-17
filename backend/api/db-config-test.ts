import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const DATABASE_URL = process.env.DATABASE_URL || 'not set';
  const DIRECT_URL = process.env.DIRECT_URL || 'not set';
  
  // Parse DATABASE_URL to show connection details (hide password)
  let dbInfo = { host: 'unknown', port: 'unknown', params: {} as any };
  try {
    const url = new URL(DATABASE_URL);
    dbInfo = {
      host: url.hostname,
      port: url.port,
      params: Object.fromEntries(url.searchParams.entries())
    };
  } catch (e) {
    // Invalid URL
  }
  
  res.status(200).json({
    status: 'ok',
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
    },
    database: {
      hasDbUrl: !!process.env.DATABASE_URL,
      hasDirectUrl: !!process.env.DIRECT_URL,
      dbHost: dbInfo.host,
      dbPort: dbInfo.port,
      dbParams: dbInfo.params,
      isPooled: dbInfo.port === '6543' || dbInfo.params.pgbouncer === 'true'
    },
    timestamp: new Date().toISOString()
  });
}