import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { logger } from '../config/logger'
import { ApiError } from '../utils/errors'

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message)
    Object.setPrototypeOf(this, AppError.prototype)
  }
}

export const errorHandler = (
  err: Error | AppError | ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation Error',
      details: err.errors,
    })
  }

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      error: err.message,
      details: err.errors,
    })
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
    })
  }

  logger.error('Unhandled error:', err)

  return res.status(500).json({
    error: 'Internal Server Error',
  })
}