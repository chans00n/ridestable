import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { paymentService } from '../services/payment.service';
import { stripeService } from '../services/stripe.service';
import { receiptService } from '../services/receipt.service';
import { logger } from '../config/logger';
import { AppError } from '../middleware/error';
import { AuthRequest } from '../middleware/auth';
import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '../config/database';

// Validation schemas
const createPaymentSchema = z.object({
  bookingId: z.string().cuid(),
  amount: z.number().positive(),
  paymentMethodId: z.string().optional(),
  savePaymentMethod: z.boolean().optional()
});

const confirmPaymentSchema = z.object({
  paymentMethodId: z.string().optional()
});

const refundPaymentSchema = z.object({
  amount: z.number().positive().optional(),
  reason: z.string().optional()
});

// Helper function to convert Decimal fields to numbers
const convertDecimalFields = (obj: any): any => {
  if (!obj) return obj;
  
  const converted = { ...obj };
  
  // Convert known Decimal fields
  if (converted.amount instanceof Decimal) {
    converted.amount = converted.amount.toNumber();
  }
  
  // Convert nested booking fields
  if (converted.booking) {
    if (converted.booking.totalAmount instanceof Decimal) {
      converted.booking.totalAmount = converted.booking.totalAmount.toNumber();
    }
    // Convert quote fields if present
    if (converted.booking.quotes) {
      if (converted.booking.quotes.totalAmount instanceof Decimal) {
        converted.booking.quotes.totalAmount = converted.booking.quotes.totalAmount.toNumber();
      }
      if (converted.booking.quotes.distance instanceof Decimal) {
        converted.booking.quotes.distance = converted.booking.quotes.distance.toNumber();
      }
    }
  }
  
  // Convert receipt data if it contains decimal values
  if (converted.receiptData && typeof converted.receiptData === 'object') {
    // Receipt data is stored as JSON, so decimal values would already be numbers
    // But we'll keep this check in case the structure changes
  }
  
  return converted;
};

