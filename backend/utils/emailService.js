const sgMail = require('@sendgrid/mail');
const logger = require('./logger');

class EmailService {
  constructor() {
    if (process.env.SENDGRID_API_KEY) {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      this.isConfigured = true;
      logger.info('SendGrid email service configured');
    } else {
      this.isConfigured = false;
      logger.warn('SendGrid API key not found. Email functionality will be simulated.');
    }
  }

  async sendConfirmationEmail(email, name, confirmationToken) {
    const confirmationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/api/mailing-list/confirm/${confirmationToken}`;
    
    const msg = {
      to: email,
      from: process.env.FROM_EMAIL || 'noreply@autodevelop.ai',
      subject: 'Confirm your subscription to AutoDevelop.ai updates',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Confirm Your Subscription</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #4f46e5; margin-bottom: 10px; }
            .title { font-size: 28px; margin-bottom: 10px; color: #333; }
            .content { margin-bottom: 30px; }
            .btn { display: inline-block; background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
            .btn:hover { background-color: #3730a3; }
            .footer { font-size: 14px; color: #666; text-align: center; border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; }
            .unsubscribe { color: #999; text-decoration: none; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🚀 AutoDevelop.ai</div>
              <h1 class="title">Welcome aboard, ${name}!</h1>
            </div>
            
            <div class="content">
              <p>Thank you for subscribing to AutoDevelop.ai updates. We're excited to share our latest features, updates, and AI development insights with you.</p>
              
              <p>Please confirm your email address by clicking the button below:</p>
              
              <div style="text-align: center;">
                <a href="${confirmationUrl}" class="btn">Confirm My Subscription</a>
              </div>
              
              <p>If you can't click the button, copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #666; font-size: 14px;">${confirmationUrl}</p>
              
              <p>Once confirmed, you'll receive:</p>
              <ul>
                <li>Product updates and new feature announcements</li>
                <li>AI development tips and best practices</li>
                <li>Early access to beta features</li>
                <li>Community insights and success stories</li>
              </ul>
            </div>
            
            <div class="footer">
              <p>This email was sent to ${email} because you subscribed to updates from AutoDevelop.ai.</p>
              <p>If you didn't subscribe or want to unsubscribe, you can <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/unsubscribe" class="unsubscribe">unsubscribe here</a>.</p>
              <p>&copy; 2025 AutoDevelop.ai. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Welcome to AutoDevelop.ai, ${name}!
        
        Thank you for subscribing to our updates. Please confirm your email address by visiting:
        ${confirmationUrl}
        
        Once confirmed, you'll receive product updates, AI development tips, early access to beta features, and community insights.
        
        If you didn't subscribe, you can unsubscribe at: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/unsubscribe
        
        © 2025 AutoDevelop.ai. All rights reserved.
      `
    };

