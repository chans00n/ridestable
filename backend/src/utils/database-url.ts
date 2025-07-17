export function addConnectionParams(url: string): string {
  // Parse the URL
  const urlObj = new URL(url)
  
  // Add connection parameters for Supabase in serverless
  // For pooled connections (pgbouncer), don't set connection_limit
  // as the pooler handles this
  const isPgBouncer = urlObj.searchParams.has('pgbouncer') || urlObj.port === '6543'
  
  if (!isPgBouncer && !urlObj.searchParams.has('connection_limit')) {
    urlObj.searchParams.set('connection_limit', '1')
  }
  
  // Add connect timeout for serverless
  if (!urlObj.searchParams.has('connect_timeout')) {
    urlObj.searchParams.set('connect_timeout', '10')
  }
  
  return urlObj.toString()
}