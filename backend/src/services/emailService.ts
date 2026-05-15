import { Resend } from 'resend';
import { logger } from '../utils/logger';
import { EmailPdfAttachment } from '../types/pdf.types';

export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  attachments?: EmailPdfAttachment[];
  cc?: string[];
}

export class EmailService {
  private resend: Resend | null = null;
  private FROM_EMAIL = 'REanalyzr <admin@reanalyzr.com>';
  private ADMIN_EMAIL = 'ppatel21@gmail.com'; // Your personal email for notifications
  private FRONTEND_URL: string;

  constructor() {
    // DEFENSIVE: Remove trailing slashes from FRONTEND_URL to prevent double slashes in email links
    // Issue: FRONTEND_URL="https://reanalyzr.com/" + "/verify-email" = "//verify-email" (404 error)
    // Fix: Strip trailing slashes using regex
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    this.FRONTEND_URL = frontendUrl.replace(/\/+$/, '');

    if (process.env.RESEND_API_KEY) {
      this.resend = new Resend(process.env.RESEND_API_KEY);
      logger.info('[EmailService] Resend client initialized successfully');
      logger.info(`[EmailService] FRONTEND_URL normalized to: ${this.FRONTEND_URL}`);
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
   * Send admin notification when new user signs up
   */
  async sendAdminSignupNotification(userEmail: string, firstName: string, lastName: string): Promise<void> {
    const template = this.getAdminSignupNotificationTemplate(userEmail, firstName, lastName);

    await this.sendEmail({
      to: this.ADMIN_EMAIL,
      subject: `🎉 New REanalyzr Signup: ${firstName} ${lastName}`,
      html: template
    });

    logger.info(`[EmailService] Admin signup notification sent for: ${userEmail}`);
  }

  /**
   * Send contact us message to admin
   */
  async sendContactUsMessage(name: string, email: string, subject: string, message: string): Promise<void> {
    const template = this.getContactUsTemplate(name, email, subject, message);

    await this.sendEmail({
      to: this.ADMIN_EMAIL,
      subject: `📧 REanalyzr Contact: ${subject}`,
      html: template
    });

    logger.info(`[EmailService] Contact us message sent from: ${email}`);
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

      // Prepare email payload
      const emailPayload: any = {
        from: template.from || this.FROM_EMAIL,
        to: template.to,
        subject: template.subject,
        html: template.html
      };

      if (template.text) emailPayload.text = template.text;
      if (template.replyTo) emailPayload.reply_to = template.replyTo;

      // Add CC if present
      if (template.cc && template.cc.length > 0) {
        emailPayload.cc = template.cc;
      }

      // Add attachments if present (for PDF emails)
      if (template.attachments && template.attachments.length > 0) {
        emailPayload.attachments = template.attachments.map(att => ({
          filename: att.filename,
          content: att.content,
        }));

        logger.info(`[EmailService] Sending email with ${template.attachments.length} attachment(s) to: ${template.to}`);
      }

      await this.resend.emails.send(emailPayload);

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

  /**
   * Admin signup notification template
   */
  private getAdminSignupNotificationTemplate(userEmail: string, firstName: string, lastName: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New User Signup - REanalyzr</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif; margin: 0; padding: 0; background-color: #ffffff; }
          .container { max-width: 600px; margin: 40px auto; background-color: white; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); }
          .header { background: linear-gradient(135deg, #16a34a 0%, #22c55e 100%); padding: 48px 40px 32px; text-align: center; }
          .logo { color: white; font-size: 42px; font-weight: 700; margin: 0; letter-spacing: -1.5px; }
          .tagline { color: rgba(255, 255, 255, 0.9); font-size: 12px; font-weight: 500; letter-spacing: 3px; margin: 12px 0 0; text-transform: uppercase; }
          .content { padding: 48px 40px; }
          .user-info { background-color: #f9fafb; padding: 24px; margin: 24px 0; border-radius: 12px; border-left: 4px solid #16a34a; }
          .footer { padding: 32px 40px; background-color: #f9fafb; color: #6b7280; font-size: 14px; text-align: center; border-top: 1px solid #e5e7eb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="logo">🎉 New Signup!</h1>
            <p class="tagline">REanalyzr User Registration</p>
          </div>

          <div class="content">
            <h2 style="color: #0a0a0a; margin-top: 0; font-size: 28px; font-weight: 600;">New User Registered</h2>
            <p style="color: #374151; line-height: 1.6; font-size: 16px;">
              Great news! A new user has signed up for REanalyzr and completed email verification.
            </p>

            <div class="user-info">
              <h3 style="color: #16a34a; margin-top: 0; font-weight: 600;">👤 User Details:</h3>
              <ul style="color: #374151; margin: 12px 0; line-height: 1.8; list-style: none; padding: 0;">
                <li><strong>Name:</strong> ${firstName} ${lastName}</li>
                <li><strong>Email:</strong> ${userEmail}</li>
                <li><strong>Registration Time:</strong> ${new Date().toLocaleString()}</li>
                <li><strong>Status:</strong> Email Verified ✅</li>
              </ul>
            </div>

            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-top: 32px;">
              This user is now active and can start analyzing properties. Consider following up with them
              to ensure they have a great experience with the platform.
            </p>
          </div>

          <div class="footer">
            <p style="margin: 0;">© 2025 REanalyzr Admin Notifications</p>
            <p style="margin: 8px 0 0; font-size: 12px; color: #9ca3af;">Automated signup notification</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Contact us email template
   */
  private getContactUsTemplate(name: string, email: string, subject: string, message: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Contact Form Submission - REanalyzr</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif; margin: 0; padding: 0; background-color: #ffffff; }
          .container { max-width: 600px; margin: 40px auto; background-color: white; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); }
          .header { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 48px 40px 32px; text-align: center; }
          .logo { color: white; font-size: 42px; font-weight: 700; margin: 0; letter-spacing: -1.5px; }
          .tagline { color: rgba(255, 255, 255, 0.9); font-size: 12px; font-weight: 500; letter-spacing: 3px; margin: 12px 0 0; text-transform: uppercase; }
          .content { padding: 48px 40px; }
          .contact-info { background-color: #f9fafb; padding: 24px; margin: 24px 0; border-radius: 12px; border-left: 4px solid #3b82f6; }
          .message-box { background-color: #fefefe; padding: 24px; margin: 24px 0; border-radius: 12px; border: 2px solid #e5e7eb; }
          .footer { padding: 32px 40px; background-color: #f9fafb; color: #6b7280; font-size: 14px; text-align: center; border-top: 1px solid #e5e7eb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="logo">📧 Contact Form</h1>
            <p class="tagline">REanalyzr Support Request</p>
          </div>

          <div class="content">
            <h2 style="color: #0a0a0a; margin-top: 0; font-size: 28px; font-weight: 600;">New Contact Form Submission</h2>
            <p style="color: #374151; line-height: 1.6; font-size: 16px;">
              You have received a new message through the REanalyzr contact form.
            </p>

            <div class="contact-info">
              <h3 style="color: #3b82f6; margin-top: 0; font-weight: 600;">👤 Contact Information:</h3>
              <ul style="color: #374151; margin: 12px 0; line-height: 1.8; list-style: none; padding: 0;">
                <li><strong>Name:</strong> ${name}</li>
                <li><strong>Email:</strong> ${email}</li>
                <li><strong>Subject:</strong> ${subject}</li>
                <li><strong>Submission Time:</strong> ${new Date().toLocaleString()}</li>
              </ul>
            </div>

            <div class="message-box">
              <h3 style="color: #0a0a0a; margin-top: 0; font-weight: 600;">💬 Message:</h3>
              <p style="color: #374151; line-height: 1.6; margin: 0; white-space: pre-wrap;">${message}</p>
            </div>

            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-top: 32px;">
              <strong>Next Steps:</strong> Reply directly to ${email} to respond to this inquiry.
            </p>
          </div>

          <div class="footer">
            <p style="margin: 0;">© 2025 REanalyzr Contact Form</p>
            <p style="margin: 8px 0 0; font-size: 12px; color: #9ca3af;">Automated contact form notification</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * ✨ NEW: Send anonymous PDF analysis email
   *
   * @param email - Recipient email address
   * @param attachment - PDF attachment object
   * @param strategy - Investment strategy ('brrrr' | 'buy-hold')
   * @param dealQualityScore - Deal Quality Score (0-100)
   * @param propertyAddress - Optional property address for personalization
   */
  async sendAnonymousPdfEmail(
    email: string,
    attachment: EmailPdfAttachment,
    strategy: string,
    dealQualityScore: number,
    propertyAddress?: string,
    analysis?: any  // Full analysis object for metrics display
  ): Promise<void> {
    const template = this.getAnonymousPdfEmailTemplate(strategy, dealQualityScore, propertyAddress, analysis);

    // Enhanced subject line with score and optional address
    const subject = `Your REanalyzr Deal Report: ${propertyAddress || 'Property Analysis'} (${dealQualityScore}/100)`;

    await this.sendEmail({
      to: email,
      subject,
      html: template,
      attachments: [attachment]
    });

    logger.info(`[EmailService] Anonymous PDF email sent to: ${email} | Strategy: ${strategy} | Score: ${dealQualityScore}`);
  }

  /**
   * Send shared analysis email (authenticated user sharing with banker/underwriter)
   */
  async sendShareAnalysisEmail(
    recipientEmail: string,
    ccEmail: string | undefined,
    personalNote: string | undefined,
    attachment: EmailPdfAttachment,
    strategy: string,
    dealQualityScore: number,
    senderName: string,
    senderEmail: string,
    propertyAddress?: string,
    analysis?: any
  ): Promise<void> {
    const template = this.getShareAnalysisEmailTemplate(
      strategy, dealQualityScore, senderName, senderEmail, personalNote, propertyAddress, analysis
    );

    const addressLabel = propertyAddress || 'Property Analysis';
    const subject = `Property Analysis: ${addressLabel} | Deal Score: ${dealQualityScore}/100 — Shared by ${senderName}`;

    await this.sendEmail({
      to: recipientEmail,
      subject,
      html: template,
      attachments: [attachment],
      ...(ccEmail ? { cc: [ccEmail] } : {}),
    });

    logger.info(`[EmailService] Share analysis email sent to: ${recipientEmail} from: ${senderEmail} | Score: ${dealQualityScore}`);
  }

  /**
   * Professional share analysis email template (no marketing CTAs, numbers-focused)
   */
  private getShareAnalysisEmailTemplate(
    strategy: string,
    dealQualityScore: number,
    senderName: string,
    senderEmail: string,
    personalNote?: string,
    propertyAddress?: string,
    analysis?: any
  ): string {
    const strategyLabel = strategy === 'brrrr' ? 'BRRRR Strategy' : 'Buy & Hold';
    const scoreColor = dealQualityScore >= 80 ? '#2E7D32' : dealQualityScore >= 65 ? '#E65100' : '#C62828';
    const scoreLabel = dealQualityScore >= 80
      ? 'Above professional standards'
      : dealQualityScore >= 65
        ? 'Meets professional standards'
        : dealQualityScore >= 50
          ? 'Requires optimization'
          : 'Below professional standards';

    const keyMetrics = analysis?.keyMetrics || {};
    const monthly = analysis?.monthlyAnalysis || {};
    const isBrrrr = strategy === 'brrrr';
    const strategySpec = analysis?.strategySpecific;

    const monthlyCashFlow = isBrrrr && strategySpec?.postRefinanceMetrics?.monthlyCashFlow !== undefined
      ? strategySpec.postRefinanceMetrics.monthlyCashFlow
      : monthly?.cashFlow;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 24px 32px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: -0.5px;">REanalyzr</h1>
              <p style="margin: 4px 0 0 0; color: #94a3b8; font-size: 12px;">Property Analysis Report</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 16px 0; color: #333333; font-size: 14px; line-height: 1.6;">
                <strong>${senderName}</strong> (${senderEmail}) has shared a property analysis with you via REanalyzr.
              </p>

              ${personalNote ? `
              <div style="background-color: #f8f9fa; border-left: 3px solid #1565C0; padding: 12px 16px; margin: 0 0 20px 0; border-radius: 0 4px 4px 0;">
                <p style="margin: 0; color: #555555; font-size: 13px; font-style: italic;">"${personalNote}"</p>
              </div>
              ` : ''}

              <!-- Property & Score -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 20px 0;">
                <tr>
                  <td style="background-color: #f8f9fa; padding: 16px; border-radius: 8px;">
                    ${propertyAddress ? `<p style="margin: 0 0 8px 0; color: #333333; font-size: 15px; font-weight: 600;">${propertyAddress}</p>` : ''}
                    <span style="display: inline-block; background-color: ${isBrrrr ? '#E8F5E9' : '#E3F2FD'}; color: ${isBrrrr ? '#2E7D32' : '#1565C0'}; font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 12px; margin-bottom: 8px;">${strategyLabel}</span>
                    <p style="margin: 0; color: ${scoreColor}; font-size: 36px; font-weight: 700; letter-spacing: -1px;">${dealQualityScore}/100</p>
                    <p style="margin: 4px 0 0 0; color: ${scoreColor}; font-size: 12px;">${scoreLabel}</p>
                  </td>
                </tr>
              </table>

              <!-- Key Metrics Summary -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 20px 0; border: 1px solid #e0e0e0; border-radius: 8px; border-collapse: separate;">
                <tr style="background-color: #f5f7fa;">
                  <td style="font-size: 12px; color: #666; padding: 14px 16px;">Cap Rate</td>
                  <td style="font-size: 14px; font-weight: 600; color: #212121; text-align: right; padding: 14px 16px;">${keyMetrics.capRate !== undefined ? keyMetrics.capRate.toFixed(1) + '%' : 'N/A'}</td>
                </tr>
                <tr>
                  <td style="font-size: 12px; color: #666; padding: 14px 16px;">Monthly Cash Flow</td>
                  <td style="font-size: 14px; font-weight: 600; color: #212121; text-align: right; padding: 14px 16px;">${monthlyCashFlow !== undefined ? '$' + Math.round(monthlyCashFlow).toLocaleString() : 'N/A'}</td>
                </tr>
                <tr style="background-color: #f5f7fa;">
                  <td style="font-size: 12px; color: #666; padding: 14px 16px;">DSCR</td>
                  <td style="font-size: 14px; font-weight: 600; color: #212121; text-align: right; padding: 14px 16px;">${keyMetrics.dscr !== undefined ? keyMetrics.dscr.toFixed(2) : 'N/A'}</td>
                </tr>
                <tr>
                  <td style="font-size: 12px; color: #666; padding: 14px 16px;">Cash-on-Cash Return</td>
                  <td style="font-size: 14px; font-weight: 600; color: #212121; text-align: right; padding: 14px 16px;">${keyMetrics.cashOnCashReturn !== undefined ? keyMetrics.cashOnCashReturn.toFixed(1) + '%' : 'N/A'}</td>
                </tr>
              </table>

              <p style="margin: 0 0 8px 0; color: #333333; font-size: 13px; line-height: 1.5;">
                The complete analysis report is attached as a PDF, including property details, financing assumptions, key metrics, and ${isBrrrr ? '15' : '10'}-year projections.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px 32px; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0 0 8px 0; color: #999999; font-size: 10px; line-height: 1.5;">
                This analysis is for informational purposes only and does not constitute financial, legal, or investment advice. Always consult with qualified professionals before making investment decisions.
              </p>
              <p style="margin: 0; color: #bbbbbb; font-size: 10px;">
                Generated by REanalyzr | reanalyzr.com
              </p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  /**
   * ✨ NEW: Anonymous PDF email template with enhanced UX
   */
  private getAnonymousPdfEmailTemplate(strategy: string, dealQualityScore: number, propertyAddress?: string, analysis?: any): string {
    const strategyLabel = strategy === 'brrrr' ? 'BRRRR' : 'Buy & Hold';
    const scoreLabel = dealQualityScore >= 80
      ? 'Above professional standards'
      : dealQualityScore >= 65
        ? 'Meets professional standards'
        : dealQualityScore >= 50
          ? 'Requires optimization'
          : 'Below professional standards';

    const scoreColor = dealQualityScore >= 80
      ? '#4CAF50'
      : dealQualityScore >= 65
        ? '#2196F3'
        : dealQualityScore >= 50
          ? '#FF9800'
          : '#F44336';

    // Detect BRRRR vs Buy & Hold strategy
    const isBRRRR = strategy === 'brrrr';

    // Format metrics from analysis - BRRRR uses post-refinance metrics
    let monthlyCashFlow: string;
    let cashFlowColor: string;
    let metric2Label: string;
    let metric2Value: string;
    let metric3Label: string;
    let metric3Value: string;

    if (isBRRRR) {
      // BRRRR: Show post-refinance metrics from strategySpecific.postRefinanceMetrics
      const postRefiCashFlow = (analysis as any)?.strategySpecific?.postRefinanceMetrics?.monthlyCashFlow !== undefined
        ? (analysis as any).strategySpecific.postRefinanceMetrics.monthlyCashFlow
        : analysis?.monthlyAnalysis?.cashFlow || 0;

      monthlyCashFlow = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(postRefiCashFlow);
      cashFlowColor = postRefiCashFlow >= 0 ? '#4CAF50' : '#F44336';

      // Capital Recovery (BRRRR-specific) from strategySpecific.capitalRecovery
      const capitalRecovery = (analysis as any)?.strategySpecific?.capitalRecovery?.capitalRecoveryRate !== undefined
        ? (analysis as any).strategySpecific.capitalRecovery.capitalRecoveryRate
        : 0;
      const isInfiniteReturn = (analysis as any)?.strategySpecific?.capitalRecovery?.capitalRemaining === 0;

      metric2Label = 'Capital Recovery';
      metric2Value = isInfiniteReturn
        ? `${capitalRecovery.toFixed(1)}% 🚀 Infinite Return`
        : `${capitalRecovery.toFixed(1)}%`;

      // Post-Refi CoC Return from strategySpecific.postRefinanceMetrics
      const postRefiCoC = (analysis as any)?.strategySpecific?.postRefinanceMetrics?.cashOnCashReturn;
      metric3Label = 'Post-Refi CoC Return';
      metric3Value = isInfiniteReturn ? '∞%' : (postRefiCoC !== undefined ? `${postRefiCoC.toFixed(1)}%` : 'N/A');

    } else {
      // Buy & Hold: Show traditional metrics
      const buyHoldCashFlow = analysis?.monthlyAnalysis?.cashFlow !== undefined
        ? analysis.monthlyAnalysis.cashFlow
        : 0;

      monthlyCashFlow = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(buyHoldCashFlow);
      cashFlowColor = buyHoldCashFlow >= 0 ? '#4CAF50' : '#F44336';

      metric2Label = 'Cap Rate';
      metric2Value = analysis?.keyMetrics?.capRate !== undefined
        ? `${analysis.keyMetrics.capRate.toFixed(1)}%`
        : 'N/A';

      metric3Label = 'Cash-on-Cash Return';
      metric3Value = analysis?.keyMetrics?.cashOnCashReturn !== undefined
        ? `${analysis.keyMetrics.cashOnCashReturn.toFixed(1)}%`
        : 'N/A';
    }

    // Score-based next step recommendation
    let nextStepAction: string;
    let nextStepReasoning: string;

    if (dealQualityScore >= 80) {
      nextStepAction = 'Make an offer';
      nextStepReasoning = 'This is a strong deal by professional standards';
    } else if (dealQualityScore >= 65) {
      nextStepAction = 'Negotiate the price';
      nextStepReasoning = "There's potential here with better terms";
    } else if (dealQualityScore >= 50) {
      nextStepAction = 'Run more scenarios';
      nextStepReasoning = 'Adjust your assumptions to improve returns';
    } else {
      nextStepAction = 'Keep searching';
      nextStepReasoning = 'Compare this to other opportunities in your market';
    }

    const signupUrl = `${this.FRONTEND_URL}/register?source=pdf_email&score=${dealQualityScore}`;
    const unsubscribeUrl = `${this.FRONTEND_URL}/unsubscribe`;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Property Analysis - REanalyzr</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif; margin: 0; padding: 0; background-color: #ffffff; }
          .container { max-width: 600px; margin: 40px auto; background-color: white; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); }
          .header { background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%); padding: 48px 40px 32px; text-align: center; }
          .logo { color: white; font-size: 42px; font-weight: 700; margin: 0; letter-spacing: -1.5px; }
          .tagline { color: rgba(255, 255, 255, 0.7); font-size: 12px; font-weight: 500; letter-spacing: 3px; margin: 12px 0 0; text-transform: uppercase; }
          .content { padding: 48px 40px; }
          .score-box { text-align: center; background-color: #f9fafb; padding: 32px; margin: 24px 0; border-radius: 12px; border-left: 4px solid ${scoreColor}; }
          .score-value { font-size: 48px; font-weight: 700; color: ${scoreColor}; margin: 0; }
          .score-label { font-size: 14px; color: #6b7280; margin-top: 8px; }
          .button { display: inline-block; background: #0a0a0a; color: white; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 600; font-size: 16px; margin: 24px 0; transition: all 0.2s; }
          .button:hover { transform: translateY(-2px); box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.2); }
          .footer { padding: 32px 40px; background-color: #f9fafb; color: #6b7280; font-size: 14px; text-align: center; border-top: 1px solid #e5e7eb; }
          .disclaimer { padding: 16px; background-color: #fef2f2; border-radius: 8px; margin-top: 24px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="logo">REanalyzr</h1>
            <p class="tagline">Deal Quality Score: ${dealQualityScore}/100</p>
          </div>

          <div class="content">
            <h2 style="color: #0a0a0a; margin-top: 0; font-size: 28px; font-weight: 600;">Your Analysis is Ready! 📊</h2>
            <p style="color: #374151; line-height: 1.6; font-size: 16px;">
              We analyzed ${propertyAddress ? `<strong>${propertyAddress}</strong>` : 'your property'} using our ${strategyLabel} calculator. You got a <strong>${dealQualityScore}/100 Deal Quality Score</strong>. Your full professional-grade analysis is attached below — here's what it means for your deal.
            </p>

            <div class="score-box">
              <p style="margin: 0; font-size: 14px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px;">Deal Quality Score</p>
              <p class="score-value">${dealQualityScore}/100</p>
              <p class="score-label">${scoreLabel}</p>
            </div>

            ${analysis ? `
            <h3 style="color: #0a0a0a; font-weight: 600; margin-top: 32px;">Your Investment Summary${isBRRRR ? ' (BRRRR)' : ''}</h3>
            <table style="width: 100%; background-color: #f9fafb; border-radius: 8px; overflow: hidden; margin: 16px 0;">
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 16px; color: #6b7280; font-size: 14px;">${isBRRRR ? 'Post-Refi Cash Flow' : 'Monthly Cash Flow'}</td>
                <td style="padding: 16px; text-align: right; font-weight: 600; font-size: 16px; color: ${cashFlowColor};">${monthlyCashFlow}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 16px; color: #6b7280; font-size: 14px;">${metric2Label}</td>
                <td style="padding: 16px; text-align: right; font-weight: 600; font-size: 16px;">${metric2Value}</td>
              </tr>
              <tr>
                <td style="padding: 16px; color: #6b7280; font-size: 14px;">${metric3Label}</td>
                <td style="padding: 16px; text-align: right; font-weight: 600; font-size: 16px;">${metric3Value}</td>
              </tr>
            </table>
            <p style="text-align: center; margin: 16px 0; color: #6b7280; font-size: 14px;">
              📎 See full analysis in attached PDF →
            </p>
            ` : ''}

            <h3 style="color: #0a0a0a; font-weight: 600; margin-top: 32px;">What's next?</h3>
            <ol style="color: #374151; line-height: 1.8; padding-left: 24px;">
              <li><strong>Review the PDF</strong> — All the metrics and details are in your 2-page analysis</li>
              <li><strong>${nextStepAction}</strong> — ${nextStepReasoning}</li>
              <li><strong>Share it</strong> — Forward this to your CPA, lender, or partner</li>
              <li><strong>Track your deals</strong> — <a href="${signupUrl}" style="color: #0a0a0a; text-decoration: none; font-weight: 600;">Create a free account</a> to compare this to your next property</li>
            </ol>

            <div style="text-align: center; margin: 40px 0 32px;">
              <a href="${signupUrl}" class="button">Track My Next Deals (Free Forever) →</a>
              <p style="margin: 12px 0 0; color: #6b7280; font-size: 14px;">
                Save deals • Track your pipeline • Compare properties side-by-side
              </p>
            </div>

            <h3 style="color: #0a0a0a; font-weight: 600; margin-top: 32px;">📎 What's in the PDF</h3>
            <ul style="color: #374151; line-height: 1.8; font-size: 14px;">
              <li><strong>Investment Decision Score</strong> — Professional-grade 0-100 analytical rating</li>
              <li><strong>Property Details</strong> — Purchase price, square footage, price per sq ft</li>
              <li><strong>Financing Breakdown</strong> — Down payment, loan amount, monthly payments</li>
              <li><strong>Cash Flow Analysis</strong> — Monthly and annual net cash flow</li>
              <li><strong>Key Investment Metrics</strong> — Cap Rate, Cash-on-Cash Return, IRR, DSCR, GRM</li>
            </ul>

            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-top: 32px;">
              <strong>Questions?</strong> Reply to this email. We'll help you figure out if this deal is worth it.
            </p>
          </div>

          <!-- Beta Disclaimer -->
          <div style="margin: 32px 0 24px; padding: 16px; background-color: #F5F5F5; border-radius: 8px; border-left: 4px solid #9ca3af;">
            <p style="margin: 0; font-size: 11px; color: #666666; line-height: 1.5;">
              <strong>BETA DISCLAIMER:</strong> REanalyzr is currently in beta. This analysis is for educational and informational purposes only. REanalyzr provides professional-grade calculations but does not constitute financial, legal, or investment advice. Always consult with qualified professionals (CPA, attorney, financial advisor) before making investment decisions. Past performance does not guarantee future results. Real estate investing involves risk including loss of principal.
            </p>
          </div>

          <div class="footer">
            <p style="margin: 0;">© 2026 REanalyzr. Institutional-Grade Analysis for Individual Investors.</p>
            <p style="margin: 8px 0 0; font-size: 12px; color: #9ca3af;">reanalyzr.com</p>
            <p style="margin: 16px 0 0; font-size: 11px; color: #9ca3af;">
              Don't want PDF analysis emails? <a href="${unsubscribeUrl}" style="color: #6b7280; text-decoration: underline;">Unsubscribe</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Magic-link sign-in email. Two variants:
   *   - isNewUser: welcoming, sets expectations about REanalyzr
   *   - returning: lightweight re-engagement block with last deal (if present)
   *
   * Personalization data is fetched defensively — any failure falls back to
   * the new-user template. Auth must never be blocked by the retention layer.
   */
  async sendMagicLinkEmail(
    email: string,
    rawToken: string,
    opts: {
      isNewUser: boolean;
      firstName?: string;
      userId?: import('mongoose').Types.ObjectId | string;
    }
  ): Promise<void> {
    const verifyUrl = `${this.FRONTEND_URL}/auth/verify?token=${rawToken}`;
    const fromAddress = 'REanalyzr <login@reanalyzr.com>';

    let personalization: { lastDeal: { addressLine: string; headlineMetric: string | null } | null; monthlyAnalyzedCount: number } = {
      lastDeal: null,
      monthlyAnalyzedCount: 0,
    };

    if (!opts.isNewUser && opts.userId) {
      try {
        const { getUserEmailContext } = await import('./dealEmailHelper');
        personalization = await getUserEmailContext(opts.userId as any);
      } catch (err) {
        logger.warn('[EmailService] personalization lookup failed', {
          err: err instanceof Error ? err.message : String(err),
        });
      }
    }

    const firstName = (opts.firstName || '').trim();
    const subject = opts.isNewUser
      ? 'Welcome to REanalyzr — your sign-in link'
      : 'Your REanalyzr sign-in link';

    const preheader = opts.isNewUser
      ? 'Click the link to finish signing in. No password needed.'
      : 'One click to pick up where you left off.';

    const html = this.getMagicLinkEmailTemplate({
      verifyUrl,
      isNewUser: opts.isNewUser,
      firstName,
      preheader,
      lastDeal: personalization.lastDeal,
      monthlyAnalyzedCount: personalization.monthlyAnalyzedCount,
    });

    const text = this.getMagicLinkEmailText({
      verifyUrl,
      isNewUser: opts.isNewUser,
      firstName,
      lastDeal: personalization.lastDeal,
      monthlyAnalyzedCount: personalization.monthlyAnalyzedCount,
    });

    await this.sendEmail({
      to: email,
      subject,
      html,
      text,
      from: fromAddress,
      replyTo: 'support@reanalyzr.com',
    });

    logger.info(`[EmailService] Magic link email sent to: ${email} (new=${opts.isNewUser})`);
  }

  private getMagicLinkEmailTemplate(args: {
    verifyUrl: string;
    isNewUser: boolean;
    firstName: string;
    preheader: string;
    lastDeal: { addressLine: string; headlineMetric: string | null } | null;
    monthlyAnalyzedCount: number;
  }): string {
    const greeting = args.firstName
      ? (args.isNewUser ? `Welcome, ${this.escapeHtml(args.firstName)}.` : `Welcome back, ${this.escapeHtml(args.firstName)}.`)
      : (args.isNewUser ? 'Welcome to REanalyzr.' : 'Welcome back.');

    const newUserSection = `
      <h3 style="font-size: 17px; font-weight: 600; color: #1d1d1f; margin: 32px 0 12px;">What you can do with REanalyzr:</h3>
      <ul style="font-size: 15px; color: #515154; line-height: 1.7; padding-left: 20px; margin: 0 0 8px;">
        <li>Analyze any rental in seconds — cash flow, cap rate, IRR</li>
        <li>Run BRRRR and fix-and-flip deals</li>
        <li>Save deals and compare side by side</li>
      </ul>
    `;

    const returningDealBlock = args.lastDeal
      ? `
        <h3 style="font-size: 17px; font-weight: 600; color: #1d1d1f; margin: 32px 0 12px;">Picking up where you left off:</h3>
        <p style="margin: 0; font-size: 14px; color: #86868b;">Your last deal:</p>
        <p style="margin: 4px 0 0; font-size: 16px; font-weight: 600; color: #1d1d1f;">${this.escapeHtml(args.lastDeal.addressLine)}</p>
        ${args.lastDeal.headlineMetric ? `<p style="margin: 4px 0 16px; font-size: 14px; color: #515154;">${this.escapeHtml(args.lastDeal.headlineMetric)}</p>` : ''}
      `
      : newUserSection;

    const monthlyLine =
      !args.isNewUser && args.monthlyAnalyzedCount > 0
        ? `<p style="font-size: 14px; color: #515154; margin: 20px 0 0; line-height: 1.6;">You've analyzed ${args.monthlyAnalyzedCount} ${args.monthlyAnalyzedCount === 1 ? 'property' : 'properties'} this month. Ready to run another one?</p>`
        : '';

    const middleSection = args.isNewUser ? newUserSection : returningDealBlock + monthlyLine;

    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>Sign in to REanalyzr</title>
  <style>
    @media (prefers-color-scheme: dark) {
      .bg-body { background-color: #000 !important; }
      .bg-card { background-color: #1c1c1e !important; }
      .text-primary { color: #f5f5f7 !important; }
      .text-secondary { color: #aeaeb2 !important; }
      .text-muted { color: #8e8e93 !important; }
      .border-card { border-color: rgba(255,255,255,0.08) !important; }
    }
  </style>
</head>
<body class="bg-body" style="margin:0;padding:0;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'SF Pro','SF Pro Display','Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;mso-hide:all;">${this.escapeHtml(args.preheader)}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f5f7;" class="bg-body">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;background:#ffffff;border:1px solid rgba(0,0,0,0.06);border-radius:16px;overflow:hidden;" class="bg-card border-card">
          <tr>
            <td style="padding:40px 40px 24px;">
              <div style="font-size:22px;font-weight:700;color:#1d1d1f;letter-spacing:-0.02em;" class="text-primary">REanalyzr</div>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 8px;">
              <h1 style="margin:0;font-size:24px;font-weight:700;color:#1d1d1f;letter-spacing:-0.02em;line-height:1.3;" class="text-primary">${greeting}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 40px 8px;">
              <p style="margin:0;font-size:16px;line-height:1.6;color:#515154;" class="text-secondary">Tap the button below to finish signing in to REanalyzr.</p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:28px 40px 8px;">
              <a href="${args.verifyUrl}" target="_blank" rel="noopener"
                 style="display:inline-block;background:#0071e3;color:#ffffff;text-decoration:none;font-weight:600;font-size:16px;padding:14px 28px;border-radius:10px;min-width:200px;text-align:center;">
                Sign in to REanalyzr
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 40px 8px;">
              <p style="margin:0;font-size:13px;color:#86868b;font-style:italic;" class="text-muted">This link expires in 15 minutes and can only be used once.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 40px;">
              <hr style="border:none;border-top:1px solid rgba(0,0,0,0.06);margin:16px 0;">
              ${middleSection}
            </td>
          </tr>
          <tr>
            <td style="padding:8px 40px 32px;">
              <hr style="border:none;border-top:1px solid rgba(0,0,0,0.06);margin:16px 0 20px;">
              <p style="margin:0;font-size:13px;color:#86868b;line-height:1.6;" class="text-muted">If you didn't request this, ignore the email. Your account stays safe.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px 32px;background:#fafafa;border-top:1px solid rgba(0,0,0,0.04);" class="bg-card">
              <p style="margin:0;font-size:12px;color:#86868b;line-height:1.6;" class="text-muted">REanalyzr · reanalyzr.com</p>
              <p style="margin:4px 0 0;font-size:12px;color:#86868b;line-height:1.6;" class="text-muted">Questions? Reply to this email.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  private getMagicLinkEmailText(args: {
    verifyUrl: string;
    isNewUser: boolean;
    firstName: string;
    lastDeal: { addressLine: string; headlineMetric: string | null } | null;
    monthlyAnalyzedCount: number;
  }): string {
    const greeting = args.firstName
      ? (args.isNewUser ? `Welcome, ${args.firstName}.` : `Welcome back, ${args.firstName}.`)
      : (args.isNewUser ? 'Welcome to REanalyzr.' : 'Welcome back.');

    const lines = [
      greeting,
      '',
      'Tap the link below to finish signing in to REanalyzr:',
      args.verifyUrl,
      '',
      'This link expires in 15 minutes and can only be used once.',
      '',
    ];

    if (args.isNewUser) {
      lines.push(
        'What you can do with REanalyzr:',
        '  • Analyze any rental in seconds — cash flow, cap rate, IRR',
        '  • Run BRRRR and fix-and-flip deals',
        '  • Save deals and compare side by side',
        ''
      );
    } else if (args.lastDeal) {
      lines.push('Picking up where you left off:');
      lines.push(`Your last deal: ${args.lastDeal.addressLine}`);
      if (args.lastDeal.headlineMetric) lines.push(args.lastDeal.headlineMetric);
      lines.push('');
      if (args.monthlyAnalyzedCount > 0) {
        lines.push(
          `You've analyzed ${args.monthlyAnalyzedCount} ${args.monthlyAnalyzedCount === 1 ? 'property' : 'properties'} this month. Ready to run another one?`,
          ''
        );
      }
    }

    lines.push(
      "If you didn't request this, ignore the email. Your account stays safe.",
      '',
      'REanalyzr · reanalyzr.com',
      'Questions? Reply to this email.'
    );

    return lines.join('\n');
  }

  private escapeHtml(s: string): string {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Lightweight Deal Score summary email (W6-S4 — chat surface email CTA).
   *
   * Sends an HTML + text email with the Deal Quality score, the property
   * address, top factors, walk-away price, and a brief next-step prompt.
   * NO PDF attachment — the wizard's `sendAnonymousPdfEmail` covers the
   * heavy path; this one is intentionally minimal because the chat
   * surface's analysis lives in substrate events, not in the legacy
   * wizard's analysis object.
   *
   * Strategic role: capture an email at the activation moment without
   * forcing the user to sign up. The address goes to Resend, the
   * conversationEventId stays in our logs — together they're the
   * starting state for a magic-link signup flow (W6-S5).
   */
  async sendDealScoreSummary(opts: {
    recipientEmail: string;
    strategy: 'buy_hold' | 'brrrr';
    dealQuality: number;
    addressLine: string;
    topFactors: Array<{ label: string; score: number }>;
    walkAwayPrice: number;
    purchasePrice: number;
    nextStep: string;
  }): Promise<void> {
    const {
      recipientEmail,
      strategy,
      dealQuality,
      addressLine,
      topFactors,
      walkAwayPrice,
      purchasePrice,
      nextStep,
    } = opts;
    const strategyLabel = strategy === 'brrrr' ? 'BRRRR' : 'Buy & Hold';
    const scoreLabel =
      dealQuality >= 80
        ? 'Above professional standards'
        : dealQuality >= 65
          ? 'Meets professional standards'
          : dealQuality >= 50
            ? 'Requires optimization'
            : 'Below professional standards';
    const scoreColor =
      dealQuality >= 80
        ? '#1B8B3A'
        : dealQuality >= 65
          ? '#A66700'
          : dealQuality >= 50
            ? '#C04A00'
            : '#C7261C';
    const fmt = (n: number): string =>
      `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
    const factorsHtml = topFactors
      .map(
        (f) =>
          `<tr><td style="padding:6px 0;color:#374151;">${this.escapeHtml(
            f.label
          )}</td><td style="padding:6px 0;text-align:right;font-weight:600;color:#111827;font-variant-numeric:tabular-nums;">${f.score}/100</td></tr>`
      )
      .join('');

    const html = `
<!DOCTYPE html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#F9FAFB;margin:0;padding:24px;">
  <div style="max-width:560px;margin:0 auto;background:#FFFFFF;border-radius:12px;padding:32px;border:1px solid #E5E7EB;">
    <div style="font-size:11px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;color:#6B7280;margin-bottom:8px;">${strategyLabel.toUpperCase()} ANALYSIS</div>
    <div style="font-size:14px;color:#374151;margin-bottom:24px;">${this.escapeHtml(addressLine)}</div>
    <div style="display:flex;align-items:baseline;gap:16px;margin-bottom:24px;">
      <div style="font-size:72px;font-weight:700;line-height:1;color:${scoreColor};font-variant-numeric:tabular-nums;">${dealQuality}<span style="font-size:28px;color:#9CA3AF;font-weight:500;">/100</span></div>
      <div style="font-size:14px;font-weight:600;color:${scoreColor};">${scoreLabel}</div>
    </div>
    <hr style="border:0;border-top:1px solid #E5E7EB;margin:24px 0;" />
    <div style="font-size:11px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;color:#6B7280;margin-bottom:8px;">TOP FACTORS</div>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">${factorsHtml}</table>
    <hr style="border:0;border-top:1px solid #E5E7EB;margin:24px 0;" />
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <tr><td style="padding:6px 0;color:#374151;">Walk-away price</td><td style="padding:6px 0;text-align:right;font-weight:600;color:#111827;font-variant-numeric:tabular-nums;">${fmt(walkAwayPrice)}</td></tr>
      <tr><td style="padding:6px 0;color:#6B7280;">Your offer</td><td style="padding:6px 0;text-align:right;color:#374151;font-variant-numeric:tabular-nums;">${fmt(purchasePrice)}</td></tr>
    </table>
    <hr style="border:0;border-top:1px solid #E5E7EB;margin:24px 0;" />
    <div style="font-size:11px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;color:#6B7280;margin-bottom:8px;">NEXT STEP</div>
    <div style="font-size:14px;color:#374151;line-height:1.5;">${this.escapeHtml(nextStep)}</div>
    <div style="margin-top:32px;font-size:12px;color:#9CA3AF;text-align:center;">REanalyzr · Institutional-grade analysis. Individual investor access.</div>
  </div>
</body></html>`;

    const text = [
      `${strategyLabel.toUpperCase()} ANALYSIS`,
      addressLine,
      '',
      `Deal Quality Score: ${dealQuality}/100 — ${scoreLabel}`,
      '',
      'Top factors:',
      ...topFactors.map((f) => `  ${f.label}: ${f.score}/100`),
      '',
      `Walk-away price: ${fmt(walkAwayPrice)}`,
      `Your offer:      ${fmt(purchasePrice)}`,
      '',
      `Next step: ${nextStep}`,
      '',
      'REanalyzr · Institutional-grade analysis. Individual investor access.',
    ].join('\n');

    const subject = `Deal Score ${dealQuality}/100 — ${addressLine}`;

    await this.sendEmail({
      to: recipientEmail,
      subject,
      html,
      text,
    });

    logger.info('[EmailService] Deal Score summary sent', {
      to: recipientEmail.split('@')[0].substring(0, 5) + '...',
      dealQuality,
    });
  }
}

// Export singleton instance
export const emailService = new EmailService();