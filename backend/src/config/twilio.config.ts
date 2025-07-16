import { config } from './index';

export const twilioConfig = {
  accountSid: process.env.TWILIO_ACCOUNT_SID || '',
  authToken: process.env.TWILIO_AUTH_TOKEN || '',
  phoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
  messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID || '',
};

// Validate Twilio configuration
export const isTwilioConfigured = (): boolean => {
  return !!(
    twilioConfig.accountSid &&
    twilioConfig.authToken &&
    (twilioConfig.phoneNumber || twilioConfig.messagingServiceSid)
  );
};