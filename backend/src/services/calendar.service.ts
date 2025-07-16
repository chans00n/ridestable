import { Booking, BookingConfirmation } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

interface CalendarEvent {
  title: string;
  description: string;
  location: string;
  startTime: Date;
  endTime: Date;
  uid: string;
  organizer: string;
}

export async function generateCalendarInvite(
  booking: Booking & { user: any },
  confirmation: BookingConfirmation
): Promise<string> {
  const event: CalendarEvent = {
    title: `Stable Ride - ${booking.serviceType.replace('_', ' ')}`,
    description: `Booking Reference: ${confirmation.bookingReference}\n` +
                `Confirmation Number: ${confirmation.confirmationNumber}\n` +
                `Service Type: ${booking.serviceType.replace('_', ' ')}\n` +
                `Pickup: ${booking.pickupAddress}\n` +
                `Dropoff: ${booking.dropoffAddress}\n` +
                `Total Amount: $${booking.totalAmount}`,
    location: booking.pickupAddress,
    startTime: new Date(booking.scheduledDateTime),
    endTime: new Date(new Date(booking.scheduledDateTime).getTime() + 60 * 60 * 1000), // 1 hour duration
    uid: uuidv4(),
    organizer: 'noreply@stableride.com'
  };

  return createICSFile(event);
}

function createICSFile(event: CalendarEvent): string {
  const formatDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  };

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Stable Ride//Booking Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${event.uid}@stableride.com`,
    `DTSTAMP:${formatDate(new Date())}`,
    `DTSTART:${formatDate(event.startTime)}`,
    `DTEND:${formatDate(event.endTime)}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}`,
    `LOCATION:${event.location}`,
    `ORGANIZER:mailto:${event.organizer}`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  // Convert to base64 for email attachment
  return Buffer.from(icsContent).toString('base64');
}