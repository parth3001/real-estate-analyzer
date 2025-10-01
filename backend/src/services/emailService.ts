import { Resend } from 'resend';
import { logger } from '../utils/logger';

export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
}

export class EmailService {
  private resend: Resend | null = null;
  private FROM_EMAIL = 'REanalyzr <admin@reanalyzr.com>';
  private FRONTEND_URL: string;

  constructor() {
    this.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

    if (process.env.RESEND_API_KEY) {
      this.resend = new Resend(process.env.RESEND_API_KEY);
      logger.info('[EmailService] Resend client initialized successfully');
    } else {
      logger.warn('[EmailService] RESEND_API_KEY not configured - emails will not be sent');
    }
  }

  /**
   * Send email verification email
   */
  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verificationUrl = `${this.FRONTEND_URL}/verify-email?token=${token}`;

    const template = this.getVerificationEmailTemplate(verificationUrl);

    await this.sendEmail({
      to: email,
      subject: 'Verify your REanalyzr account',
      html: template
    });

    logger.info(`[EmailService] Verification email sent to: ${email}`);
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetUrl = `${this.FRONTEND_URL}/reset-password?token=${token}`;

    const template = this.getPasswordResetEmailTemplate(resetUrl);

    await this.sendEmail({
      to: email,
      subject: 'Reset your REanalyzr password',
      html: template
    });

