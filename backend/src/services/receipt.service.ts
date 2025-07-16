import { prisma } from '../config/database';
import { logger } from '../config/logger';
import { AppError } from '../middleware/error';
import { EmailService } from './email.service';
import { generatePdfReceiptBuffer } from './pdf.service';
import type { Payment, Receipt, Booking, User } from '@prisma/client';
import { format } from 'date-fns';

interface PaymentWithRelations extends Payment {
  booking: Booking & {
    user: User;
  };
}

export class ReceiptService {
  /**
   * Generate a receipt for a payment
   */
  async generateReceipt(paymentId: string): Promise<Receipt> {
    try {
      // Get payment with all related data
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
          booking: {
            include: {
              user: true
            }
          }
        }
      }) as PaymentWithRelations | null;

      if (!payment) {
        throw new AppError(404, 'Payment not found');
      }

      if (payment.status !== 'COMPLETED') {
        throw new AppError(400, 'Can only generate receipt for completed payments');
      }

      // Check if receipt already exists
      const existingReceipt = await prisma.receipt.findUnique({
        where: { paymentId }
      });

      if (existingReceipt) {
        return existingReceipt;
      }

      // Generate receipt number (format: REC-YYYYMMDD-XXXXX)
      const date = new Date();
      const dateStr = format(date, 'yyyyMMdd');
      const random = Math.random().toString(36).substring(2, 7).toUpperCase();
      const receiptNumber = `REC-${dateStr}-${random}`;

      // Create receipt data
      const receiptData = {
        receiptNumber,
        customerName: `${payment.booking.user.firstName} ${payment.booking.user.lastName}`,
        customerEmail: payment.booking.user.email,
        amount: payment.amount,
        currency: payment.currency,
        paymentMethod: this.formatPaymentMethod(payment.paymentMethodId),
        bookingDetails: {
          id: payment.booking.id,
          pickupDate: payment.booking.scheduledDateTime.toISOString(),
          dropoffDate: null, // Bookings don't have separate dropoff dates
          pickupLocation: payment.booking.pickupAddress,
          dropoffLocation: payment.booking.dropoffAddress,
          serviceType: payment.booking.serviceType,
          status: payment.booking.status
        },
        metadata: {
          stripePaymentIntentId: payment.stripePaymentIntentId,
          paymentDate: payment.createdAt.toISOString(),
          ...(payment.metadata as any || {})
        }
      };

      // Create receipt in database
      const receipt = await prisma.receipt.create({
        data: {
          paymentId,
          receiptNumber,
          receiptData,
          emailSent: false
        }
      });

      // Update payment with receipt URL if available from Stripe
      if (payment.receiptUrl) {
        await prisma.receipt.update({
          where: { id: receipt.id },
          data: {
            receiptData: {
              ...receiptData,
              stripeReceiptUrl: payment.receiptUrl
            }
          }
        });
      }

      logger.info('Generated receipt', { 
        receiptId: receipt.id,
        paymentId,
        receiptNumber 
      });

      return receipt;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to generate receipt', error);
      throw new AppError(500, 'Failed to generate receipt');
    }
  }

  /**
   * Send receipt via email
   */
  async sendReceiptEmail(receiptId: string): Promise<void> {
    try {
      const receipt = await prisma.receipt.findUnique({
        where: { id: receiptId },
        include: {
          payment: {
            include: {
              booking: {
                include: {
                  user: true,
                  confirmation: true,
                  enhancements: true
                }
              }
            }
          }
        }
      });

      if (!receipt || !receipt.payment) {
        throw new AppError(404, 'Receipt or payment not found');
      }

      const { booking } = receipt.payment;
      if (!booking || !booking.confirmation) {
        throw new AppError(404, 'Booking or confirmation not found');
      }

      const receiptData = receipt.receiptData as any;

      // Generate PDF buffer
      const pdfBuffer = await generatePdfReceiptBuffer(booking, booking.confirmation);
      const pdfBase64 = pdfBuffer.toString('base64');

      // Format email content
      const emailHtml = this.generateReceiptEmailHtml(receiptData);
      
      // Send email with PDF attachment
      await EmailService.sendEmailWithAttachment({
        to: receiptData.customerEmail,
        subject: `Your Stable Ride Receipt - ${receiptData.receiptNumber}`,
        html: emailHtml,
        attachments: [{
          content: pdfBase64,
          filename: `receipt-${booking.confirmation.bookingReference}.pdf`,
          type: 'application/pdf',
          disposition: 'attachment'
        }]
      });

      // Update receipt to mark email as sent
      await prisma.receipt.update({
        where: { id: receiptId },
        data: { 
          emailSent: true,
          emailSentAt: new Date()
        }
      });

      logger.info('Receipt email sent with PDF attachment', { 
        receiptId,
        email: receiptData.customerEmail,
        bookingReference: booking.confirmation.bookingReference
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to send receipt email', error);
      throw new AppError(500, 'Failed to send receipt email');
    }
  }

  /**
   * Get receipt by payment ID
   */
  async getReceiptByPaymentId(paymentId: string): Promise<Receipt | null> {
    return await prisma.receipt.findUnique({
      where: { paymentId }
    });
  }

  /**
   * Get receipt by receipt number
   */
  async getReceiptByNumber(receiptNumber: string): Promise<Receipt | null> {
    return await prisma.receipt.findUnique({
      where: { receiptNumber }
    });
  }

  /**
   * Generate receipt PDF and return as buffer
   */
  async generateReceiptPdf(receiptId: string): Promise<Buffer> {
    try {
      const receipt = await prisma.receipt.findUnique({
        where: { id: receiptId },
        include: {
          payment: {
            include: {
              booking: {
                include: {
                  user: true,
                  confirmation: true,
                  enhancements: true
                }
              }
            }
          }
        }
      });

      if (!receipt) {
        throw new AppError(404, 'Receipt not found');
      }

      const { booking } = receipt.payment;
      
      // Generate PDF buffer
      const pdfBuffer = await generatePdfReceiptBuffer(booking, booking.confirmation);
      
      return pdfBuffer;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to generate receipt PDF', error);
      throw new AppError(500, 'Failed to generate receipt PDF');
    }
  }

  /**
   * Format payment method for display
   */
  private formatPaymentMethod(paymentMethodId?: string | null): string {
    if (!paymentMethodId) return 'Card';
    
    // In a real implementation, you might fetch the payment method details
    // from Stripe to get the card brand and last 4 digits
    return 'Card ending in ****';
  }

  /**
   * Generate receipt email HTML
   */
  private generateReceiptEmailHtml(receiptData: any): string {
    const bookingDetails = receiptData.bookingDetails;
    const amount = parseFloat(receiptData.amount).toFixed(2);
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Receipt - ${receiptData.receiptNumber}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #e5e7eb;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      color: #3b82f6;
    }
    .receipt-number {
      color: #6b7280;
      margin-top: 10px;
    }
    .section {
      margin-bottom: 30px;
    }
    .section-title {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 10px;
      color: #1f2937;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #f3f4f6;
    }
    .info-label {
      color: #6b7280;
    }
    .info-value {
      font-weight: 500;
      color: #1f2937;
    }
    .amount-total {
      font-size: 24px;
      font-weight: bold;
      color: #059669;
      text-align: right;
      margin-top: 20px;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      color: #6b7280;
      font-size: 14px;
    }
    .button {
      display: inline-block;
      padding: 10px 20px;
      background-color: #3b82f6;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">🐎 Stable Ride</div>
    <div class="receipt-number">Receipt ${receiptData.receiptNumber}</div>
  </div>

  <div class="section">
    <div class="section-title">Payment Details</div>
    <div class="info-row">
      <span class="info-label">Date</span>
      <span class="info-value">${format(new Date(receiptData.metadata.paymentDate), 'PPP')}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Payment Method</span>
      <span class="info-value">${receiptData.paymentMethod}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Customer</span>
      <span class="info-value">${receiptData.customerName}</span>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Service Details</div>
    <div class="info-row">
      <span class="info-label">Service Type</span>
      <span class="info-value">${bookingDetails.serviceType.replace('_', ' ')}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Pickup Date</span>
      <span class="info-value">${format(new Date(bookingDetails.pickupDate), 'PPP')}</span>
    </div>
    ${bookingDetails.dropoffDate ? `
    <div class="info-row">
      <span class="info-label">Dropoff Date</span>
      <span class="info-value">${format(new Date(bookingDetails.dropoffDate), 'PPP')}</span>
    </div>
    ` : ''}
    <div class="info-row">
      <span class="info-label">Pickup Location</span>
      <span class="info-value">${bookingDetails.pickupLocation}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Dropoff Location</span>
      <span class="info-value">${bookingDetails.dropoffLocation}</span>
    </div>
  </div>

  <div class="amount-total">
    Total Paid: $${amount} ${receiptData.currency.toUpperCase()}
  </div>

  ${receiptData.stripeReceiptUrl ? `
  <div style="text-align: center;">
    <a href="${receiptData.stripeReceiptUrl}" class="button">View Detailed Receipt</a>
  </div>
  ` : ''}

  <div class="footer">
    <p>Thank you for choosing Stable Ride!</p>
    <p>If you have any questions about this receipt, please contact us at support@stableride.com</p>
    <p>© ${new Date().getFullYear()} Stable Ride. All rights reserved.</p>
  </div>
</body>
</html>
    `;
  }
}

export const receiptService = new ReceiptService();