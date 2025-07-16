import { Router } from 'express';
import { adminFinancialController } from '../controllers/adminFinancial.controller';
import { authenticateAdmin, authorizeAdmin } from '../middleware/adminAuth';
import { asyncHandler } from '../middleware/async';

const router = Router();

// All routes require authentication
router.use(authenticateAdmin);

// Get financial metrics dashboard
router.get(
  '/metrics',
  authorizeAdmin('financial', 'read'),
  asyncHandler(adminFinancialController.getFinancialMetrics)
);

// Get payment reconciliation data
router.get(
  '/reconciliation',
  authorizeAdmin('financial', 'read'),
  asyncHandler(adminFinancialController.getPaymentReconciliation)
);

// Get refunds list
router.get(
  '/refunds',
  authorizeAdmin('financial', 'read'),
  asyncHandler(adminFinancialController.getRefunds)
);

// Process a refund
router.post(
  '/refunds',
  authorizeAdmin('financial', 'write'),
  asyncHandler(adminFinancialController.processRefund)
);

// Reconcile a transaction
router.post(
  '/transactions/:transactionId/reconcile',
  authorizeAdmin('financial', 'write'),
  asyncHandler(adminFinancialController.reconcileTransaction)
);

// Get customer lifetime value analytics
router.get(
  '/customer-lifetime-value',
  authorizeAdmin('financial', 'read'),
  asyncHandler(adminFinancialController.getCustomerLifetimeValue)
);

// Export financial report
router.get(
  '/export',
  authorizeAdmin('financial', 'export'),
  asyncHandler(adminFinancialController.exportFinancialReport)
);

export default router;