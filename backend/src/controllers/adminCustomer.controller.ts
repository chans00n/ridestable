import { Request, Response, NextFunction } from 'express';
import { adminCustomerService } from '../services/adminCustomer.service';
import { AdminAuthRequest } from '../types/admin';
import { AppError } from '../utils/errors';
import { z } from 'zod';

const searchCustomersSchema = z.object({
  search: z.string().optional(),
  emailVerified: z.boolean().optional(),
  hasBookings: z.boolean().optional(),
  dateRange: z.tuple([z.string(), z.string()]).optional(),
  minBookings: z.number().optional(),
  minRevenue: z.number().optional()
});

const updateCustomerSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  emailVerified: z.boolean().optional()
});

const sendCommunicationSchema = z.object({
  customerId: z.string(),
  channel: z.enum(['email', 'sms', 'both']),
  subject: z.string().optional(),
  message: z.string().min(1),
  templateId: z.string().optional(),
  variables: z.record(z.any()).optional()
});

export class AdminCustomerController {
  async searchCustomers(req: AdminAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.admin) {
        throw new AppError('Unauthorized', 401);
      }

      const {
        page = '1',
        limit = '20',
        ...filters
      } = req.query;

      // Parse date range if provided
      if (filters.dateRange && typeof filters.dateRange === 'string') {
        const [start, end] = filters.dateRange.split(',');
        filters.dateRange = [new Date(start), new Date(end)];
      }

      // Parse boolean values
      if (filters.emailVerified !== undefined) {
        filters.emailVerified = filters.emailVerified === 'true';
      }
      if (filters.hasBookings !== undefined) {
        filters.hasBookings = filters.hasBookings === 'true';
      }

      // Parse number values
      if (filters.minBookings) {
        filters.minBookings = parseInt(filters.minBookings as string);
      }
      if (filters.minRevenue) {
        filters.minRevenue = parseFloat(filters.minRevenue as string);
      }

      const result = await adminCustomerService.searchCustomers(
        filters as any,
        parseInt(page as string),
        parseInt(limit as string)
      );

      res.json({
        status: 'success',
        data: result.data,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getCustomerDetails(req: AdminAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.admin) {
        throw new AppError('Unauthorized', 401);
      }

      const { customerId } = req.params;
      const customer = await adminCustomerService.getCustomerDetails(customerId);

      res.json({
        status: 'success',
        data: customer
      });
    } catch (error) {
      next(error);
    }
  }

  async updateCustomer(req: AdminAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.admin) {
        throw new AppError('Unauthorized', 401);
      }

      const { customerId } = req.params;
      const validatedData = updateCustomerSchema.parse(req.body);

      const customer = await adminCustomerService.updateCustomer(
        customerId,
        validatedData,
        req.admin.id
      );

      res.json({
        status: 'success',
        data: customer
      });
    } catch (error) {
      next(error);
    }
  }

  async sendCommunication(req: AdminAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.admin) {
        throw new AppError('Unauthorized', 401);
      }

      const validatedData = sendCommunicationSchema.parse(req.body);

      const result = await adminCustomerService.sendCommunication(
        validatedData,
        req.admin.id
      );

      res.json({
        status: 'success',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getCustomerBookings(req: AdminAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.admin) {
        throw new AppError('Unauthorized', 401);
      }

      const { customerId } = req.params;
      const { page = '1', limit = '20' } = req.query;

      const result = await adminCustomerService.getCustomerBookingHistory(
        customerId,
        parseInt(page as string),
        parseInt(limit as string)
      );

      res.json({
        status: 'success',
        data: result.data,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getCustomerCommunications(req: AdminAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.admin) {
        throw new AppError('Unauthorized', 401);
      }

      const { customerId } = req.params;
      const { page = '1', limit = '20' } = req.query;

      const result = await adminCustomerService.getCustomerCommunicationHistory(
        customerId,
        parseInt(page as string),
        parseInt(limit as string)
      );

      res.json({
        status: 'success',
        data: result.data,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async exportCustomers(req: AdminAuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.admin) {
        throw new AppError('Unauthorized', 401);
      }

      const { format = 'csv', ...filters } = req.query;

      // Parse filters similar to searchCustomers
      if (filters.dateRange && typeof filters.dateRange === 'string') {
        const [start, end] = filters.dateRange.split(',');
        filters.dateRange = [new Date(start), new Date(end)];
      }

      const exportData = await adminCustomerService.exportCustomers(
        filters as any,
        format as 'csv' | 'excel'
      );

      const filename = `customers-export-${new Date().toISOString().split('T')[0]}.${format}`;
      
      res.setHeader('Content-Type', format === 'csv' ? 'text/csv' : 'application/vnd.ms-excel');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(exportData);
    } catch (error) {
      next(error);
    }
  }
}

export const adminCustomerController = new AdminCustomerController();