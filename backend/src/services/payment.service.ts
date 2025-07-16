import { prisma } from '../config/database';
import { stripeService } from './stripe.service';
import { receiptService } from './receipt.service';
import { logger } from '../config/logger';
import { AppError } from '../middleware/error';
import type { Payment, PaymentStatus, Booking } from '@prisma/client';
import type Stripe from 'stripe';

interface CreatePaymentParams {
  bookingId: string;
  userId: string;
  amount: number;
  paymentMethodId?: string;
  savePaymentMethod?: boolean;
}

interface PaymentWithBooking extends Payment {
  booking: Booking;
}

export class PaymentService {
  /**
   * Create a payment for a booking
   */
  async createPayment(params: CreatePaymentParams): Promise<{
    payment: Payment;
    clientSecret: string;
  }> {
    try {
      // Use a transaction to prevent race conditions
      return await prisma.$transaction(async (tx) => {
        // Validate booking exists and belongs to user
        const booking = await tx.booking.findFirst({
          where: {
            id: params.bookingId,
            userId: params.userId,
            status: 'PENDING'
          }
        });

        if (!booking) {
          throw new AppError(404, 'Booking not found or already processed');
        }

        // Check if payment already exists with a lock to prevent concurrent creation
        const existingPayment = await tx.payment.findUnique({
          where: { bookingId: params.bookingId }
        });

        if (existingPayment && existingPayment.status === 'COMPLETED') {
          throw new AppError(400, 'Payment already completed for this booking');
        }

        // If payment exists and is pending with same amount, return existing client secret
        if (existingPayment && existingPayment.status === 'PENDING') {
          // Check if amount matches
          if (existingPayment.amount.toNumber() !== params.amount) {
            throw new AppError(400, 'Payment amount mismatch. Please refresh and try again.');
          }
          
          try {
            const existingIntent = await stripeService.stripe.paymentIntents.retrieve(existingPayment.stripePaymentIntentId);
            
            // Return existing intent if it's still usable
            if (existingIntent.status === 'requires_payment_method' || 
                existingIntent.status === 'requires_action' ||
                existingIntent.status === 'requires_confirmation' ||
                existingIntent.status === 'processing') {
              logger.info('Returning existing payment intent', { 
                paymentId: existingPayment.id,
                intentId: existingIntent.id,
                status: existingIntent.status
              });
              return {
                payment: existingPayment,
                clientSecret: existingIntent.client_secret!
              };
            }
            
            // If the intent is canceled or failed, we'll create a new one below
            logger.info('Existing payment intent not usable, will create new one', {
              intentId: existingIntent.id,
              status: existingIntent.status
            });
          } catch (error) {
            logger.warn('Failed to retrieve existing payment intent, will create new one', { error });
          }
        }

        // Get or create Stripe customer
        const customer = await stripeService.createOrRetrieveCustomer(params.userId);

        // Create payment intent
        const paymentIntent = await stripeService.createPaymentIntent({
          amount: params.amount,
          customerId: customer.id,
          bookingId: params.bookingId,
          paymentMethodId: params.paymentMethodId,
          metadata: {
            userId: params.userId,
            bookingId: params.bookingId
          }
        });

        // Create or update payment record within the transaction
        const payment = await tx.payment.upsert({
          where: { bookingId: params.bookingId },
          create: {
            bookingId: params.bookingId,
            stripePaymentIntentId: paymentIntent.id,
            stripeCustomerId: customer.id,
            amount: params.amount,
            currency: 'usd',
            status: 'PENDING',
            paymentMethodId: params.paymentMethodId
          },
          update: {
            stripePaymentIntentId: paymentIntent.id,
            stripeCustomerId: customer.id,
            amount: params.amount,
            paymentMethodId: params.paymentMethodId,
            status: 'PENDING',
            failureReason: null
          }
        });

        logger.info('Created payment', { 
          paymentId: payment.id,
          bookingId: params.bookingId,
          amount: params.amount,
          hasClientSecret: !!paymentIntent.client_secret
        });

        if (!paymentIntent.client_secret) {
          logger.error('Payment intent created without client_secret', {
            paymentIntentId: paymentIntent.id,
            status: paymentIntent.status
          });
          throw new AppError(500, 'Payment initialization failed - no client secret');
        }

        return {
          payment,
          clientSecret: paymentIntent.client_secret
        };
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to create payment', error);
      throw new AppError(500, 'Failed to initialize payment');
    }
  }

  /**
   * Confirm a payment
   */
  async confirmPayment(
    paymentId: string,
    paymentMethodId?: string
  ): Promise<Payment> {
    try {
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId }
      });

      if (!payment) {
        throw new AppError(404, 'Payment not found');
      }

      if (payment.status === 'COMPLETED') {
        throw new AppError(400, 'Payment already completed');
      }

      if (!payment.stripePaymentIntentId) {
        throw new AppError(400, 'Payment intent not initialized');
      }

      // Confirm payment with Stripe
      const paymentIntent = await stripeService.confirmPaymentIntent(
        payment.stripePaymentIntentId,
        paymentMethodId
      );

      // Update payment status based on Stripe response
      const updatedPayment = await this.updatePaymentFromIntent(
        payment.id,
        paymentIntent
      );

      // If payment succeeded, update booking status and generate receipt
      if (updatedPayment.status === 'COMPLETED') {
        await prisma.booking.update({
          where: { id: payment.bookingId },
          data: { status: 'CONFIRMED' }
        });

        // Generate receipt
        try {
          const receipt = await receiptService.generateReceipt(payment.id);
          
          // Send receipt email asynchronously (don't wait for it)
          receiptService.sendReceiptEmail(receipt.id).catch(err => {
            logger.error('Failed to send receipt email', err);
          });
        } catch (err) {
          // Log error but don't fail the payment confirmation
          logger.error('Failed to generate receipt', err);
        }

        logger.info('Payment confirmed and booking updated', { 
          paymentId: payment.id,
          bookingId: payment.bookingId 
        });
      }

      return updatedPayment;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to confirm payment', error);
      throw new AppError(500, 'Payment confirmation failed');
    }
  }

  /**
   * Update payment record from Stripe payment intent
   */
  async updatePaymentFromIntent(
    paymentId: string,
    paymentIntent: Stripe.PaymentIntent
  ): Promise<Payment> {
    const status = this.mapStripeStatusToPaymentStatus(paymentIntent.status);
    
    const updateData: any = {
      status,
      metadata: paymentIntent.metadata
    };

    // Get receipt URL from latest charge if available
    if (paymentIntent.latest_charge && typeof paymentIntent.latest_charge !== 'string') {
      updateData.receiptUrl = paymentIntent.latest_charge.receipt_url;
      
      if (paymentIntent.latest_charge.failure_message) {
        updateData.failureReason = paymentIntent.latest_charge.failure_message;
      }
    } else if (paymentIntent.last_payment_error) {
      updateData.failureReason = paymentIntent.last_payment_error.message;
    }

    if (paymentIntent.payment_method && typeof paymentIntent.payment_method === 'string') {
      updateData.paymentMethodId = paymentIntent.payment_method;
    }

    const payment = await prisma.payment.update({
      where: { id: paymentId },
      data: updateData
    });

    logger.info('Updated payment from Stripe intent', { 
      paymentId,
      status: payment.status 
    });

    return payment;
  }

  /**
   * Get payment by ID
   */
  async getPayment(paymentId: string): Promise<PaymentWithBooking | null> {
    return await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { booking: true }
    });
  }

  /**
   * Get payment by booking ID
   */
  async getPaymentByBookingId(bookingId: string): Promise<Payment | null> {
    return await prisma.payment.findUnique({
      where: { bookingId }
    });
  }

  /**
   * Process refund for a payment
   */
  async refundPayment(
    paymentId: string,
    amount?: number,
    reason?: string
  ): Promise<Payment> {
    try {
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId }
      });

      if (!payment) {
        throw new AppError(404, 'Payment not found');
      }

      if (payment.status !== 'COMPLETED') {
        throw new AppError(400, 'Can only refund completed payments');
      }

      if (!payment.stripePaymentIntentId) {
        throw new AppError(400, 'No payment intent found');
      }

      // Create refund in Stripe
      const refund = await stripeService.createRefund({
        paymentIntentId: payment.stripePaymentIntentId,
        amount: amount || payment.amount.toNumber(),
        metadata: {
          paymentId: payment.id,
          reason: reason || 'Customer requested'
        }
      });

      // Update payment status
      const updatedPayment = await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: amount && amount < payment.amount.toNumber() 
            ? 'REFUNDED' 
            : 'REFUNDED',
          metadata: {
            ...(payment.metadata as any || {}),
            refundId: refund.id,
            refundAmount: refund.amount / 100,
            refundReason: reason
          }
        }
      });

      // Update booking status
      await prisma.booking.update({
        where: { id: payment.bookingId },
        data: { status: 'CANCELLED' }
      });

      logger.info('Payment refunded', { 
        paymentId,
        refundId: refund.id,
        amount: refund.amount / 100 
      });

      return updatedPayment;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to refund payment', error);
      throw new AppError(500, 'Refund processing failed');
    }
  }

  /**
   * Handle Stripe webhook events
   */
  async handleStripeWebhook(event: Stripe.Event): Promise<void> {
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
          break;
        
        case 'payment_intent.payment_failed':
          await this.handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
          break;
        
        case 'charge.refunded':
          await this.handleChargeRefunded(event.data.object as Stripe.Charge);
          break;
        
        default:
          logger.info('Unhandled webhook event type', { type: event.type });
      }
    } catch (error) {
      logger.error('Failed to handle webhook event', { 
        eventType: event.type,
        error 
      });
      throw error;
    }
  }

  private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    const bookingId = paymentIntent.metadata.bookingId;
    if (!bookingId) return;

    const payment = await prisma.payment.findUnique({
      where: { bookingId }
    });

    if (!payment) return;

    await this.updatePaymentFromIntent(payment.id, paymentIntent);
    
    // Update booking status
    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'CONFIRMED' }
    });

    // Generate receipt
    try {
      const receipt = await receiptService.generateReceipt(payment.id);
      
      // Send receipt email asynchronously
      receiptService.sendReceiptEmail(receipt.id).catch(err => {
        logger.error('Failed to send receipt email from webhook', err);
      });
    } catch (err) {
      logger.error('Failed to generate receipt from webhook', err);
    }

    logger.info('Payment intent succeeded webhook processed', { 
      paymentIntentId: paymentIntent.id,
      bookingId 
    });
  }

  private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
    const bookingId = paymentIntent.metadata.bookingId;
    if (!bookingId) return;

    const payment = await prisma.payment.findUnique({
      where: { bookingId }
    });

    if (!payment) return;

    await this.updatePaymentFromIntent(payment.id, paymentIntent);
    
    logger.info('Payment intent failed webhook processed', { 
      paymentIntentId: paymentIntent.id,
      bookingId 
    });
  }

  private async handleChargeRefunded(charge: Stripe.Charge) {
    if (!charge.payment_intent || typeof charge.payment_intent !== 'string') return;

    const payment = await prisma.payment.findFirst({
      where: { stripePaymentIntentId: charge.payment_intent }
    });

    if (!payment) return;

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'REFUNDED',
        metadata: {
          ...(payment.metadata as any || {}),
          refundedAt: new Date().toISOString(),
          refundAmount: charge.amount_refunded / 100
        }
      }
    });

    logger.info('Charge refunded webhook processed', { 
      chargeId: charge.id,
      paymentId: payment.id 
    });
  }

  private mapStripeStatusToPaymentStatus(stripeStatus: string): PaymentStatus {
    switch (stripeStatus) {
      case 'succeeded':
        return 'COMPLETED';
      case 'processing':
        return 'PROCESSING';
      case 'requires_payment_method':
      case 'requires_confirmation':
      case 'requires_action':
        return 'PENDING';
      case 'canceled':
      case 'failed':
        return 'FAILED';
      default:
        return 'PENDING';
    }
  }
}

export const paymentService = new PaymentService();