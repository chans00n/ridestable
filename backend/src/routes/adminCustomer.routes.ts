import { Router } from 'express';
import { adminCustomerController } from '../controllers/adminCustomer.controller';
import { authenticateAdmin, authorizeAdmin } from '../middleware/adminAuth';
import { asyncHandler } from '../middleware/async';

const router = Router();

// All routes require authentication
router.use(authenticateAdmin);

// Search and list customers
router.get(
  '/',
  authorizeAdmin('customers', 'read'),
  asyncHandler(adminCustomerController.searchCustomers)
);

// Export customers
router.get(
  '/export',
  authorizeAdmin('customers', 'export'),
  asyncHandler(adminCustomerController.exportCustomers)
);

// Send communication to customers
router.post(
  '/communicate',
  authorizeAdmin('customers', 'write'),
  asyncHandler(adminCustomerController.sendCommunication)
);

// Get single customer details
router.get(
  '/:customerId',
  authorizeAdmin('customers', 'read'),
  asyncHandler(adminCustomerController.getCustomerDetails)
);

// Update customer
router.put(
  '/:customerId',
  authorizeAdmin('customers', 'write'),
  asyncHandler(adminCustomerController.updateCustomer)
);

// Get customer booking history
router.get(
  '/:customerId/bookings',
  authorizeAdmin('customers', 'read'),
  asyncHandler(adminCustomerController.getCustomerBookings)
);

// Get customer communication history
router.get(
  '/:customerId/communications',
  authorizeAdmin('customers', 'read'),
  asyncHandler(adminCustomerController.getCustomerCommunications)
);

export default router;