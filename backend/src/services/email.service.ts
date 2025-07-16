import sgMail from '@sendgrid/mail'
import { config } from '../config'
import { logger } from '../config/logger'

sgMail.setApiKey(config.email.sendgridApiKey)

export interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export interface EmailWithAttachmentOptions extends EmailOptions {
  attachments: Array<{
    content: string
    filename: string
    type: string
    disposition: string
  }>
}

export class EmailService {
  static async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const msg = {
        to: options.to,
        from: {
          email: config.email.from,
          name: config.email.fromName,
        },
        subject: options.subject,
        text: options.text || options.html,
        html: options.html,
      }

      await sgMail.send(msg)
      logger.info(`Email sent to ${options.to}`)
    } catch (error) {
      logger.error('Failed to send email:', error)
      throw new Error('Failed to send email')
    }
  }

  static async sendEmailWithAttachment(options: EmailWithAttachmentOptions): Promise<void> {
    try {
      const msg: any = {
        to: options.to,
        from: {
          email: config.email.from,
          name: config.email.fromName,
        },
        subject: options.subject,
        text: options.text || options.html,
        html: options.html,
        attachments: options.attachments
      }

      await sgMail.send(msg)
      logger.info(`Email with attachment sent to ${options.to}`)
    } catch (error) {
      logger.error('Failed to send email with attachment:', error)
      throw new Error('Failed to send email with attachment')
    }
  }

  static async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verificationUrl = `${config.app.url}/auth/verify-email?token=${token}`
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Verify Your Email - Stable Ride</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #0369a1; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f8f9fa; padding: 30px; }
          .button { display: inline-block; background-color: #0284c7; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Stable Ride</h1>
          </div>
          <div class="content">
            <h2>Verify Your Email Address</h2>
            <p>Thank you for registering with Stable Ride. To complete your registration, please verify your email address by clicking the button below:</p>
            <div style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verify Email</a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #0284c7;">${verificationUrl}</p>
            <p>This link will expire in 24 hours.</p>
            <p>If you didn't create an account with Stable Ride, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Stable Ride. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `

    await this.sendEmail({
      to: email,
      subject: 'Verify Your Email - Stable Ride',
      html,
    })
  }

  static async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetUrl = `${config.app.url}/auth/reset-password?token=${token}`
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Reset Your Password - Stable Ride</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #0369a1; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f8f9fa; padding: 30px; }
          .button { display: inline-block; background-color: #0284c7; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Stable Ride</h1>
          </div>
          <div class="content">
            <h2>Reset Your Password</h2>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #0284c7;">${resetUrl}</p>
            <p>This link will expire in 24 hours.</p>
            <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Stable Ride. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `

    await this.sendEmail({
      to: email,
      subject: 'Reset Your Password - Stable Ride',
      html,
    })
  }

  static async sendWelcomeEmail(email: string, firstName: string): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to Stable Ride</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #0369a1; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f8f9fa; padding: 30px; }
          .button { display: inline-block; background-color: #0284c7; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Stable Ride, ${firstName}!</h1>
          </div>
          <div class="content">
            <h2>Your Account is Verified</h2>
            <p>Congratulations! Your email has been verified and your account is now active.</p>
            <p>You can now enjoy all the premium features of Stable Ride:</p>
            <ul>
              <li>Book premium drivers for any occasion</li>
              <li>Schedule rides in advance</li>
              <li>Save your favorite locations</li>
              <li>Track your ride history</li>
            </ul>
            <div style="text-align: center;">
              <a href="${config.app.url}/dashboard" class="button">Go to Dashboard</a>
            </div>
            <p>If you have any questions, feel free to contact our support team.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Stable Ride. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `

    await this.sendEmail({
      to: email,
      subject: 'Welcome to Stable Ride!',
      html,
    })
  }
}