import { Router } from 'express';
import { receiptController } from '../controllers/receipt.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public route for downloading receipts (with optional authentication)
router.get('/:filename', (req, res, next) => {
  // Try to authenticate but don't require it
  authenticate(req, res, (err) => {
    // Continue regardless of authentication result
    next();
  });
}, receiptController.downloadReceipt);

// Protected route for generating receipts
router.post('/bookings/:bookingId/generate', authenticate, receiptController.generateReceipt);

export default router;