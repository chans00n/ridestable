import { Router } from 'express';
import { adminUserController } from '../controllers/adminUser.controller';
import { authenticateAdmin, authorizeAdmin, requireRole } from '../middleware/adminAuth';
import { asyncHandler } from '../middleware/async';

const router = Router();

// All routes require authentication
router.use(authenticateAdmin);

// Get all admin users
router.get(
  '/',
  authorizeAdmin('admin_users', 'read'),
  asyncHandler(adminUserController.getAdmins)
);

// Get admin user by ID
router.get(
  '/:adminId',
  authorizeAdmin('admin_users', 'read'),
  asyncHandler(adminUserController.getAdminById)
);

// Get admin activity log
router.get(
  '/:adminId/activity',
  authorizeAdmin('audit_logs', 'read'),
  asyncHandler(adminUserController.getAdminActivity)
);

// Create new admin user (Super Admin only)
router.post(
  '/',
  requireRole(['SUPER_ADMIN']),
  asyncHandler(adminUserController.createAdmin)
);

// Update admin user
router.put(
  '/:adminId',
  authorizeAdmin('admin_users', 'write'),
  asyncHandler(adminUserController.updateAdmin)
);

// Delete (deactivate) admin user (Super Admin only)
router.delete(
  '/:adminId',
  requireRole(['SUPER_ADMIN']),
  asyncHandler(adminUserController.deleteAdmin)
);

// Reset admin password (Super Admin only)
router.post(
  '/:adminId/reset-password',
  requireRole(['SUPER_ADMIN']),
  asyncHandler(adminUserController.resetPassword)
);

// Unlock admin user (Super Admin only)
router.post(
  '/:adminId/unlock',
  requireRole(['SUPER_ADMIN']),
  asyncHandler(adminUserController.unlockAdmin)
);

export default router;