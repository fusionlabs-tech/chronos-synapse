import { Resend } from 'resend';
import { logger } from '../utils/logger';

export interface EmailOptions {
 to: string;
 subject: string;
 html: string;
 text?: string;
}

export class EmailService {
 private resend: Resend;

 constructor() {
  this.resend = new Resend(process.env.RESEND_API_KEY);

  // Test the connection
  this.testConnection();
 }

 private async testConnection() {
  try {
   // Test the API key by trying to get domains
   await this.resend.domains.list();
   logger.info('Email service (Resend) is ready to send messages');
  } catch (error) {
   logger.error('Email service configuration error:', error);
   logger.info('Please check your Resend API key');
  }
 }

 async sendEmail(options: EmailOptions): Promise<boolean> {
  try {
   const { data, error } = await this.resend.emails.send({
    from: process.env.FROM_EMAIL || 'noreply@chronos-synapse.com',
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
   });

   if (error) {
    logger.error('Failed to send email:', error);
    return false;
   }

   logger.info(`Email sent successfully: ${data?.id}`);
   return true;
  } catch (error) {
   logger.error('Failed to send email:', error);
   return false;
  }
 }

 async sendPasswordResetEmail(
  email: string,
  resetToken: string,
  userName: string
 ): Promise<boolean> {
  const resetUrl = `${
   process.env.FRONTEND_URL || 'http://localhost:3000'
  }/auth/reset-password?token=${resetToken}`;

  const subject = 'Reset Your Chronos Synapse Password';
  const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
          }
          .container {
            background: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 12px;
            margin: 0 auto 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 24px;
            font-weight: bold;
          }
          .title {
            color: #1a202c;
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 10px;
          }
          .subtitle {
            color: #718096;
            font-size: 16px;
          }
          .content {
            margin-bottom: 30px;
          }
          .button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            padding: 12px 30px;
            border-radius: 8px;
            font-weight: 500;
            margin: 20px 0;
          }
          .warning {
            background: #fff5f5;
            border: 1px solid #fed7d7;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            color: #c53030;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            color: #718096;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">CS</div>
            <h1 class="title">Reset Your Password</h1>
            <p class="subtitle">Hi ${userName}, we received a request to reset your password.</p>
          </div>
          
          <div class="content">
            <p>Click the button below to reset your password. This link will expire in 1 hour.</p>
            
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            
            <div class="warning">
              <strong>Security Notice:</strong> If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
            </div>
            
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
          </div>
          
          <div class="footer">
            <p>This email was sent from Chronos Synapse. Please do not reply to this email.</p>
            <p>If you have any questions, contact our support team.</p>
          </div>
        </div>
      </body>
      </html>
    `;

  return this.sendEmail({
   to: email,
   subject,
   html,
   text: `Hi ${userName}, click this link to reset your password: ${resetUrl}`,
  });
 }

 async sendWelcomeEmail(email: string, userName: string): Promise<boolean> {
  const subject = 'Welcome to Chronos Synapse! 🚀';
  const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Chronos Synapse</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
          }
          .container {
            background: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 12px;
            margin: 0 auto 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 24px;
            font-weight: bold;
          }
          .title {
            color: #1a202c;
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 10px;
          }
          .subtitle {
            color: #718096;
            font-size: 16px;
          }
          .content {
            margin-bottom: 30px;
          }
          .button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            padding: 12px 30px;
            border-radius: 8px;
            font-weight: 500;
            margin: 20px 0;
          }
          .features {
            background: #f7fafc;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
          }
          .feature {
            display: flex;
            align-items: center;
            margin: 10px 0;
          }
          .feature-icon {
            width: 20px;
            height: 20px;
            background: #667eea;
            border-radius: 50%;
            margin-right: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 12px;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            color: #718096;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">CS</div>
            <h1 class="title">Welcome to Chronos Synapse! 🚀</h1>
            <p class="subtitle">Hi ${userName}, your account has been created successfully.</p>
          </div>
          
          <div class="content">
            <p>Welcome to Chronos Synapse, the AI-powered cron job management platform. You're now ready to create, schedule, and monitor your automated tasks with intelligent insights.</p>
            
            <div class="features">
              <h3>What you can do:</h3>
              <div class="feature">
                <div class="feature-icon">✓</div>
                <span>Create and schedule cron jobs</span>
              </div>
              <div class="feature">
                <div class="feature-icon">✓</div>
                <span>Monitor job execution in real-time</span>
              </div>
              <div class="feature">
                <div class="feature-icon">✓</div>
                <span>Get AI-powered insights and analytics</span>
              </div>
              <div class="feature">
                <div class="feature-icon">✓</div>
                <span>Receive notifications and alerts</span>
              </div>
            </div>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" class="button">Get Started</a>
            </div>
          </div>
          
          <div class="footer">
            <p>Thank you for choosing Chronos Synapse!</p>
            <p>If you have any questions, our support team is here to help.</p>
          </div>
        </div>
      </body>
      </html>
    `;

  return this.sendEmail({
   to: email,
   subject,
   html,
   text: `Welcome to Chronos Synapse, ${userName}! Your account has been created successfully. Visit ${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard to get started.`,
  });
 }

 async sendEmailVerificationEmail(
  email: string,
  verifyToken: string,
  userName: string
 ): Promise<boolean> {
  const verifyUrl = `${
   process.env.FRONTEND_URL || 'http://localhost:3000'
  }/auth/verify-email?token=${verifyToken}`;

  const subject = 'Verify Your Email Address';
  const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
          }
          .container {
            background: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 12px;
            margin: 0 auto 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 24px;
            font-weight: bold;
          }
          .title {
            color: #1a202c;
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 10px;
          }
          .subtitle {
            color: #718096;
            font-size: 16px;
          }
          .content {
            margin-bottom: 30px;
          }
          .button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            padding: 12px 30px;
            border-radius: 8px;
            font-weight: 500;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            color: #718096;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">CS</div>
            <h1 class="title">Verify Your Email Address</h1>
            <p class="subtitle">Hi ${userName}, please verify your email address to complete your registration.</p>
          </div>
          
          <div class="content">
            <p>Click the button below to verify your email address:</p>
            
            <div style="text-align: center;">
              <a href="${verifyUrl}" class="button">Verify Email</a>
            </div>
            
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #667eea;">${verifyUrl}</p>
          </div>
          
          <div class="footer">
            <p>This email was sent from Chronos Synapse. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

  return this.sendEmail({
   to: email,
   subject,
   html,
   text: `Hi ${userName}, please verify your email address by clicking this link: ${verifyUrl}`,
  });
 }
}

// Create and export email service instance
export const emailService = new EmailService();