    return this.sendEmail(msg, 'confirmation');
  }

  async sendWelcomeEmail(email, name, unsubscribeToken) {
    const unsubscribeUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/api/mailing-list/unsubscribe/${unsubscribeToken}`;
    
    const msg = {
      to: email,
      from: process.env.FROM_EMAIL || 'noreply@autodevelop.ai',
      subject: 'Welcome to AutoDevelop.ai - Your subscription is confirmed!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to AutoDevelop.ai</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #4f46e5; margin-bottom: 10px; }
            .title { font-size: 28px; margin-bottom: 10px; color: #333; }
            .content { margin-bottom: 30px; }
            .btn { display: inline-block; background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
            .btn:hover { background-color: #3730a3; }
            .footer { font-size: 14px; color: #666; text-align: center; border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; }
            .unsubscribe { color: #999; text-decoration: none; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🚀 AutoDevelop.ai</div>
              <h1 class="title">You're all set, ${name}!</h1>
            </div>
            
            <div class="content">
              <p>Your subscription to AutoDevelop.ai updates has been confirmed. Welcome to our community of AI-powered developers!</p>
              
              <p>Here's what you can expect from us:</p>
              <ul>
                <li><strong>Product Updates:</strong> Be the first to know about new features and improvements</li>
                <li><strong>AI Development Tips:</strong> Learn best practices and advanced techniques</li>
                <li><strong>Early Access:</strong> Get exclusive access to beta features before anyone else</li>
                <li><strong>Community Insights:</strong> Success stories and tips from fellow developers</li>
              </ul>
              
              <p>Ready to start building? Visit our platform and transform your ideas into reality:</p>
              
              <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" class="btn">Start Building Now</a>
              </div>
            </div>
            
            <div class="footer">
              <p>You're receiving this email because you subscribed to updates from AutoDevelop.ai.</p>
              <p><a href="${unsubscribeUrl}" class="unsubscribe">Unsubscribe</a> | <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/privacy" class="unsubscribe">Privacy Policy</a></p>
              <p>&copy; 2025 AutoDevelop.ai. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        You're all set, ${name}!
        
        Your subscription to AutoDevelop.ai updates has been confirmed. Welcome to our community!
        
        You can expect:
        - Product updates and new features
        - AI development tips and best practices  
        - Early access to beta features
        - Community insights and success stories
        
        Start building now: ${process.env.FRONTEND_URL || 'http://localhost:3000'}
        
        Unsubscribe: ${unsubscribeUrl}
        Privacy Policy: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/privacy
        
        © 2025 AutoDevelop.ai. All rights reserved.
      `
    };

    return this.sendEmail(msg, 'welcome');
  }

  async sendEmail(msg, type) {
    if (!this.isConfigured) {
      // Simulate email sending in development
      logger.info(`[SIMULATED] ${type} email would be sent to: ${msg.to}`);
      logger.info(`Subject: ${msg.subject}`);
      if (type === 'payment-success' && msg.html) {
        // Extract and log the next billing date from the email content
        const match = msg.html.match(/Next Billing Date:<\/span>\s*<span class="detail-value">([^<]+)<\/span>/);
        if (match) {
          logger.info(`Next Billing Date in email: ${match[1]}`);
        }
      }
      return { success: true, simulated: true };
    }

    try {
      await sgMail.send(msg);
      logger.info(`${type} email sent successfully to: ${msg.to}`);
      return { success: true, simulated: false };
    } catch (error) {
      logger.error(`Error sending ${type} email:`, error);
      throw error;
    }
  }

  // Payment notification methods
  async sendPaymentSuccessEmail(email, name, paymentData) {
    const { amount, currency, planType, transactionId, nextBillingDate } = paymentData;
    
    const msg = {
      to: email,
      from: process.env.FROM_EMAIL || 'noreply@autodevelop.ai',
      subject: 'Payment Successful - AutoDevelop.ai',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Payment Confirmation</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #4f46e5; margin-bottom: 10px; }
            .title { font-size: 28px; margin-bottom: 10px; color: #333; }
            .success-icon { font-size: 48px; color: #10b981; margin-bottom: 20px; }
            .content { margin-bottom: 30px; }
            .details-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 20px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
            .detail-label { font-weight: 600; color: #4a5568; }
            .detail-value { color: #2d3748; }
            .btn { display: inline-block; background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
            .footer { font-size: 14px; color: #666; text-align: center; border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🚀 AutoDevelop.ai</div>
              <div class="success-icon">✅</div>
              <h1 class="title">Payment Successful!</h1>
            </div>
            
            <div class="content">
              <p>Hi ${name},</p>
              
              <p>Thank you for your payment! Your ${planType} subscription has been successfully renewed.</p>
              
              <div class="details-box">
                <div class="detail-row">
                  <span class="detail-label">Amount:</span>
                  <span class="detail-value">${currency} ${amount}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Plan:</span>
                  <span class="detail-value">${planType.charAt(0).toUpperCase() + planType.slice(1)}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Transaction ID:</span>
                  <span class="detail-value">${transactionId}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Next Billing Date:</span>
                  <span class="detail-value">${new Date(nextBillingDate).toLocaleDateString()}</span>
                </div>
              </div>
              
              <p>Your subscription is now active and you have full access to all ${planType} features.</p>
              
              <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" class="btn">Access Dashboard</a>
              </div>
            </div>
            
            <div class="footer">
              <p>If you have any questions, please contact our support team.</p>
              <p>© 2025 AutoDevelop.ai. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    return this.sendEmail(msg, 'payment-success');
  }

  async sendPaymentFailedEmail(email, name, paymentData) {
    const { amount, currency, planType, failureReason, nextRetryDate } = paymentData;
    
    const msg = {
      to: email,
      from: process.env.FROM_EMAIL || 'noreply@autodevelop.ai',
      subject: 'Payment Failed - Action Required - AutoDevelop.ai',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Payment Failed</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #4f46e5; margin-bottom: 10px; }
            .title { font-size: 28px; margin-bottom: 10px; color: #333; }
            .warning-icon { font-size: 48px; color: #ef4444; margin-bottom: 20px; }
            .content { margin-bottom: 30px; }
            .details-box { background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 20px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
            .detail-label { font-weight: 600; color: #4a5568; }
            .detail-value { color: #2d3748; }
            .btn { display: inline-block; background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
            .btn-secondary { background-color: #6b7280; }
            .footer { font-size: 14px; color: #666; text-align: center; border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🚀 AutoDevelop.ai</div>
              <div class="warning-icon">⚠️</div>
              <h1 class="title">Payment Failed</h1>
            </div>
            
            <div class="content">
              <p>Hi ${name},</p>
              
              <p>We were unable to process your payment for your ${planType} subscription. Please update your payment method to continue using AutoDevelop.ai.</p>
              
              <div class="details-box">
                <div class="detail-row">
                  <span class="detail-label">Amount:</span>
                  <span class="detail-value">${currency} ${amount}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Plan:</span>
                  <span class="detail-value">${planType.charAt(0).toUpperCase() + planType.slice(1)}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Reason:</span>
                  <span class="detail-value">${failureReason || 'Payment method declined'}</span>
                </div>
                ${nextRetryDate ? `
                <div class="detail-row">
                  <span class="detail-label">Next Retry:</span>
                  <span class="detail-value">${new Date(nextRetryDate).toLocaleDateString()}</span>
                </div>
                ` : ''}
              </div>
              
              <p>To avoid service interruption, please update your payment method immediately.</p>
              
              <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/billing" class="btn">Update Payment Method</a>
                <br><br>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/support" class="btn btn-secondary">Contact Support</a>
              </div>
            </div>
            
            <div class="footer">
              <p>If you have questions, please contact our support team immediately.</p>
              <p>© 2025 AutoDevelop.ai. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    return this.sendEmail(msg, 'payment-failed');
  }

  async sendRenewalReminderEmail(email, name, renewalData) {
    const { amount, currency, planType, renewalDate, daysUntilRenewal } = renewalData;
    
    const msg = {
      to: email,
      from: process.env.FROM_EMAIL || 'noreply@autodevelop.ai',
      subject: `Your AutoDevelop.ai subscription renews in ${daysUntilRenewal} days`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Subscription Renewal Reminder</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #4f46e5; margin-bottom: 10px; }
            .title { font-size: 28px; margin-bottom: 10px; color: #333; }
            .info-icon { font-size: 48px; color: #3b82f6; margin-bottom: 20px; }
            .content { margin-bottom: 30px; }
            .details-box { background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 6px; padding: 20px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
            .detail-label { font-weight: 600; color: #4a5568; }
            .detail-value { color: #2d3748; }
            .btn { display: inline-block; background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
            .btn-secondary { background-color: #6b7280; }
            .footer { font-size: 14px; color: #666; text-align: center; border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🚀 AutoDevelop.ai</div>
              <div class="info-icon">📅</div>
              <h1 class="title">Renewal Reminder</h1>
            </div>
            
            <div class="content">
              <p>Hi ${name},</p>
              
              <p>Your ${planType} subscription will automatically renew in ${daysUntilRenewal} day${daysUntilRenewal === 1 ? '' : 's'}.</p>
              
              <div class="details-box">
                <div class="detail-row">
                  <span class="detail-label">Plan:</span>
                  <span class="detail-value">${planType.charAt(0).toUpperCase() + planType.slice(1)}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Renewal Date:</span>
                  <span class="detail-value">${new Date(renewalDate).toLocaleDateString()}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Amount:</span>
                  <span class="detail-value">${currency} ${amount}</span>
                </div>
              </div>
              
              <p>Your payment method will be automatically charged. No action is required unless you want to make changes.</p>
              
              <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/billing" class="btn">Manage Subscription</a>
                <br><br>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/billing/cancel" class="btn btn-secondary">Cancel Subscription</a>
              </div>
            </div>
            
            <div class="footer">
              <p>Thank you for being a valued AutoDevelop.ai customer!</p>
              <p>© 2025 AutoDevelop.ai. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    return this.sendEmail(msg, 'renewal-reminder');
  }
}

module.exports = new EmailService();