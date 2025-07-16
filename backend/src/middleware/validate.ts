import { Request, Response, NextFunction } from 'express'
import { ZodSchema, z } from 'zod'

export const validate =
  (schema: ZodSchema) => (req: Request, _res: Response, next: NextFunction) => {
    try {
      // If schema has body, query, or params, parse them separately
      if ('shape' in schema && schema.shape) {
        const shape = schema.shape as any;
        
        if (shape.body) {
          shape.body.parse(req.body);
        }
        if (shape.query) {
          shape.query.parse(req.query);
        }
        if (shape.params) {
          shape.params.parse(req.params);
        }
      } else {
        // Default to parsing body only
        schema.parse(req.body);
      }
      
      next()
    } catch (error) {
      next(error)
    }
  }