# Automated Reminder System

## Overview

The Stable Ride automated reminder system sends notifications to users about their upcoming trips. The system runs as a background service using cron jobs and supports both email and SMS notifications.

## Features

### 1. Automatic Pickup Reminders
- Sends reminders 30 minutes before scheduled pickup time
- Includes booking details, driver information (if available)
- Sends via email and SMS (based on user preferences)

### 2. Scheduled Tasks
The system runs several scheduled tasks:

- **Pickup Reminders**: Every 5 minutes, checks for bookings needing reminders
- **Daily Cleanup**: At 2 AM, cleans up old notifications and archives completed bookings
- **Quote Cleanup**: Every 30 minutes, removes expired quotes
- **Notification Retry**: Every 15 minutes, retries failed notifications (max 3 attempts)
- **Hourly Stats**: Collects booking statistics every hour

### 3. Custom Reminders
Admins can schedule custom reminders for specific bookings at any time.

## Configuration

No additional configuration needed - the reminder system starts automatically with the server.

## User Preferences

Users can control reminder notifications through their notification preferences:
- Email reminders (enabled by default)
- SMS reminders (enabled by default if phone number provided)

## Admin Endpoints

### Check System Status
```
GET /api/admin/scheduled-tasks/status
Authorization: Bearer {admin-token}
```

### Get Reminder Statistics
```
GET /api/admin/reminders/stats?days=7
Authorization: Bearer {admin-token}
```

### Schedule Test Reminder
```
POST /api/admin/reminders/test/{bookingId}
Authorization: Bearer {admin-token}
Content-Type: application/json

{
  "minutesFromNow": 1
}
```

## SMS Requirements

For SMS reminders to work:
1. Twilio credentials must be configured in environment variables
2. User must have a valid phone number
3. User must have SMS notifications enabled

## How It Works

1. **Cron Job**: Runs every 5 minutes
2. **Query**: Finds confirmed bookings with pickup time 30-35 minutes from now
3. **Check**: Ensures no reminder was sent in the last hour
4. **Send**: Sends email and/or SMS based on user preferences
5. **Track**: Records notification in database

## Monitoring

Monitor the reminder system through:
- Application logs (search for "reminder" or "scheduled task")
- Admin API endpoints
- Database notification records

## Troubleshooting

### Reminders Not Sending
1. Check server logs for errors
2. Verify booking status is CONFIRMED
3. Check user notification preferences
4. Ensure pickup time is correctly set

### SMS Not Working
1. Verify Twilio credentials in environment
2. Check phone number format (must include country code)
3. Review Twilio logs for errors

### Performance Issues
1. Check database query performance
2. Monitor cron job execution time
3. Review notification queue size

## Database Impact

The reminder system queries the database every 5 minutes. Indexes are in place on:
- `booking.status`
- `booking.scheduledDateTime`
- `notification.type`
- `notification.sentAt`

This ensures minimal performance impact even with large numbers of bookings.