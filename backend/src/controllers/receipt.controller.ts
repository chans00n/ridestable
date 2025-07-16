import { Request, Response } from 'express';
import { prisma } from '../config/database';
import path from 'path';
import fs from 'fs';
import { ApiError } from '../utils/errors';

export class ReceiptController {
  /**
   * Download PDF receipt
   * GET /api/receipts/:filename
   */
  async downloadReceipt(req: Request, res: Response): Promise<void> {
    try {
      const { filename } = req.params;
      
      // Validate filename format (should be bookingReference-bookingId.pdf)
      if (!filename.match(/^[A-Z0-9]+-[a-f0-9-]+\.pdf$/)) {
        throw new ApiError('Invalid receipt filename', 400);
      }

      // Extract booking reference from filename
      const bookingReference = filename.split('-')[0];

      // Verify the booking exists and belongs to the user (if authenticated)
      if (req.user) {
        const confirmation = await prisma.bookingConfirmation.findUnique({
          where: { bookingReference },
          include: {
            bookings: {
              select: {
                userId: true
              }
            }
          }
        });

        if (!confirmation || confirmation.bookings.userId !== req.user.id) {
          throw new ApiError('Receipt not found or unauthorized', 404);
        }
      }

      // Check if file exists
      const filepath = path.join(process.cwd(), 'uploads', 'receipts', filename);
      if (!fs.existsSync(filepath)) {
        throw new ApiError('Receipt file not found', 404);
      }

      // Set response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      // Stream the file
      const stream = fs.createReadStream(filepath);
      stream.pipe(res);
    } catch (error) {
      if (error instanceof ApiError) {
        res.status(error.statusCode).json({
          status: 'error',
          message: error.message
        });
      } else {
        res.status(500).json({
          status: 'error',
          message: 'Failed to download receipt'
        });
      }
    }
  }

  /**
   * Generate receipt for a booking (authenticated users only)
   * POST /api/bookings/:bookingId/receipt
   */
  async generateReceipt(req: Request, res: Response): Promise<void> {
    try {
      const { bookingId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        throw new ApiError('Authentication required', 401);
      }

      // Get booking with all necessary data
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          user: true,
          confirmation: true,
          enhancements: true,
          payment: true
        }
      });

      if (!booking || booking.userId !== userId) {
        throw new ApiError('Booking not found or unauthorized', 404);
      }

      if (!booking.confirmation) {
        throw new ApiError('Booking confirmation not found', 404);
      }

      // Import the service dynamically to avoid circular dependencies
      const { generatePdfReceipt } = await import('../services/pdf.service');
      
      // Generate the PDF
      const pdfUrl = await generatePdfReceipt(booking, booking.confirmation);

      res.json({
        status: 'success',
        data: {
          url: pdfUrl,
          filename: `${booking.confirmation.bookingReference}-${booking.id}.pdf`
        }
      });
    } catch (error) {
      if (error instanceof ApiError) {
        res.status(error.statusCode).json({
          status: 'error',
          message: error.message
        });
      } else {
        console.error('Generate receipt error:', error);
        res.status(500).json({
          status: 'error',
          message: 'Failed to generate receipt'
        });
      }
    }
  }
}

export const receiptController = new ReceiptController();