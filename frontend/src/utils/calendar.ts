interface CalendarEvent {
  title: string;
  description: string;
  location: string;
  startTime: Date;
  endTime: Date;
  uid?: string;
  organizer?: string;
}

export function generateICSFile(event: CalendarEvent): string {
  const formatDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  };

  const uid = event.uid || `${Date.now()}@stableride.com`;
  const organizer = event.organizer || 'noreply@stableride.com';

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Stable Ride//Booking Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${formatDate(new Date())}`,
    `DTSTART:${formatDate(event.startTime)}`,
    `DTEND:${formatDate(event.endTime)}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}`,
    `LOCATION:${event.location}`,
    `ORGANIZER:mailto:${organizer}`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  return icsContent;
}

export function downloadICSFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function createBookingCalendarEvent(booking: any): CalendarEvent {
  const startTime = new Date(booking.scheduledDateTime);
  const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour duration

  return {
    title: `Stable Ride - ${booking.serviceType.replace(/_/g, ' ')}`,
    description: [
      `Booking Reference: ${booking.confirmation?.bookingReference || booking.id}`,
      `Service Type: ${booking.serviceType.replace(/_/g, ' ')}`,
      `Pickup: ${booking.pickupAddress}`,
      booking.dropoffAddress ? `Dropoff: ${booking.dropoffAddress}` : '',
      `Total Amount: $${booking.totalAmount}`,
      booking.specialInstructions ? `Instructions: ${booking.specialInstructions}` : ''
    ].filter(Boolean).join('\n'),
    location: booking.pickupAddress,
    startTime,
    endTime
  };
}