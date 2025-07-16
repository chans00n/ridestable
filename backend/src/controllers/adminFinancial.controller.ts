import { Request, Response } from 'express';
import { adminFinancialService } from '../services/adminFinancial.service';
import { auditLogService } from '../services/auditLog.service';
import { AdminAuthRequest } from '../types/admin';

export class AdminFinancialController {
  async getFinancialMetrics(req: AdminAuthRequest, res: Response) {
    try {
      const metrics = await adminFinancialService.getFinancialMetrics();

      // Log access
      await auditLogService.log({
        adminId: req.admin!.id,
        action: 'view_financial_metrics',
        resource: 'financial',
        details: { view: 'dashboard' }
      });

      res.json({
        success: true,
        data: metrics
      });
    } catch (error: any) {
      console.error('Error fetching financial metrics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch financial metrics'
      });
    }
  }

  async getPaymentReconciliation(req: AdminAuthRequest, res: Response) {
    try {
      const reconciliation = await adminFinancialService.getPaymentReconciliation();

      await auditLogService.log({
        adminId: req.admin!.id,
        action: 'view_payment_reconciliation',
        resource: 'financial',
        details: { discrepancyCount: reconciliation.platformRecords.discrepancies.length }
      });

      res.json({
        success: true,
        data: reconciliation
      });
    } catch (error: any) {
      console.error('Error fetching payment reconciliation:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch payment reconciliation'
      });
    }
  }

  async getRefunds(req: AdminAuthRequest, res: Response) {
    try {
      const { startDate, endDate, status } = req.query;

      const filters: any = {};
      if (startDate && endDate) {
        filters.startDate = new Date(startDate as string);
        filters.endDate = new Date(endDate as string);
      }
      if (status) {
        filters.status = status as string;
      }

      const refunds = await adminFinancialService.getRefunds(filters);

      await auditLogService.log({
        adminId: req.admin!.id,
        action: 'view_refunds',
        resource: 'financial',
        details: { filters, count: refunds.length }
      });

      res.json({
        success: true,
        data: refunds
      });
    } catch (error: any) {
      console.error('Error fetching refunds:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch refunds'
      });
    }
  }

  async processRefund(req: AdminAuthRequest, res: Response) {
    try {
      const { paymentId, amount, reason } = req.body;

      if (!paymentId) {
        return res.status(400).json({
          success: false,
          error: 'Payment ID is required'
        });
      }

      const result = await adminFinancialService.processRefund(
        paymentId,
        amount,
        reason,
        req.adminUser!.id
      );

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error
        });
      }

      res.json({
        success: true,
        data: {
          refundId: result.refundId,
          message: 'Refund processed successfully'
        }
      });
    } catch (error: any) {
      console.error('Error processing refund:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process refund'
      });
    }
  }

  async reconcileTransaction(req: AdminAuthRequest, res: Response) {
    try {
      const { transactionId } = req.params;

      const result = await adminFinancialService.reconcileTransaction(
        transactionId,
        req.adminUser!.id
      );

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error
        });
      }

      res.json({
        success: true,
        message: 'Transaction reconciled successfully'
      });
    } catch (error: any) {
      console.error('Error reconciling transaction:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to reconcile transaction'
      });
    }
  }

  async getCustomerLifetimeValue(req: AdminAuthRequest, res: Response) {
    try {
      const days = parseInt(req.query.days as string) || 365;
      
      const clvData = await adminFinancialService.getCustomerLifetimeValue(days);

      await auditLogService.log({
        adminId: req.admin!.id,
        action: 'view_customer_lifetime_value',
        resource: 'financial',
        details: { days }
      });

      res.json({
        success: true,
        data: clvData
      });
    } catch (error: any) {
      console.error('Error fetching CLV data:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch customer lifetime value data'
      });
    }
  }

  async exportFinancialReport(req: AdminAuthRequest, res: Response) {
    try {
      const { reportType, startDate, endDate, format = 'csv' } = req.query;

      if (!reportType || !startDate || !endDate) {
        return res.status(400).json({
          success: false,
          error: 'Report type, start date, and end date are required'
        });
      }

      // TODO: Implement report generation based on type
      // For now, return a placeholder response
      await auditLogService.log({
        adminId: req.admin!.id,
        action: 'export_financial_report',
        resource: 'financial',
        details: { reportType, startDate, endDate, format }
      });

      res.json({
        success: true,
        message: 'Report generation queued',
        data: {
          reportId: `report_${Date.now()}`,
          status: 'pending'
        }
      });
    } catch (error: any) {
      console.error('Error exporting financial report:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to export financial report'
      });
    }
  }
}

export const adminFinancialController = new AdminFinancialController();