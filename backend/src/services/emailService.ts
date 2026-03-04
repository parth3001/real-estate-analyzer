import { Resend } from 'resend';
import { logger } from '../utils/logger';
import { EmailPdfAttachment } from '../types/pdf.types';

export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
  attachments?: EmailPdfAttachment[];  // ✨ NEW: Support for PDF attachments
}

export class EmailService {
  private resend: Resend | null = null;
  private FROM_EMAIL = 'REanalyzr <admin@reanalyzr.com>';
  private ADMIN_EMAIL = 'ppatel21@gmail.com'; // Your personal email for notifications
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
        from: this.FROM_EMAIL,
        to: template.to,
        subject: template.subject,
        html: template.html
      };

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
    const subject = propertyAddress
      ? `${propertyAddress} - ${dealQualityScore}/100 Analysis ✅`
      : `Your Property Analysis: ${dealQualityScore}/100 Score ✅`;

    await this.sendEmail({
      to: email,
      subject,
      html: template,
      attachments: [attachment]
    });

    logger.info(`[EmailService] Anonymous PDF email sent to: ${email} | Strategy: ${strategy} | Score: ${dealQualityScore}`);
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
            <p class="tagline">Property Analysis Report</p>
          </div>

          <div class="content">
            <h2 style="color: #0a0a0a; margin-top: 0; font-size: 28px; font-weight: 600;">Your Analysis is Ready! 📊</h2>
            <p style="color: #374151; line-height: 1.6; font-size: 16px;">
              ${propertyAddress ? `We've analyzed <strong>${propertyAddress}</strong> using our` : 'We\'ve completed your'}
              ${strategyLabel} investment strategy calculator. Your professional-grade analysis is attached as a PDF.
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

            <h3 style="color: #0a0a0a; font-weight: 600; margin-top: 32px;">📊 Your Next Steps</h3>
            <ol style="color: #374151; line-height: 1.8; padding-left: 24px;">
              <li><strong>Review the attached PDF</strong> — Your complete 2-page analysis with all metrics</li>
              <li><strong>${nextStepAction}</strong> — ${nextStepReasoning}</li>
              <li><strong>Share with your team</strong> — Forward this email to your lender, CPA, or investment partner</li>
              <li><strong>Track future deals</strong> — <a href="${signupUrl}" style="color: #0a0a0a; text-decoration: none; font-weight: 600;">Create a free account</a> to save and compare your next properties</li>
            </ol>

            <div style="text-align: center; margin: 40px 0 32px;">
              <a href="${signupUrl}" class="button">Save Future Deals in Deal Pipeline →</a>
              <p style="margin: 12px 0 0; color: #6b7280; font-size: 14px;">
                Organize your properties • Track your pipeline • Compare multiple deals
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
              <strong>Questions?</strong> Reply to this email or reach out to our support team. We're here to help you make confident investment decisions.
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
}

// Export singleton instance
export const emailService = new EmailService();