import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { DashboardService } from '../services/dashboard.service';
import { NotificationService } from '../services/notification.service';
import { ApiError } from '../utils/errors';
import { AuthRequest } from '../types/auth';

const dashboardService = new DashboardService();
const notificationService = new NotificationService();

// Schemas
const savedLocationSchema = z.object({
  name: z.string().min(1).max(100),
  address: z.string().min(1),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  locationType: z.enum(['home', 'work', 'other']).optional(),
  isDefault: z.boolean().optional()
});

const notificationPreferencesSchema = z.object({
  emailEnabled: z.boolean().optional(),
  smsEnabled: z.boolean().optional(),
  pushEnabled: z.boolean().optional(),
  marketingEmails: z.boolean().optional(),
  reminderFrequency: z.enum(['none', 'normal', 'extra']).optional(),
  quietHoursStart: z.string().optional(),
  quietHoursEnd: z.string().optional(),
  language: z.string().optional()
});

export const dashboardController = {
  async getDashboard(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // Parse pagination params
      const upcomingPage = parseInt(req.query.upcomingPage as string) || 1;
      const historyPage = parseInt(req.query.historyPage as string) || 1;
      const locationsPage = parseInt(req.query.locationsPage as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const dashboardData = await dashboardService.getUserDashboard(req.user!.id, {
        upcomingPage,
        historyPage,
        locationsPage,
        limit
      });
      
      res.json({
        status: 'success',
        data: dashboardData
      });
    } catch (error) {
      next(error);
    }
  },

  async getUpcomingBookings(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const dashboard = await dashboardService.getUserDashboard(req.user!.id);
      
      res.json({
        status: 'success',
        data: dashboard.upcomingBookings
      });
    } catch (error) {
      next(error);
    }
  },

  async getBookingHistory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const dashboard = await dashboardService.getUserDashboard(req.user!.id);
      
      res.json({
        status: 'success',
        data: dashboard.bookingHistory
      });
    } catch (error) {
      next(error);
    }
  },

  // Saved Locations
  async getSavedLocations(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const savedLocations = await dashboardService.getSavedLocations(req.user!.id, page, limit);
      
      res.json({
        status: 'success',
        data: savedLocations
      });
    } catch (error) {
      next(error);
    }
  },

  async saveLocation(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const validatedData = savedLocationSchema.parse(req.body);
      const location = await dashboardService.saveLocation(req.user!.id, validatedData);
      
      res.status(201).json({
        status: 'success',
        data: location
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(new ApiError('Invalid location data', 400, error.errors));
      }
      next(error);
    }
  },

  async updateLocation(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const validatedData = savedLocationSchema.partial().parse(req.body);
      const location = await dashboardService.updateLocation(
        req.user!.id,
        id,
        validatedData
      );
      
      res.json({
        status: 'success',
        data: location
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(new ApiError('Invalid location data', 400, error.errors));
      }
      next(error);
    }
  },

  async deleteLocation(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await dashboardService.deleteLocation(req.user!.id, id);
      
      res.json({
        status: 'success',
        message: 'Location deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  // Notification Preferences
  async getNotificationPreferences(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const preferences = await notificationService.getUserPreferences(req.user!.id);
      
      // Convert DateTime to time strings for frontend
      const result = preferences ? { ...preferences } as any : null;
      
      if (result) {
        if (result.quietHoursStart) {
          const date = new Date(result.quietHoursStart);
          result.quietHoursStart = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        }
        
        if (result.quietHoursEnd) {
          const date = new Date(result.quietHoursEnd);
          result.quietHoursEnd = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        }
      }
      
      res.json({
        status: 'success',
        data: result
      });
    } catch (error) {
      next(error);
    }
  },

  async updateNotificationPreferences(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const validatedData = notificationPreferencesSchema.parse(req.body);
      const preferences = await notificationService.updateUserPreferences(
        req.user!.id,
        validatedData as any
      );
      
      res.json({
        status: 'success',
        data: preferences
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(new ApiError('Invalid preferences data', 400, error.errors));
      }
      next(error);
    }
  },

  // Notification History
  async getNotificationHistory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const notifications = await notificationService.getNotificationHistory(
        req.user!.id,
        limit
      );
      
      res.json({
        status: 'success',
        data: notifications
      });
    } catch (error) {
      next(error);
    }
  },

  // Quick Actions
  async rebookTrip(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { bookingId } = req.params;
      const bookingData = await dashboardService.rebookTrip(req.user!.id, bookingId);
      
      res.json({
        status: 'success',
        data: bookingData,
        message: 'Booking data retrieved for rebooking'
      });
    } catch (error) {
      next(error);
    }
  }
};