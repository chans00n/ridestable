import { Request, Response, NextFunction } from 'express';
import { adminDashboardService } from '../services/adminDashboard.service';
import { AdminAuthRequest } from '../types/admin';
import { AppError } from '../utils/errors';

export class AdminDashboardController {
  async getDashboardMetrics(req: AdminAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.admin) {
        throw new AppError('Unauthorized', 401);
      }

      const metrics = await adminDashboardService.getDashboardMetrics();

      res.json({
        status: 'success',
        data: metrics
      });
    } catch (error) {
      next(error);
    }
  }

  async getRevenueAnalytics(req: AdminAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.admin) {
        throw new AppError('Unauthorized', 401);
      }

      const analytics = await adminDashboardService.getRevenueAnalytics();

      res.json({
        status: 'success',
        data: analytics
      });
    } catch (error) {
      next(error);
    }
  }

  async getBookingAnalytics(req: AdminAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.admin) {
        throw new AppError('Unauthorized', 401);
      }

      const { days = '30' } = req.query;
      const analytics = await adminDashboardService.getBookingAnalytics(
        parseInt(days as string)
      );

      res.json({
        status: 'success',
        data: analytics
      });
    } catch (error) {
      next(error);
    }
  }

  async getCustomerAnalytics(req: AdminAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.admin) {
        throw new AppError('Unauthorized', 401);
      }

      const { days = '30' } = req.query;
      const analytics = await adminDashboardService.getCustomerAnalytics(
        parseInt(days as string)
      );

      res.json({
        status: 'success',
        data: analytics
      });
    } catch (error) {
      next(error);
    }
  }

  async refreshDashboardMetrics(req: AdminAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.admin) {
        throw new AppError('Unauthorized', 401);
      }

      await adminDashboardService.updateDashboardMetrics();

      res.json({
        status: 'success',
        message: 'Dashboard metrics updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async getBookingsForMap(req: AdminAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.admin) {
        throw new AppError('Unauthorized', 401);
      }

      const { days = '7' } = req.query;
      const bookings = await adminDashboardService.getBookingsForMap(
        parseInt(days as string)
      );

      res.json({
        status: 'success',
        data: bookings
      });
    } catch (error) {
      next(error);
    }
  }
}

export const adminDashboardController = new AdminDashboardController();