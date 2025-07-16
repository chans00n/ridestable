// Temporary patch for missing sendBookingNotification method

export async function sendBookingNotification(userId: string, bookingId: string, status: string): Promise<void> {
  console.log(`[Notification] Would send ${status} notification to user ${userId} for booking ${bookingId}`);
  
  // This is a temporary stub to prevent 500 errors
  // In production, this should:
  // 1. Look up user preferences for notifications
  // 2. Send appropriate SMS/email based on the status
  // 3. Log the notification in the database
  
  // For now, just log and return success
  return Promise.resolve();
}