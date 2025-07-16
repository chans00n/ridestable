import { customAlphabet } from 'nanoid';

// Custom alphabets for different reference types
const bookingAlphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const confirmationAlphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

// Create nanoid functions with custom alphabets
const generateBookingId = customAlphabet(bookingAlphabet, 6);
const generateConfirmationId = customAlphabet(confirmationAlphabet, 8);

export function generateBookingReference(): string {
  const year = new Date().getFullYear();
  const uniqueId = generateBookingId();
  return `SR-${year}-${uniqueId}`;
}

export function generateConfirmationNumber(): string {
  return `STABLE${generateConfirmationId()}`;
}

export function generateReceiptNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = generateConfirmationId().substring(0, 4);
  return `RCT-${timestamp}-${random}`;
}

export function generateCancellationReference(): string {
  const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const uniqueId = generateBookingId();
  return `CNCL-${date}-${uniqueId}`;
}