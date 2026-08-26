/**
 * Email Service
 * Supports SMTP, SendGrid, Mailgun, etc.
 */

const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = this.createTransporter();
  }

  createTransporter() {
    // Check which provider is configured
    if (process.env.SENDGRID_API_KEY) {
      return this.createSendGridTransporter();
    } else if (process.env.MAILGUN_API_KEY) {
      return this.createMailgunTransporter();
    } else {
      return this.createSmtpTransporter();
    }
  }

  createSmtpTransporter() {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  createSendGridTransporter() {
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    
    // For compatibility with nodemailer interface
    return {
      sendMail: async (options) => {
        return sgMail.send({
          to: options.to,
          from: options.from || process.env.SMTP_FROM,
          subject: options.subject,
          text: options.text,
          html: options.html
        });
      }
    };
  }

  createMailgunTransporter() {
    const formData = require('form-data');
    const Mailgun = require('mailgun.js');
    const mailgun = new Mailgun(formData);
    
    const mg = mailgun.client({
      username: 'api',
      key: process.env.MAILGUN_API_KEY
    });
    
    return {
      sendMail: async (options) => {
        return mg.messages.create(process.env.MAILGUN_DOMAIN, {
          from: options.from || process.env.SMTP_FROM,
          to: options.to,
          subject: options.subject,
          text: options.text,
          html: options.html
        });
      }
    };
  }

  async sendEmail(options) {
    try {
      // Set default from address
      options.from = options.from || process.env.SMTP_FROM || 'noreply@dark-fb.com';
      
      const info = await this.transporter.sendMail(options);
      console.log('Email sent:', info);
      return info;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  async sendVerificationEmail(email, verificationUrl) {
    await this.sendEmail({
      to: email,
      subject: 'Verify Your Email - DARK-FB',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1a1a2e; color: #fff; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .button { display: inline-block; padding: 10px 20px; background: #1877f2; color: #fff; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>DARK-FB</h1>
            </div>
            <div class="content">
              <h2>Welcome to DARK-FB!</h2>
              <p>Please verify your email address by clicking the button below:</p>
              <p><a href="${verificationUrl}" class="button">Verify Email</a></p>
              <p>Or copy this link into your browser:</p>
              <p><small>${verificationUrl}</small></p>
              <p>This link will expire in 7 days.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} DARK-FB. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    });
  }

  async sendPasswordResetEmail(email, resetUrl) {
    await this.sendEmail({
      to: email,
      subject: 'Password Reset - DARK-FB',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1a1a2e; color: #fff; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .button { display: inline-block; padding: 10px 20px; background: #1877f2; color: #fff; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            .warning { color: #ff6b6b; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>DARK-FB</h1>
            </div>
            <div class="content">
              <h2>Password Reset</h2>
              <p>You requested a password reset. Click the button below to reset your password:</p>
              <p><a href="${resetUrl}" class="button">Reset Password</a></p>
              <p>Or copy this link into your browser:</p>
              <p><small>${resetUrl}</small></p>
              <p class="warning">This link will expire in 1 hour.</p>
              <p>If you didn't request this, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} DARK-FB. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    });
  }

  async sendNotificationEmail(email, subject, message) {
    await this.sendEmail({
      to: email,
      subject: `[DARK-FB] ${subject}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1a1a2e; color: #fff; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>DARK-FB</h1>
            </div>
            <div class="content">
              <h2>${subject}</h2>
              <p>${message}</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} DARK-FB. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    });
  }
}

module.exports = new EmailService();
