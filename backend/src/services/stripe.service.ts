import Stripe from 'stripe';
import { stripeConfig, stripeClientConfig, validateStripeConfig } from '../config/stripe.config';
import { prisma } from '../config/database';
import { logger } from '../config/logger';
import { AppError } from '../middleware/error';

export class StripeService {
  private stripe: Stripe;

  constructor() {
    validateStripeConfig();
    this.stripe = new Stripe(stripeConfig.secretKey, stripeClientConfig);
  }

  /**
   * Create or retrieve a Stripe customer for a user
   */
  async createOrRetrieveCustomer(userId: string): Promise<Stripe.Customer> {
    try {
      // Check if user already has a Stripe customer ID
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { 
          id: true, 
          email: true, 
          firstName: true, 
          lastName: true, 
          stripeCustomerId: true,
          phone: true 
        }
      });

      if (!user) {
        throw new AppError(404, 'User not found');
      }

      // If customer already exists, retrieve it
      if (user.stripeCustomerId) {
        try {
          const customer = await this.stripe.customers.retrieve(user.stripeCustomerId);
          if (!customer.deleted) {
            return customer as Stripe.Customer;
          }
        } catch (error) {
          logger.warn('Failed to retrieve existing customer, creating new one', { 
            userId, 
            stripeCustomerId: user.stripeCustomerId 
          });
        }
      }

      // Create new customer
      const customer = await this.stripe.customers.create({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        phone: user.phone || undefined,
        metadata: {
          userId: user.id,
        }
      });

