import { Resend } from 'resend';
import { logger } from '../utils/logger';

export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
}

export class EmailService {
  private resend: Resend | null = null;
  private FROM_EMAIL = 'REanalyzr <noreply@reanalyzr.com>';
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
      subject: 'Verify your reanalyzr account',
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
      subject: 'Reset your reanalyzr password',
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
      subject: 'Welcome to reanalyzr! 🎉',
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
        <title>Verify your analyzr account</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
          .header { background: linear-gradient(135deg, #374151 0%, #6366f1 100%); padding: 40px 40px 20px; text-align: center; }
          .logo { color: white; font-size: 32px; font-weight: 700; margin: 0; letter-spacing: -0.5px; }
          .tagline { color: #e2e8f0; font-size: 11px; font-weight: 600; letter-spacing: 2px; margin: 8px 0 0; }
          .content { padding: 40px; }
          .button { display: inline-block; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 600; margin: 20px 0; transition: transform 0.2s; }
          .footer { padding: 20px 40px; background-color: #f1f5f9; color: #64748b; font-size: 14px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="logo">REanalyzr</h1>
            <p class="tagline">INTELLIGENCE</p>
          </div>

          <div class="content">
            <h2 style="color: #1e293b; margin-top: 0;">Welcome to REanalyzr!</h2>
            <p style="color: #475569; line-height: 1.6;">
              Thank you for signing up for REanalyzr. To complete your registration and start analyzing properties,
              please verify your email address by clicking the button below.
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </div>

            <p style="color: #64748b; font-size: 14px; line-height: 1.5;">
              This verification link will expire in 24 hours. If you didn't create an account with reanalyzr,
              you can safely ignore this email.
            </p>

            <p style="color: #64748b; font-size: 14px;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${verificationUrl}" style="color: #1e40af; word-break: break-all;">${verificationUrl}</a>
            </p>
          </div>

          <div class="footer">
            <p style="margin: 0;">© 2024 analyzr Intelligence. Professional Property Investment Analysis.</p>
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
        <title>Reset your analyzr password</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
          .header { background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 40px 40px 20px; text-align: center; }
          .logo { color: white; font-size: 32px; font-weight: 700; margin: 0; letter-spacing: -0.5px; }
          .tagline { color: #fecaca; font-size: 11px; font-weight: 600; letter-spacing: 2px; margin: 8px 0 0; }
          .content { padding: 40px; }
          .button { display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 600; margin: 20px 0; }
          .footer { padding: 20px 40px; background-color: #f1f5f9; color: #64748b; font-size: 14px; text-align: center; }
          .warning { background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; margin: 20px 0; border-radius: 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="logo">REanalyzr</h1>
            <p class="tagline">PASSWORD RESET</p>
          </div>

          <div class="content">
            <h2 style="color: #1e293b; margin-top: 0;">Reset Your Password</h2>
            <p style="color: #475569; line-height: 1.6;">
              We received a request to reset your password for your reanalyzr account.
              Click the button below to create a new password.
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>

            <div class="warning">
              <p style="color: #b91c1c; margin: 0; font-weight: 600;">⚠️ Important Security Notice</p>
              <ul style="color: #dc2626; margin: 10px 0 0; padding-left: 20px;">
                <li>This reset link expires in 1 hour for security</li>
                <li>If you didn't request this reset, please ignore this email</li>
                <li>Your password won't change until you complete the reset process</li>
              </ul>
            </div>

            <p style="color: #64748b; font-size: 14px;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${resetUrl}" style="color: #dc2626; word-break: break-all;">${resetUrl}</a>
            </p>
          </div>

          <div class="footer">
            <p style="margin: 0;">© 2024 analyzr Intelligence. Professional Property Investment Analysis.</p>
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
        <title>Welcome to analyzr!</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
          .header { background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 40px 40px 20px; text-align: center; }
          .logo { color: white; font-size: 32px; font-weight: 700; margin: 0; letter-spacing: -0.5px; }
          .tagline { color: #a7f3d0; font-size: 11px; font-weight: 600; letter-spacing: 2px; margin: 8px 0 0; }
          .content { padding: 40px; }
          .button { display: inline-block; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 600; margin: 20px 0; }
          .footer { padding: 20px 40px; background-color: #f1f5f9; color: #64748b; font-size: 14px; text-align: center; }
          .feature { background-color: #f0fdf4; padding: 20px; margin: 15px 0; border-radius: 12px; border-left: 4px solid #059669; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="logo">REanalyzr</h1>
            <p class="tagline">INTELLIGENCE</p>
          </div>

          <div class="content">
            <h2 style="color: #1e293b; margin-top: 0;">Welcome aboard, ${firstName}! 🎉</h2>
            <p style="color: #475569; line-height: 1.6;">
              Your email has been verified and your REanalyzr account is now active.
              You're ready to start making smarter property investment decisions.
            </p>

            <div class="feature">
              <h3 style="color: #065f46; margin-top: 0;">🏠 What you can do now:</h3>
              <ul style="color: #047857; margin: 10px 0;">
                <li>Analyze single-family rental properties</li>
                <li>Get AI-powered investment insights</li>
                <li>Track your deal pipeline</li>
                <li>Access market intelligence data</li>
                <li>Save and compare multiple properties</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${this.FRONTEND_URL}/dashboard" class="button">Start Analyzing Properties</a>
            </div>

            <p style="color: #64748b; font-size: 14px; line-height: 1.5;">
              Need help getting started? Check out our help section or reach out to our support team.
              We're here to help you succeed in real estate investing.
            </p>
          </div>

          <div class="footer">
            <p style="margin: 0;">© 2024 analyzr Intelligence. Professional Property Investment Analysis.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

// Export singleton instance
export const emailService = new EmailService();