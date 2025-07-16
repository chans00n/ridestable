import { Request } from 'express';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role?: string;
    isDriver?: boolean;
    driverStatus?: string;
  };
}