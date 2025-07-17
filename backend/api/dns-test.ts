import type { VercelRequest, VercelResponse } from '@vercel/node'
import dns from 'dns/promises'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const hosts = [
    'db.pmroplrdqzkdrpacdpga.supabase.co',
    'pmroplrdqzkdrpacdpga.supabase.co',
    'aws-0-us-west-1.pooler.supabase.com'
  ]
  
  const results: any = {}
  
  for (const host of hosts) {
    try {
      const addresses = await dns.resolve4(host)
      results[host] = {
        success: true,
        addresses
      }
    } catch (error: any) {
      results[host] = {
        success: false,
        error: error.message
      }
    }
  }
  
  res.status(200).json({
    message: 'DNS resolution test',
    results,
    timestamp: new Date().toISOString()
  })
}