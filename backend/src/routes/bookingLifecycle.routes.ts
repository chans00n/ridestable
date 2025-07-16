import { Router } from 'express';
import { bookingLifecycleController } from '../controllers/bookingLifecycle.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Cancellation policy (must come before :id routes)
router.get('/cancellation-policy', bookingLifecycleController.getCancellationPolicy);

// Confirmation endpoints
router.post('/:id/confirm', bookingLifecycleController.confirmBooking);
router.get('/:id/confirmation', bookingLifecycleController.getConfirmation);
router.post('/:id/confirmation/resend', bookingLifecycleController.resendConfirmation);

// Modification endpoints
router.post('/:id/modify', bookingLifecycleController.modifyBooking);
router.post('/modifications/:modificationId/apply', bookingLifecycleController.applyModification);
router.get('/:id/modifications', bookingLifecycleController.getModificationHistory);

// Cancellation endpoints
router.post('/:id/cancel', bookingLifecycleController.cancelBooking);
router.get('/:id/cancellation', bookingLifecycleController.getCancellationDetails);

export default router;