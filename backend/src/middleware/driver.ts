import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { AuthRequest } from '../types/auth';

export const requireDriver = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;

    if (!user) {
      throw new AppError('Authentication required', 401);
    }

    if (!user.isDriver) {
      throw new AppError('Driver access required', 403);
    }

    if (user.driverStatus !== 'ACTIVE') {
      throw new AppError('Driver account is not active', 403);
    }

    next();
  } catch (error) {
    next(error);
  }
};