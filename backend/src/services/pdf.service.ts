import { Booking, BookingConfirmation } from '@prisma/client';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { format } from 'date-fns';

export async function generatePdfReceipt(
  booking: Booking & { user: any; enhancements?: any; payment?: any },
  confirmation: BookingConfirmation
): Promise<string> {
  // Create a new PDF document
  const doc = new PDFDocument({
    size: 'A4',
    margin: 50
  });

  // Create uploads directory if it doesn't exist
  const uploadsDir = path.join(process.cwd(), 'uploads', 'receipts');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Generate filename
  const filename = `${confirmation.bookingReference}-${booking.id}.pdf`;
  const filepath = path.join(uploadsDir, filename);

  // Pipe the PDF into a file
  doc.pipe(fs.createWriteStream(filepath));

  // Add company header
  doc.fontSize(24)
     .text('Stable Ride', 50, 50)
     .fontSize(10)
     .text('Premium Transportation Services', 50, 80)
     .moveDown(2);

  // Add receipt title
  doc.fontSize(18)
     .text('Booking Receipt', { align: 'center' })
     .moveDown();

  // Add booking reference info
  doc.fontSize(12)
     .text(`Booking Reference: ${confirmation.bookingReference}`, { underline: true })
     .text(`Confirmation Number: ${confirmation.confirmationNumber}`)
     .text(`Date: ${format(new Date(), 'MMMM d, yyyy')}`)
     .moveDown();

  // Add customer info
  doc.fontSize(14)
     .text('Customer Information', { underline: true })
     .fontSize(11)
     .text(`Name: ${booking.user.firstName} ${booking.user.lastName}`)
     .text(`Email: ${booking.user.email}`)
     .text(`Phone: ${booking.user.phone || 'N/A'}`)
     .moveDown();

  // Add trip details
  doc.fontSize(14)
     .text('Trip Details', { underline: true })
     .fontSize(11)
     .text(`Service Type: ${booking.serviceType.replace(/_/g, ' ')}`)
     .text(`Pickup Date: ${format(new Date(booking.scheduledDateTime), 'EEEE, MMMM d, yyyy')}`)
     .text(`Pickup Time: ${format(new Date(booking.scheduledDateTime), 'h:mm a')}`)
     .text(`Pickup Location: ${booking.pickupAddress}`)
     .text(`Dropoff Location: ${booking.dropoffAddress || 'N/A'}`);

  if (booking.returnDateTime) {
    doc.text(`Return Date: ${format(new Date(booking.returnDateTime), 'EEEE, MMMM d, yyyy')}`)
       .text(`Return Time: ${format(new Date(booking.returnDateTime), 'h:mm a')}`);
  }

  if (booking.durationHours) {
    doc.text(`Duration: ${booking.durationHours} hours`);
  }

  doc.moveDown();

  // Add vehicle and enhancements
  if (booking.enhancements) {
    doc.fontSize(14)
       .text('Enhancements', { underline: true })
       .fontSize(11);

    if (booking.enhancements.vehicleOption) {
      doc.text(`Vehicle: ${booking.enhancements.vehicleOption.name}`);
    }

    if (booking.enhancements.tripProtection) {
      doc.text('✓ Trip Protection');
    }

    if (booking.enhancements.specialRequests) {
      const requests = booking.enhancements.specialRequests;
      if (requests.childSafety) {
        const seats = [];
        if (requests.childSafety.infantSeat > 0) seats.push(`${requests.childSafety.infantSeat} Infant Seat(s)`);
        if (requests.childSafety.toddlerSeat > 0) seats.push(`${requests.childSafety.toddlerSeat} Toddler Seat(s)`);
        if (requests.childSafety.boosterSeat > 0) seats.push(`${requests.childSafety.boosterSeat} Booster Seat(s)`);
        if (seats.length > 0) {
          doc.text(`Child Seats: ${seats.join(', ')}`);
        }
      }
    }

    doc.moveDown();
  }

  // Add pricing breakdown
  doc.fontSize(14)
     .text('Pricing Breakdown', { underline: true })
     .fontSize(11);

  const subtotal = booking.totalAmount - (booking.gratuityAmount || 0);
  doc.text(`Subtotal: $${subtotal.toFixed(2)}`);

  if (booking.gratuityAmount && booking.gratuityAmount > 0) {
    doc.text(`Gratuity: $${booking.gratuityAmount.toFixed(2)}`);
  }

  doc.fontSize(12)
     .text(`Total Amount: $${booking.totalAmount.toFixed(2)}`, { underline: true })
     .moveDown();

  // Add payment status
  doc.fontSize(14)
     .text('Payment Status', { underline: true })
     .fontSize(11)
     .text(`Status: ${booking.payment?.status || 'Pending'}`);

  if (booking.payment?.transactionId) {
    doc.text(`Transaction ID: ${booking.payment.transactionId}`);
  }

  doc.moveDown(2);

  // Add footer
  doc.fontSize(10)
     .fillColor('#666666')
     .text('Thank you for choosing Stable Ride!', { align: 'center' })
     .text('For questions or support, contact us at support@stableride.com', { align: 'center' })
     .text('or call 1-800-STABLE-1', { align: 'center' });

  // Finalize the PDF
  doc.end();

  // In production, upload to S3 or cloud storage and return the URL
  // For now, return local file URL
  const baseUrl = process.env.APP_URL || 'http://localhost:3001';
  return `${baseUrl}/api/receipts/${filename}`;
}