export class PaymentController {
  /**
   * Create a payment intent for a booking
   */
  async createPaymentIntent(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const validatedData = createPaymentSchema.parse(req.body);
      const userId = req.user!.id;

      const result = await paymentService.createPayment({
        ...validatedData,
        userId
      });

      res.status(200).json({
        success: true,
        data: {
          paymentId: result.payment.id,
          clientSecret: result.clientSecret,
          amount: result.payment.amount instanceof Decimal ? result.payment.amount.toNumber() : result.payment.amount,
          currency: result.payment.currency
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(new AppError(400, 'Invalid payment data'));
      }
      next(error);
    }
  }

  /**
   * Confirm a payment
   */
  async confirmPayment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { paymentId } = req.params;
      const validatedData = confirmPaymentSchema.parse(req.body);

      const payment = await paymentService.confirmPayment(
        paymentId,
        validatedData.paymentMethodId
      );

      res.status(200).json({
        success: true,
        data: {
          paymentId: payment.id,
          status: payment.status,
          receiptUrl: payment.receiptUrl
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(new AppError(400, 'Invalid confirmation data'));
      }
      next(error);
    }
  }

  /**
   * Get payment details
   */
  async getPayment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { paymentId } = req.params;
      const payment = await paymentService.getPayment(paymentId);

      if (!payment) {
        return next(new AppError(404, 'Payment not found'));
      }

      // Verify user owns this payment
      if (payment.booking.userId !== req.user!.id) {
        return next(new AppError(403, 'Not authorized to view this payment'));
      }

      res.status(200).json({
        success: true,
        data: convertDecimalFields(payment)
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get payment by booking ID
   */
  async getPaymentByBooking(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { bookingId } = req.params;
      const payment = await paymentService.getPaymentByBookingId(bookingId);

      if (!payment) {
        return next(new AppError(404, 'Payment not found for this booking'));
      }

      res.status(200).json({
        success: true,
        data: convertDecimalFields(payment)
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Process refund
   */
  async refundPayment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { paymentId } = req.params;
      const validatedData = refundPaymentSchema.parse(req.body);

      // Verify payment exists and user owns it
      const payment = await paymentService.getPayment(paymentId);
      if (!payment) {
        return next(new AppError(404, 'Payment not found'));
      }

      if (payment.booking.userId !== req.user!.id) {
        return next(new AppError(403, 'Not authorized to refund this payment'));
      }

      const refundedPayment = await paymentService.refundPayment(
        paymentId,
        validatedData.amount,
        validatedData.reason
      );

      res.status(200).json({
        success: true,
        data: {
          paymentId: refundedPayment.id,
          status: refundedPayment.status,
          refundAmount: validatedData.amount || (refundedPayment.amount instanceof Decimal ? refundedPayment.amount.toNumber() : refundedPayment.amount)
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(new AppError(400, 'Invalid refund data'));
      }
      next(error);
    }
  }

  /**
   * Get customer's payment methods
   */
  async getPaymentMethods(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      
      // Get or create Stripe customer
      const customer = await stripeService.createOrRetrieveCustomer(userId);
      
      // List payment methods
      const paymentMethods = await stripeService.listPaymentMethods(customer.id);

      // Format response
      const formattedMethods = paymentMethods.map(method => ({
        id: method.id,
        type: method.type,
        card: method.card ? {
          brand: method.card.brand,
          last4: method.card.last4,
          expMonth: method.card.exp_month,
          expYear: method.card.exp_year
        } : null,
        created: method.created
      }));

      res.status(200).json({
        success: true,
        data: formattedMethods
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add a payment method
   */
  async addPaymentMethod(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { paymentMethodId, setAsDefault } = req.body;

      if (!paymentMethodId) {
        return next(new AppError(400, 'Payment method ID is required'));
      }

      // Get or create Stripe customer
      const customer = await stripeService.createOrRetrieveCustomer(userId);
      
      // Attach payment method
      const paymentMethod = await stripeService.attachPaymentMethod(
        paymentMethodId,
        customer.id
      );

      // Set as default if requested
      if (setAsDefault) {
        await stripeService.setDefaultPaymentMethod(customer.id, paymentMethodId);
      }

      res.status(200).json({
        success: true,
        data: {
          id: paymentMethod.id,
          type: paymentMethod.type,
          card: paymentMethod.card ? {
            brand: paymentMethod.card.brand,
            last4: paymentMethod.card.last4,
            expMonth: paymentMethod.card.exp_month,
            expYear: paymentMethod.card.exp_year
          } : null
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove a payment method
   */
  async removePaymentMethod(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { paymentMethodId } = req.params;

      // Verify user owns this payment method
      const customer = await stripeService.createOrRetrieveCustomer(userId);
      const paymentMethods = await stripeService.listPaymentMethods(customer.id);
      
      const ownsMethod = paymentMethods.some(method => method.id === paymentMethodId);
      if (!ownsMethod) {
        return next(new AppError(403, 'Not authorized to remove this payment method'));
      }

      // Detach payment method
      await stripeService.detachPaymentMethod(paymentMethodId);

      res.status(200).json({
        success: true,
        message: 'Payment method removed successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handle Stripe webhooks
   */
  async handleWebhook(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const signature = req.headers['stripe-signature'] as string;
      
      if (!signature) {
        return next(new AppError(400, 'Missing Stripe signature'));
      }

      // Verify webhook signature and construct event
      const event = stripeService.verifyWebhookSignature(
        req.body, // Raw body
        signature
      );

      logger.info('Received Stripe webhook', { 
        eventId: event.id,
        type: event.type 
      });

      // Process webhook event
      await paymentService.handleStripeWebhook(event);

      res.status(200).json({ received: true });
    } catch (error) {
      logger.error('Webhook processing failed', error);
      
      // Return 200 to acknowledge receipt even if processing failed
      // This prevents Stripe from retrying
      res.status(200).json({ 
        received: true, 
        error: 'Processing failed but acknowledged' 
      });
    }
  }

  /**
   * Get receipt for a payment
   */
  async getReceipt(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { paymentId } = req.params;
      
      // Verify payment exists and user owns it
      const payment = await paymentService.getPayment(paymentId);
      if (!payment) {
        return next(new AppError(404, 'Payment not found'));
      }

      if (payment.booking.userId !== req.user!.id) {
        return next(new AppError(403, 'Not authorized to view this receipt'));
      }

      // Get receipt
      const receipt = await receiptService.getReceiptByPaymentId(paymentId);
      if (!receipt) {
        return next(new AppError(404, 'Receipt not found'));
      }

      res.status(200).json({
        success: true,
        data: convertDecimalFields(receipt)
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Send receipt email
   */
  async sendReceiptEmail(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { paymentId } = req.params;
      
      // Verify payment exists and user owns it
      const payment = await paymentService.getPayment(paymentId);
      if (!payment) {
        return next(new AppError(404, 'Payment not found'));
      }

      if (payment.booking.userId !== req.user!.id) {
        return next(new AppError(403, 'Not authorized to send this receipt'));
      }

      // Get or generate receipt
      let receipt = await receiptService.getReceiptByPaymentId(paymentId);
      if (!receipt) {
        if (payment.status !== 'COMPLETED') {
          return next(new AppError(400, 'Can only generate receipt for completed payments'));
        }
        receipt = await receiptService.generateReceipt(paymentId);
      }

      // Send email
      await receiptService.sendReceiptEmail(receipt.id);

      res.status(200).json({
        success: true,
        message: 'Receipt email sent successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user's payment methods
   */
  async getPaymentMethods(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const paymentMethods = await prisma.paymentMethod.findMany({
        where: { userId: req.user!.id },
        orderBy: [
          { isDefault: 'desc' },
          { createdAt: 'desc' }
        ],
        select: {
          id: true,
          cardBrand: true,
          cardLast4: true,
          cardExpMonth: true,
          cardExpYear: true,
          isDefault: true
        }
      });

      res.json({
        success: true,
        data: paymentMethods
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add a new payment method
   */
  async addPaymentMethod(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { paymentMethodId } = req.body;
      const userId = req.user!.id;

      // Get or create Stripe customer
      let user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return next(new AppError(404, 'User not found'));
      }

      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripeService.createCustomer({
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          metadata: { userId }
        });
        customerId = customer.id;
        
        await prisma.user.update({
          where: { id: userId },
          data: { stripeCustomerId: customerId }
        });
      }

      // Attach payment method to customer
      const paymentMethod = await stripeService.attachPaymentMethod(
        paymentMethodId,
        customerId
      );

      // Save to database
      const savedMethod = await prisma.paymentMethod.create({
        data: {
          userId,
          stripePaymentMethodId: paymentMethod.id,
          cardBrand: paymentMethod.card?.brand || 'unknown',
          cardLast4: paymentMethod.card?.last4 || '',
          cardExpMonth: paymentMethod.card?.exp_month || 0,
          cardExpYear: paymentMethod.card?.exp_year || 0,
          isDefault: false
        }
      });

      res.json({
        success: true,
        data: savedMethod
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove a payment method
   */
  async removePaymentMethod(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { paymentMethodId } = req.params;
      const userId = req.user!.id;

      const paymentMethod = await prisma.paymentMethod.findFirst({
        where: {
          id: paymentMethodId,
          userId
        }
      });

      if (!paymentMethod) {
        return next(new AppError(404, 'Payment method not found'));
      }

      // Detach from Stripe
      await stripeService.detachPaymentMethod(paymentMethod.stripePaymentMethodId);

      // Delete from database
      await prisma.paymentMethod.delete({
        where: { id: paymentMethodId }
      });

      res.json({
        success: true,
        message: 'Payment method removed successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Set default payment method
   */
  async setDefaultPaymentMethod(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { paymentMethodId } = req.params;
      const userId = req.user!.id;

      // Reset all payment methods to non-default
      await prisma.paymentMethod.updateMany({
        where: { userId },
        data: { isDefault: false }
      });

      // Set the selected one as default
      const updated = await prisma.paymentMethod.update({
        where: {
          id: paymentMethodId,
          userId
        },
        data: { isDefault: true }
      });

      res.json({
        success: true,
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a setup intent for adding cards
   */
  async createSetupIntent(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      
      // Get or create Stripe customer
      let user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return next(new AppError(404, 'User not found'));
      }

      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripeService.createCustomer({
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          metadata: { userId }
        });
        customerId = customer.id;
        
        await prisma.user.update({
          where: { id: userId },
          data: { stripeCustomerId: customerId }
        });
      }

      const setupIntent = await stripeService.createSetupIntent(customerId);

      res.json({
        success: true,
        data: {
          clientSecret: setupIntent.client_secret
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Download receipt as PDF
   */
  async downloadReceipt(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { paymentId } = req.params;
      
      // Verify payment exists and user owns it
      const payment = await paymentService.getPayment(paymentId);
      if (!payment) {
        return next(new AppError(404, 'Payment not found'));
      }

      if (payment.booking.userId !== req.user!.id) {
        return next(new AppError(403, 'Not authorized to download this receipt'));
      }

      // Get or generate receipt
      let receipt = await receiptService.getReceiptByPaymentId(paymentId);
      if (!receipt) {
        if (payment.status !== 'COMPLETED') {
          return next(new AppError(400, 'Can only generate receipt for completed payments'));
        }
        receipt = await receiptService.generateReceipt(paymentId);
      }

      // Generate PDF
      const pdfBuffer = await receiptService.generateReceiptPdf(receipt.id);

      // Set response headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="receipt-${payment.id}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length.toString());

      // Send PDF buffer
      res.send(pdfBuffer);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const limit = parseInt(req.query.limit as string) || 20;

      const payments = await prisma.payment.findMany({
        where: {
          booking: {
            userId
          }
        },
        include: {
          booking: {
            select: {
              id: true,
              confirmationId: true,
              pickupAddress: true,
              dropoffAddress: true,
              scheduledDateTime: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit
      });

      const transactions = payments.map(payment => ({
        id: payment.id,
        bookingId: payment.bookingId,
        amount: payment.amount instanceof Decimal ? payment.amount.toNumber() : payment.amount,
        currency: payment.currency,
        status: payment.status,
        createdAt: payment.createdAt,
        receiptUrl: payment.receiptUrl,
        booking: payment.booking
      }));

      res.json({
        success: true,
        data: transactions
      });
    } catch (error) {
      next(error);
    }
  }
}

export const paymentController = new PaymentController();