    logger.info(`[EmailService] Password reset email sent to: ${email}`);
  }

  /**
   * Send welcome email after successful verification
   */
  async sendWelcomeEmail(email: string, firstName: string): Promise<void> {
    const template = this.getWelcomeEmailTemplate(firstName);

    await this.sendEmail({
      to: email,
      subject: 'Welcome to REanalyzr! 🎉',
      html: template
    });

    logger.info(`[EmailService] Welcome email sent to: ${email}`);
  }

  /**
   * Core email sending method
   */
  private async sendEmail(template: EmailTemplate): Promise<void> {
    try {
      if (!this.resend) {
        logger.warn(`[EmailService] Email not sent - RESEND_API_KEY not configured. Would send to: ${template.to}`);
        return;
      }

      await this.resend.emails.send({
        from: this.FROM_EMAIL,
        to: template.to,
        subject: template.subject,
        html: template.html
      });

      logger.info(`[EmailService] Email sent successfully to: ${template.to}`);
    } catch (error) {
      logger.error(`[EmailService] Failed to send email to ${template.to}:`, error);
      throw new Error('Failed to send email');
    }
  }

  /**
   * Email verification template
   */
  private getVerificationEmailTemplate(verificationUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify your REanalyzr account</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif; margin: 0; padding: 0; background-color: #ffffff; }
          .container { max-width: 600px; margin: 40px auto; background-color: white; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); }
          .header { background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%); padding: 48px 40px 32px; text-align: center; }
          .logo { color: white; font-size: 42px; font-weight: 700; margin: 0; letter-spacing: -1.5px; }
          .tagline { color: rgba(255, 255, 255, 0.7); font-size: 12px; font-weight: 500; letter-spacing: 3px; margin: 12px 0 0; text-transform: uppercase; }
          .content { padding: 48px 40px; }
          .button { display: inline-block; background: #0a0a0a; color: white; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 600; font-size: 16px; margin: 24px 0; transition: all 0.2s; }
          .button:hover { transform: translateY(-2px); box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.2); }
          .footer { padding: 32px 40px; background-color: #f9fafb; color: #6b7280; font-size: 14px; text-align: center; border-top: 1px solid #e5e7eb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="logo">REanalyzr</h1>
            <p class="tagline">Email Verification</p>
          </div>

          <div class="content">
            <h2 style="color: #0a0a0a; margin-top: 0; font-size: 28px; font-weight: 600;">Welcome to REanalyzr!</h2>
            <p style="color: #374151; line-height: 1.6; font-size: 16px;">
              Thank you for signing up for REanalyzr. To complete your registration and start analyzing properties,
              please verify your email address by clicking the button below.
            </p>

            <div style="text-align: center; margin: 32px 0;">
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </div>

            <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin-top: 32px;">
              This verification link will expire in 24 hours. If you didn't create an account with REanalyzr,
              you can safely ignore this email.
            </p>

            <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${verificationUrl}" style="color: #0a0a0a; word-break: break-all; font-size: 13px;">${verificationUrl}</a>
            </p>
          </div>

          <div class="footer">
            <p style="margin: 0;">© 2025 REanalyzr. Professional Property Investment Analysis.</p>
            <p style="margin: 8px 0 0; font-size: 12px; color: #9ca3af;">Intelligent Real Estate Investment Platform</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Password reset email template
   */
  private getPasswordResetEmailTemplate(resetUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset your REanalyzr password</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif; margin: 0; padding: 0; background-color: #ffffff; }
          .container { max-width: 600px; margin: 40px auto; background-color: white; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); }
          .header { background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%); padding: 48px 40px 32px; text-align: center; }
          .logo { color: white; font-size: 42px; font-weight: 700; margin: 0; letter-spacing: -1.5px; }
          .tagline { color: rgba(255, 255, 255, 0.7); font-size: 12px; font-weight: 500; letter-spacing: 3px; margin: 12px 0 0; text-transform: uppercase; }
          .content { padding: 48px 40px; }
          .button { display: inline-block; background: #0a0a0a; color: white; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 600; font-size: 16px; margin: 24px 0; transition: all 0.2s; }
          .button:hover { transform: translateY(-2px); box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.2); }
          .footer { padding: 32px 40px; background-color: #f9fafb; color: #6b7280; font-size: 14px; text-align: center; border-top: 1px solid #e5e7eb; }
          .warning { background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; margin: 32px 0; border-radius: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="logo">REanalyzr</h1>
            <p class="tagline">Password Reset</p>
          </div>

          <div class="content">
            <h2 style="color: #0a0a0a; margin-top: 0; font-size: 28px; font-weight: 600;">Reset Your Password</h2>
            <p style="color: #374151; line-height: 1.6; font-size: 16px;">
              We received a request to reset your password for your REanalyzr account.
              Click the button below to create a new password.
            </p>

            <div style="text-align: center; margin: 32px 0;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>

            <div class="warning">
              <p style="color: #991b1b; margin: 0; font-weight: 600; font-size: 15px;">⚠️ Important Security Notice</p>
              <ul style="color: #dc2626; margin: 12px 0 0; padding-left: 20px; line-height: 1.6;">
                <li>This reset link expires in 1 hour for security</li>
                <li>If you didn't request this reset, please ignore this email</li>
                <li>Your password won't change until you complete the reset process</li>
              </ul>
            </div>

            <p style="color: #6b7280; font-size: 14px; margin-top: 32px;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${resetUrl}" style="color: #0a0a0a; word-break: break-all; font-size: 13px;">${resetUrl}</a>
            </p>
          </div>

          <div class="footer">
            <p style="margin: 0;">© 2025 REanalyzr. Professional Property Investment Analysis.</p>
            <p style="margin: 8px 0 0; font-size: 12px; color: #9ca3af;">Intelligent Real Estate Investment Platform</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Welcome email template
   */
  private getWelcomeEmailTemplate(firstName: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to REanalyzr!</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif; margin: 0; padding: 0; background-color: #ffffff; }
          .container { max-width: 600px; margin: 40px auto; background-color: white; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); }
          .header { background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%); padding: 48px 40px 32px; text-align: center; }
          .logo { color: white; font-size: 42px; font-weight: 700; margin: 0; letter-spacing: -1.5px; }
          .tagline { color: rgba(255, 255, 255, 0.7); font-size: 12px; font-weight: 500; letter-spacing: 3px; margin: 12px 0 0; text-transform: uppercase; }
          .content { padding: 48px 40px; }
          .button { display: inline-block; background: #0a0a0a; color: white; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 600; font-size: 16px; margin: 24px 0; transition: all 0.2s; }
          .button:hover { transform: translateY(-2px); box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.2); }
          .footer { padding: 32px 40px; background-color: #f9fafb; color: #6b7280; font-size: 14px; text-align: center; border-top: 1px solid #e5e7eb; }
          .feature { background-color: #f9fafb; padding: 24px; margin: 24px 0; border-radius: 12px; border-left: 4px solid #0a0a0a; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="logo">REanalyzr</h1>
            <p class="tagline">Welcome</p>
          </div>

          <div class="content">
            <h2 style="color: #0a0a0a; margin-top: 0; font-size: 28px; font-weight: 600;">Welcome aboard, ${firstName}! 🎉</h2>
            <p style="color: #374151; line-height: 1.6; font-size: 16px;">
              Your email has been verified and your REanalyzr account is now active.
              You're ready to start making smarter property investment decisions.
            </p>

            <div class="feature">
              <h3 style="color: #0a0a0a; margin-top: 0; font-weight: 600;">🏠 What you can do now:</h3>
              <ul style="color: #374151; margin: 12px 0; line-height: 1.8;">
                <li>Analyze single-family rental properties</li>
                <li>Get AI-powered investment insights</li>
                <li>Track your deal pipeline</li>
                <li>Access market intelligence data</li>
                <li>Save and compare multiple properties</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 32px 0;">
              <a href="${this.FRONTEND_URL}/dashboard" class="button">Start Analyzing Properties</a>
            </div>

            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-top: 32px;">
              Need help getting started? Check out our help section or reach out to our support team.
              We're here to help you succeed in real estate investing.
            </p>
          </div>

          <div class="footer">
            <p style="margin: 0;">© 2025 REanalyzr. Professional Property Investment Analysis.</p>
            <p style="margin: 8px 0 0; font-size: 12px; color: #9ca3af;">Intelligent Real Estate Investment Platform</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

// Export singleton instance
export const emailService = new EmailService();