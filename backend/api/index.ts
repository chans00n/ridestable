// Main entry point for Vercel serverless function
// Import and re-export the Express app handler

import handler from './app'

// Export default for Vercel
export default handler

// Also export as module.exports for compatibility
module.exports = handler