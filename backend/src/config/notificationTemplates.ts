export const notificationTemplates = {
  payment_confirmation: {
    subject: 'Payment Confirmed - {{bookingReference}}',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Payment Confirmation</title>
  <style>
    body { font-family: Arial, sans-serif; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #10b981; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9fafb; }
    .details { background-color: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
    .detail-row { display: flex; justify-content: space-between; margin: 10px 0; }
    .button { display: inline-block; background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Payment Confirmed!</h1>
      <p>Your booking is now confirmed</p>
    </div>
    
    <div class="content">
      <p>Dear {{customerName}},</p>
      <p>Your payment has been successfully processed. Your booking is now confirmed and ready.</p>
      
      <div class="details">
        <h2>Payment Details</h2>
        <div class="detail-row">
          <strong>Booking Reference:</strong>
          <span>{{bookingReference}}</span>
        </div>
        <div class="detail-row">
          <strong>Total Amount:</strong>
          <span>\${{totalAmount}}</span>
        </div>
        <div class="detail-row">
          <strong>Payment Method:</strong>
          <span>{{paymentMethod}}</span>
        </div>
        <div class="detail-row">
          <strong>Pickup Date:</strong>
          <span>{{pickupDate}}</span>
        </div>
        <div class="detail-row">
          <strong>Pickup Time:</strong>
          <span>{{pickupTime}}</span>
        </div>
      </div>
      
      <p style="text-align: center;">
        <a href="{{receiptUrl}}" class="button">View Receipt</a>
      </p>
    </div>
    
    <div class="footer">
      <p>Thank you for choosing Stable Ride!</p>
      <p>© 2024 Stable Ride. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `,
    text: `Payment Confirmed - {{bookingReference}}
    
Dear {{customerName}},

Your payment has been successfully processed. Your booking is now confirmed and ready.

Payment Details:
- Booking Reference: {{bookingReference}}
- Total Amount: \${{totalAmount}}
- Payment Method: {{paymentMethod}}
- Pickup Date: {{pickupDate}}
- Pickup Time: {{pickupTime}}

Thank you for choosing Stable Ride!`
  },
  
  payment_receipt: {
    subject: 'Payment Receipt - {{bookingReference}}',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Payment Receipt</title>
  <style>
    body { font-family: Arial, sans-serif; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #6b7280; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9fafb; }
    .details { background-color: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
    .detail-row { display: flex; justify-content: space-between; margin: 10px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Payment Receipt</h1>
      <p>Transaction ID: {{transactionId}}</p>
    </div>
    
    <div class="content">
      <p>Dear {{customerName}},</p>
      <p>Please find attached your payment receipt for the booking below.</p>
      
      <div class="details">
        <h2>Receipt Details</h2>
        <div class="detail-row">
          <strong>Booking Reference:</strong>
          <span>{{bookingReference}}</span>
        </div>
        <div class="detail-row">
          <strong>Service Type:</strong>
          <span>{{serviceType}}</span>
        </div>
        <div class="detail-row">
          <strong>Total Amount:</strong>
          <span>\${{totalAmount}}</span>
        </div>
        <div class="detail-row">
          <strong>Pickup:</strong>
          <span>{{pickupDate}} at {{pickupTime}}</span>
        </div>
        <div class="detail-row">
          <strong>From:</strong>
          <span>{{pickupAddress}}</span>
        </div>
        <div class="detail-row">
          <strong>To:</strong>
          <span>{{dropoffAddress}}</span>
        </div>
      </div>
      
      <p><em>A PDF receipt is attached to this email for your records.</em></p>
    </div>
    
    <div class="footer">
      <p>Thank you for choosing Stable Ride!</p>
      <p>© 2024 Stable Ride. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `,
    text: `Payment Receipt - {{bookingReference}}
    
Dear {{customerName}},

Please find attached your payment receipt for the booking below.

Receipt Details:
- Booking Reference: {{bookingReference}}
- Service Type: {{serviceType}}
- Total Amount: \${{totalAmount}}
- Pickup: {{pickupDate}} at {{pickupTime}}
- From: {{pickupAddress}}
- To: {{dropoffAddress}}
- Transaction ID: {{transactionId}}

A PDF receipt is attached to this email for your records.

Thank you for choosing Stable Ride!`
  },
  
  booking_confirmation: {
    subject: 'Booking Created - Payment Required - {{bookingReference}}',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Booking Confirmation</title>
  <style>
    body { font-family: Arial, sans-serif; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #1e40af; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9fafb; }
    .details { background-color: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
    .detail-row { display: flex; justify-content: space-between; margin: 10px 0; }
    .button { display: inline-block; background-color: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Booking Created - Payment Required</h1>
      <p>Your booking has been created and is awaiting payment</p>
    </div>
    
    <div class="content">
      <p>Dear {{customerName}},</p>
      <p>Thank you for choosing Stable Ride. Your booking has been created with the following details. <strong>Please complete payment to confirm your booking:</strong></p>
      
      <div class="details">
        <h2>Booking Details</h2>
        <div class="detail-row">
          <strong>Booking Reference:</strong>
          <span>{{bookingReference}}</span>
        </div>
        <div class="detail-row">
          <strong>Confirmation Number:</strong>
          <span>{{confirmationNumber}}</span>
        </div>
        <div class="detail-row">
          <strong>Service Type:</strong>
          <span>{{serviceType}}</span>
        </div>
        <div class="detail-row">
          <strong>Pickup Date:</strong>
          <span>{{pickupDate}}</span>
        </div>
        <div class="detail-row">
          <strong>Pickup Time:</strong>
          <span>{{pickupTime}}</span>
        </div>
        <div class="detail-row">
          <strong>Pickup Location:</strong>
          <span>{{pickupAddress}}</span>
        </div>
        <div class="detail-row">
          <strong>Dropoff Location:</strong>
          <span>{{dropoffAddress}}</span>
        </div>
        <div class="detail-row">
          <strong>Total Amount:</strong>
          <span>${'{{totalAmount}}'}</span>
        </div>
      </div>
      
      <p style="text-align: center; margin: 30px 0;">
        <a href="{{paymentUrl}}" class="button" style="background-color: #dc2626;">Complete Payment</a>
      </p>
      
      <p style="text-align: center; color: #dc2626; font-weight: bold;">
        ⚠️ Your booking is not confirmed until payment is completed
      </p>
      
      <h3>Important Information</h3>
      <ul>
        <li>You can modify or cancel your booking up to 2 hours before pickup</li>
        <li>Your driver details will be sent 30 minutes before pickup</li>
        <li>Please be ready at your pickup location on time</li>
      </ul>
      
      <p>If you have any questions, please contact our support team at support@stableride.com</p>
    </div>
    
    <div class="footer">
      <p>&copy; 2024 Stable Ride. All rights reserved.</p>
      <p>This is an automated confirmation email. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
    `,
    text: `
Booking Created - Payment Required

Dear {{customerName}},

Thank you for choosing Stable Ride. Your booking has been created with the following details. Please complete payment to confirm your booking:

Booking Reference: {{bookingReference}}
Confirmation Number: {{confirmationNumber}}
Service Type: {{serviceType}}
Pickup Date: {{pickupDate}}
Pickup Time: {{pickupTime}}
Pickup Location: {{pickupAddress}}
Dropoff Location: {{dropoffAddress}}
Total Amount: ${'{{totalAmount}}'}

Important Information:
- You can modify or cancel your booking up to 2 hours before pickup
- Your driver details will be sent 30 minutes before pickup
- Please be ready at your pickup location on time

If you have any questions, please contact our support team at support@stableride.com

© 2024 Stable Ride. All rights reserved.
    `
  },
  
  booking_modification: {
    subject: 'Booking Modified - {{bookingReference}}',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Booking Modification</title>
  <style>
    body { font-family: Arial, sans-serif; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #f59e0b; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9fafb; }
    .changes { background-color: #fef3c7; padding: 15px; margin: 20px 0; border-radius: 8px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Booking Modified</h1>
      <p>Your booking has been successfully updated</p>
    </div>
    
    <div class="content">
      <p>Dear {{customerName}},</p>
      <p>Your booking {{bookingReference}} has been modified as requested.</p>
      
      <div class="changes">
        <h3>Changes Made:</h3>
        {{changes}}
      </div>
      
      <p><strong>Price Difference:</strong> ${'{{priceDifference}}'}</p>
      <p><strong>New Total:</strong> ${'{{newTotal}}'}</p>
      
      <p>A new confirmation email with updated details will be sent shortly.</p>
    </div>
    
    <div class="footer">
      <p>&copy; 2024 Stable Ride. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `,
    text: `
Booking Modified

Dear {{customerName}},

Your booking {{bookingReference}} has been modified as requested.

Changes Made:
{{changes}}

Price Difference: ${'{{priceDifference}}'}
New Total: ${'{{newTotal}}'}

A new confirmation email with updated details will be sent shortly.

© 2024 Stable Ride. All rights reserved.
    `
  },
  
  booking_cancellation: {
    subject: 'Booking Cancelled - {{bookingReference}}',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Booking Cancellation</title>
  <style>
    body { font-family: Arial, sans-serif; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9fafb; }
    .refund-info { background-color: #d1fae5; padding: 15px; margin: 20px 0; border-radius: 8px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Booking Cancelled</h1>
      <p>Your booking has been cancelled</p>
    </div>
    
    <div class="content">
      <p>Dear {{customerName}},</p>
      <p>Your booking {{bookingReference}} has been cancelled.</p>
      
      <p><strong>Cancellation Reason:</strong> {{cancellationReason}}</p>
      
      <div class="refund-info">
        <h3>Refund Information</h3>
        <p><strong>Refund Amount:</strong> ${'{{refundAmount}}'}</p>
        <p><strong>Refund Status:</strong> {{refundStatus}}</p>
        <p>Refunds typically process within 5-7 business days.</p>
      </div>
      
      <p>We're sorry to see you cancel. If you need to book another ride, we're here to help.</p>
    </div>
    
    <div class="footer">
      <p>&copy; 2024 Stable Ride. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `,
    text: `
Booking Cancelled

Dear {{customerName}},

Your booking {{bookingReference}} has been cancelled.

Cancellation Reason: {{cancellationReason}}

Refund Information:
Refund Amount: ${'{{refundAmount}}'}
Refund Status: {{refundStatus}}
Refunds typically process within 5-7 business days.

We're sorry to see you cancel. If you need to book another ride, we're here to help.

© 2024 Stable Ride. All rights reserved.
    `
  },
  
  pickup_reminder: {
    subject: 'Pickup Reminder - Your ride in 30 minutes',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Pickup Reminder</title>
  <style>
    body { font-family: Arial, sans-serif; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #10b981; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9fafb; }
    .driver-info { background-color: white; padding: 20px; margin: 20px 0; border-radius: 8px; border: 2px solid #10b981; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Your Ride is Coming!</h1>
      <p>Your driver will arrive in 30 minutes</p>
    </div>
    
    <div class="content">
      <p>Dear {{customerName}},</p>
      <p>This is a reminder that your ride is scheduled for pickup at <strong>{{pickupTime}}</strong>.</p>
      
      <div class="driver-info">
        <h3>Driver Information</h3>
        <p><strong>Driver Name:</strong> {{driverName}}</p>
        <p><strong>Driver Phone:</strong> {{driverPhone}}</p>
      </div>
      
      <p><strong>Pickup Location:</strong> {{pickupAddress}}</p>
      
      <p>Please be ready at your pickup location. Your driver will wait up to 5 minutes.</p>
      
      <p>Have a safe trip!</p>
    </div>
    
    <div class="footer">
      <p>&copy; 2024 Stable Ride. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `,
    text: `
Your Ride is Coming!

Dear {{customerName}},

This is a reminder that your ride is scheduled for pickup at {{pickupTime}}.

Driver Information:
Driver Name: {{driverName}}
Driver Phone: {{driverPhone}}

Pickup Location: {{pickupAddress}}

Please be ready at your pickup location. Your driver will wait up to 5 minutes.

Have a safe trip!

© 2024 Stable Ride. All rights reserved.
    `
  }
};