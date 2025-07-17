const express = require('express')
const app = express()

// Enable JSON parsing
app.use(express.json())

// Test route at root
app.get('/', (req, res) => {
  res.json({
    message: 'Express root route working',
    path: req.path,
    url: req.url,
    originalUrl: req.originalUrl,
    baseUrl: req.baseUrl,
    timestamp: new Date().toISOString()
  })
})

// Health check route
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Express health route working',
    env: process.env.NODE_ENV,
    vercel: process.env.VERCEL,
    timestamp: new Date().toISOString()
  })
})

// Auth routes
app.post('/auth/login', (req, res) => {
  res.json({
    message: 'Login endpoint reached',
    body: req.body,
    timestamp: new Date().toISOString()
  })
})

// Catch all route for debugging
app.all('*', (req, res) => {
  res.json({
    message: 'Catch-all route',
    method: req.method,
    path: req.path,
    url: req.url,
    originalUrl: req.originalUrl,
    baseUrl: req.baseUrl,
    headers: req.headers,
    timestamp: new Date().toISOString()
  })
})

// Export for Vercel
module.exports = app