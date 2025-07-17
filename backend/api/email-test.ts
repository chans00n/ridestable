import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
  const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@stableride.com';
  const REPLY_TO_EMAIL = process.env.REPLY_TO_EMAIL || 'support@stableride.com';
  
  // Check configuration
  const config = {
    hasSendGridKey: !!SENDGRID_API_KEY,
    keyLength: SENDGRID_API_KEY?.length || 0,
    fromEmail: FROM_EMAIL,
    replyToEmail: REPLY_TO_EMAIL,
    keyPrefix: SENDGRID_API_KEY?.substring(0, 7) || 'not-set'
  };
  
  // Test if we can send a test email
  let testResult = 'not-tested';
  
  if (req.method === 'POST' && req.body?.testEmail) {
    try {
      const sgMail = require('@sendgrid/mail');
      sgMail.setApiKey(SENDGRID_API_KEY);
      
      await sgMail.send({
        to: req.body.testEmail,
        from: FROM_EMAIL,
        subject: 'Stable Ride Email Test',
        text: 'This is a test email to verify email configuration.',
        html: '<p>This is a test email to verify email configuration.</p>'
      });
      
      testResult = 'success';
    } catch (error: any) {
      testResult = `failed: ${error.message}`;
    }
  }
  
  res.status(200).json({
    status: 'ok',
    emailConfiguration: config,
    testResult,
    instructions: {
      toTest: 'POST to this endpoint with { "testEmail": "your-email@example.com" }',
      checkEnvVars: [
        'SENDGRID_API_KEY - Should be set to your SendGrid API key',
        'FROM_EMAIL - Should be a verified sender in SendGrid',
        'REPLY_TO_EMAIL - Reply-to address for emails'
      ]
    },
    services: {
      emailService: 'Used for receipts (working)',
      notificationService: 'Used for booking/payment confirmations (possibly failing)'
    },
    timestamp: new Date().toISOString()
  });
}