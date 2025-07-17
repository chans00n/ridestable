import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../src/config/database'
import { RegisterSchema } from '../src/shared-types'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Validate input
    const data = RegisterSchema.parse(req.body)
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    })

    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' })
    }

    // Create user (without hashing for this test)
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: 'hashed_' + data.password, // Just for testing
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      }
    })

    res.status(200).json({
      message: 'Test registration successful',
      user,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Registration test error:', error)
    
    res.status(500).json({
      error: 'Registration failed',
      message: error.message,
      code: error.code,
      meta: error.meta,
      timestamp: new Date().toISOString()
    })
  }
}