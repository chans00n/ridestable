import { Router } from 'express';
import { paymentController } from '../controllers/payment.controller';
import { authenticate } from '../middleware/auth';
import rateLimit from 'express-rate-limit';

const router = Router();

// Apply rate limiting to payment endpoints
const paymentRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per window
  message: 'Too many payment requests, please try again later'
});

// Webhook endpoint (no auth, uses signature verification)
router.post(
  '/webhook',
  paymentController.handleWebhook
);

// All other routes require authentication
router.use(authenticate);

// Transaction history
router.get('/transactions', paymentController.getTransactionHistory);

// Payment intent endpoints
router.post(
  '/intent',
  paymentRateLimiter,
  paymentController.createPaymentIntent
);

router.post(
  '/:paymentId/confirm',
  paymentRateLimiter,
  paymentController.confirmPayment
);

// Payment information endpoints
router.get(
  '/:paymentId',
  paymentController.getPayment
);

router.get(
  '/booking/:bookingId',
  paymentController.getPaymentByBooking
);

// Refund endpoint
router.post(
  '/:paymentId/refund',
  paymentRateLimiter,
  paymentController.refundPayment
);

// Receipt endpoints
router.get(
  '/:paymentId/receipt',
  paymentController.getReceipt
);

router.get(
  '/:paymentId/receipt/download',
  paymentController.downloadReceipt
);

router.post(
  '/:paymentId/receipt/send',
  paymentRateLimiter,
  paymentController.sendReceiptEmail
);

// Payment method management
router.get(
  '/methods/list',
  paymentController.getPaymentMethods
);

router.post(
  '/methods/add',
  paymentRateLimiter,
  paymentController.addPaymentMethod
);

router.delete(
  '/methods/:paymentMethodId',
  paymentRateLimiter,
  paymentController.removePaymentMethod
);

router.patch(
  '/methods/:paymentMethodId/default',
  paymentRateLimiter,
  paymentController.setDefaultPaymentMethod
);

// Setup intent for adding new cards
router.post(
  '/setup-intent',
  paymentRateLimiter,
  paymentController.createSetupIntent
);


export default router;