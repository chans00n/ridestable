import express from 'express'
import type { VercelRequest, VercelResponse } from '@vercel/node'

const app = express()

app.get('/api/express-test', (req, res) => {
  res.json({
    message: 'Express is working',
    timestamp: new Date().toISOString()
  })
})

app.get('/api/express-test/health', (req, res) => {
  res.json({ status: 'ok' })
})

export default app