      // Update user with Stripe customer ID
      await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customer.id }
      });

      logger.info('Created Stripe customer', { userId, customerId: customer.id });
      return customer;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to create/retrieve Stripe customer', error);
      throw new AppError(500, 'Failed to process customer information');
    }
  }

  /**
   * Create a payment intent for a booking
   */
  async createPaymentIntent(params: {
    amount: number;
    customerId: string;
    bookingId: string;
    paymentMethodId?: string;
    metadata?: Record<string, string>;
  }): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
        amount: Math.round(params.amount * 100), // Convert to cents
        currency: stripeConfig.currency,
        customer: params.customerId,
        capture_method: stripeConfig.captureMethod,
        payment_method_types: stripeConfig.paymentMethods,
        metadata: {
          bookingId: params.bookingId,
          ...params.metadata
        }
      };

      if (params.paymentMethodId) {
        paymentIntentParams.payment_method = params.paymentMethodId;
      }

      // Use booking ID as idempotency key to prevent duplicate payments
      const idempotencyKey = `payment_intent_${params.bookingId}_${params.amount}`;

      const paymentIntent = await this.stripe.paymentIntents.create({
        ...paymentIntentParams,
        expand: ['latest_charge']
      }, {
        idempotencyKey
      });
      
      logger.info('Created payment intent', { 
        paymentIntentId: paymentIntent.id,
        amount: params.amount,
        bookingId: params.bookingId,
        idempotencyKey,
        hasClientSecret: !!paymentIntent.client_secret
      });

      return paymentIntent;
    } catch (error: any) {
      // If we get an idempotency error, try to retrieve the existing payment intent
      if (error.type === 'idempotency_error' && error.raw?.payment_intent) {
        logger.info('Retrieved existing payment intent from idempotency error', {
          paymentIntentId: error.raw.payment_intent,
          bookingId: params.bookingId
        });
        return await this.stripe.paymentIntents.retrieve(error.raw.payment_intent, {
          expand: ['latest_charge']
        });
      }
      
      logger.error('Failed to create payment intent', error);
      throw new AppError(500, 'Failed to initialize payment');
    }
  }

  /**
   * Confirm a payment intent
   */
  async confirmPaymentIntent(
    paymentIntentId: string, 
    paymentMethodId?: string
  ): Promise<Stripe.PaymentIntent> {
    try {
      const params: Stripe.PaymentIntentConfirmParams = {};
      
      if (paymentMethodId) {
        params.payment_method = paymentMethodId;
      }

      const paymentIntent = await this.stripe.paymentIntents.confirm(
        paymentIntentId,
        {
          ...params,
          expand: ['latest_charge']
        }
      );

      logger.info('Confirmed payment intent', { 
        paymentIntentId,
        status: paymentIntent.status 
      });

      return paymentIntent;
    } catch (error: any) {
      logger.error('Failed to confirm payment intent', error);
      
      if (error.type === 'StripeCardError') {
        throw new AppError(400, error.message);
      }
      
      throw new AppError(500, 'Payment confirmation failed');
    }
  }

  /**
   * Attach a payment method to a customer
   */
  async attachPaymentMethod(
    paymentMethodId: string,
    customerId: string
  ): Promise<Stripe.PaymentMethod> {
    try {
      const paymentMethod = await this.stripe.paymentMethods.attach(
        paymentMethodId,
        { customer: customerId }
      );

      logger.info('Attached payment method to customer', { 
        paymentMethodId,
        customerId 
      });

      return paymentMethod;
    } catch (error) {
      logger.error('Failed to attach payment method', error);
      throw new AppError(500, 'Failed to save payment method');
    }
  }

  /**
   * List customer's payment methods
   */
  async listPaymentMethods(customerId: string): Promise<Stripe.PaymentMethod[]> {
    try {
      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: customerId,
        type: 'card'
      });

      return paymentMethods.data;
    } catch (error) {
      logger.error('Failed to list payment methods', error);
      throw new AppError(500, 'Failed to retrieve payment methods');
    }
  }

  /**
   * Detach a payment method from a customer
   */
  async detachPaymentMethod(paymentMethodId: string): Promise<void> {
    try {
      await this.stripe.paymentMethods.detach(paymentMethodId);
      
      logger.info('Detached payment method', { paymentMethodId });
    } catch (error) {
      logger.error('Failed to detach payment method', error);
      throw new AppError(500, 'Failed to remove payment method');
    }
  }

  /**
   * Set a default payment method for a customer
   */
  async setDefaultPaymentMethod(
    customerId: string,
    paymentMethodId: string
  ): Promise<void> {
    try {
      await this.stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId
        }
      });

      logger.info('Set default payment method', { 
        customerId,
        paymentMethodId 
      });
    } catch (error) {
      logger.error('Failed to set default payment method', error);
      throw new AppError(500, 'Failed to update default payment method');
    }
  }

  /**
   * Create a refund for a payment
   */
  async createRefund(params: {
    paymentIntentId: string;
    amount?: number; // In dollars, will be converted to cents
    reason?: Stripe.RefundCreateParams.Reason;
    metadata?: Record<string, string>;
  }): Promise<Stripe.Refund> {
    try {
      const refundParams: Stripe.RefundCreateParams = {
        payment_intent: params.paymentIntentId,
        reason: params.reason || 'requested_by_customer',
        metadata: params.metadata
      };

      if (params.amount) {
        refundParams.amount = Math.round(params.amount * 100); // Convert to cents
      }

      const refund = await this.stripe.refunds.create(refundParams);
      
      logger.info('Created refund', { 
        refundId: refund.id,
        paymentIntentId: params.paymentIntentId,
        amount: params.amount 
      });

      return refund;
    } catch (error) {
      logger.error('Failed to create refund', error);
      throw new AppError(500, 'Failed to process refund');
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(
    payload: string | Buffer,
    signature: string
  ): Stripe.Event {
    try {
      return this.stripe.webhooks.constructEvent(
        payload,
        signature,
        stripeConfig.webhookSecret
      );
    } catch (error) {
      logger.error('Invalid webhook signature', error);
      throw new AppError(400, 'Invalid webhook signature');
    }
  }

  /**
   * Get payment intent details
   */
  async retrievePaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    try {
      return await this.stripe.paymentIntents.retrieve(paymentIntentId, {
        expand: ['latest_charge']
      });
    } catch (error) {
      logger.error('Failed to retrieve payment intent', error);
      throw new AppError(500, 'Failed to retrieve payment details');
    }
  }
}

export const stripeService = new StripeService();