// Function to generate PDF content as buffer (for email attachments)
export async function generatePdfReceiptBuffer(
  booking: Booking & { user: any; enhancements?: any; payment?: any },
  confirmation: BookingConfirmation
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Same content generation as above
    doc.fontSize(24)
       .text('Stable Ride', 50, 50)
       .fontSize(10)
       .text('Premium Transportation Services', 50, 80)
       .moveDown(2);

    doc.fontSize(18)
       .text('Booking Receipt', { align: 'center' })
       .moveDown();

    doc.fontSize(12)
       .text(`Booking Reference: ${confirmation.bookingReference}`, { underline: true })
       .text(`Confirmation Number: ${confirmation.confirmationNumber}`)
       .text(`Date: ${format(new Date(), 'MMMM d, yyyy')}`)
       .moveDown();

    doc.fontSize(14)
       .text('Customer Information', { underline: true })
       .fontSize(11)
       .text(`Name: ${booking.user.firstName} ${booking.user.lastName}`)
       .text(`Email: ${booking.user.email}`)
       .text(`Phone: ${booking.user.phone || 'N/A'}`)
       .moveDown();

    doc.fontSize(14)
       .text('Trip Details', { underline: true })
       .fontSize(11)
       .text(`Service Type: ${booking.serviceType.replace(/_/g, ' ')}`)
       .text(`Pickup Date: ${format(new Date(booking.scheduledDateTime), 'EEEE, MMMM d, yyyy')}`)
       .text(`Pickup Time: ${format(new Date(booking.scheduledDateTime), 'h:mm a')}`)
       .text(`Pickup Location: ${booking.pickupAddress}`)
       .text(`Dropoff Location: ${booking.dropoffAddress || 'N/A'}`);

    if (booking.returnDateTime) {
      doc.text(`Return Date: ${format(new Date(booking.returnDateTime), 'EEEE, MMMM d, yyyy')}`)
         .text(`Return Time: ${format(new Date(booking.returnDateTime), 'h:mm a')}`);
    }

    if (booking.durationHours) {
      doc.text(`Duration: ${booking.durationHours} hours`);
    }

    doc.moveDown();

    const subtotal = booking.totalAmount - (booking.gratuityAmount || 0);
    doc.fontSize(14)
       .text('Pricing Breakdown', { underline: true })
       .fontSize(11)
       .text(`Subtotal: $${subtotal.toFixed(2)}`);

    if (booking.gratuityAmount && booking.gratuityAmount > 0) {
      doc.text(`Gratuity: $${booking.gratuityAmount.toFixed(2)}`);
    }

    doc.fontSize(12)
       .text(`Total Amount: $${booking.totalAmount.toFixed(2)}`, { underline: true })
       .moveDown(2);

    doc.fontSize(10)
       .fillColor('#666666')
       .text('Thank you for choosing Stable Ride!', { align: 'center' })
       .text('For questions or support, contact us at support@stableride.com', { align: 'center' })
       .text('or call 1-800-STABLE-1', { align: 'center' });

    doc.end();
  });
}