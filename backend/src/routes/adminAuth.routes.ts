import { Router } from 'express';
import { adminAuthController } from '../controllers/adminAuth.controller';
import { authenticateAdmin } from '../middleware/adminAuth';
import { asyncHandler } from '../middleware/async';

const router = Router();

// Public routes
router.post('/login', asyncHandler(adminAuthController.login));
router.post('/refresh-token', asyncHandler(adminAuthController.refreshToken));

// Protected routes
router.use(authenticateAdmin);

router.post('/logout', asyncHandler(adminAuthController.logout));
router.get('/profile', asyncHandler(adminAuthController.getProfile));
router.post('/change-password', asyncHandler(adminAuthController.changePassword));

// MFA routes
router.post('/mfa/setup', asyncHandler(adminAuthController.setupMfa));
router.post('/mfa/enable', asyncHandler(adminAuthController.enableMfa));
router.post('/mfa/disable', asyncHandler(adminAuthController.disableMfa));

export default router;