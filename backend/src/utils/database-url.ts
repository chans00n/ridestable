export function addConnectionParams(url: string): string {
  // Parse the URL
  const urlObj = new URL(url)
  
  // Add connection parameters for Supabase
  urlObj.searchParams.set('connection_limit', '1')
  urlObj.searchParams.set('pool_timeout', '0')
  
  // Keep pgbouncer if it exists
  if (!urlObj.searchParams.has('pgbouncer')) {
    urlObj.searchParams.set('pgbouncer', 'true')
  }
  
  return urlObj.toString()
}