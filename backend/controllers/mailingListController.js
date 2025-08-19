const database = require('../utils/database');
const emailService = require('../utils/emailService');
const logger = require('../utils/logger');

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Sanitize input to prevent XSS
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return '';
  return input.trim().replace(/[<>]/g, '');
};

// Subscribe to mailing list
const subscribe = async (req, res) => {
  try {
    const { email, name, optIn } = req.body;

    // Validate required fields
    if (!email || !name) {
      return res.status(400).json({
        error: 'Email and name are required',
        details: 'Please provide both your email address and name'
      });
    }

    // Check opt-in consent
    if (!optIn) {
      return res.status(400).json({
        error: 'Consent required',
        details: 'You must opt-in to subscribe to the mailing list'
      });
    }

    // Sanitize inputs
    const sanitizedEmail = sanitizeInput(email.toLowerCase());
    const sanitizedName = sanitizeInput(name);

    // Validate email format
    if (!emailRegex.test(sanitizedEmail)) {
      return res.status(400).json({
        error: 'Invalid email address',
        details: 'Please provide a valid email address'
      });
    }

    // Validate name length
    if (sanitizedName.length < 2 || sanitizedName.length > 100) {
      return res.status(400).json({
        error: 'Invalid name',
        details: 'Name must be between 2 and 100 characters'
      });
    }

    // Add subscriber to database
    const subscriber = await database.addSubscriber(sanitizedEmail, sanitizedName);

    // Send confirmation email
    try {
      await emailService.sendConfirmationEmail(
        sanitizedEmail, 
        sanitizedName, 
        subscriber.confirmationToken
      );
      
      logger.info(`Confirmation email sent to: ${sanitizedEmail}`);
    } catch (emailError) {
      logger.error('Error sending confirmation email:', emailError);
      // Don't fail the subscription if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Subscription successful! Please check your email to confirm.',
      details: 'A confirmation email has been sent to your email address'
    });

  } catch (error) {
    if (error.message === 'Email already subscribed') {
      return res.status(409).json({
        error: 'Email already subscribed',
        details: 'This email address is already subscribed to our mailing list'
      });
    }

    logger.error('Error in mailing list subscription:', error);
    res.status(500).json({
      error: 'Subscription failed',
      details: 'An error occurred while processing your subscription. Please try again.'
    });
  }
};

// Confirm email subscription
const confirmSubscription = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        error: 'Invalid confirmation link',
        details: 'The confirmation token is missing'
      });
    }

    // Get subscriber by token first to send welcome email
    const subscriber = await database.getSubscriberByToken(token, 'confirmation');
    
    if (!subscriber) {
      return res.status(400).json({
        error: 'Invalid or expired confirmation link',
        details: 'The confirmation link is invalid or has expired'
      });
    }

    if (subscriber.status === 'confirmed') {
      return res.status(200).json({
        success: true,
        message: 'Email already confirmed',
        details: 'Your email address has already been confirmed'
      });
    }

    // Confirm the subscription
    await database.confirmSubscriber(token);

    // Send welcome email
    try {
      await emailService.sendWelcomeEmail(
        subscriber.email,
        subscriber.name,
        subscriber.unsubscribe_token
      );
      logger.info(`Welcome email sent to: ${subscriber.email}`);
    } catch (emailError) {
      logger.error('Error sending welcome email:', emailError);
      // Don't fail the confirmation if welcome email fails
    }

    // Redirect to frontend with success message
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/?confirmed=true`);

  } catch (error) {
    logger.error('Error confirming subscription:', error);
    
    // Redirect to frontend with error
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/?confirmation_error=true`);
  }
};

// Unsubscribe from mailing list
const unsubscribe = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        error: 'Invalid unsubscribe link',
        details: 'The unsubscribe token is missing'
      });
    }

    // Get subscriber info first
    const subscriber = await database.getSubscriberByToken(token, 'unsubscribe');
    
    if (!subscriber) {
      return res.status(400).json({
        error: 'Invalid unsubscribe link',
        details: 'The unsubscribe link is invalid'
      });
    }

    // Unsubscribe the user
    await database.unsubscribeUser(token);

    // Redirect to frontend with success message
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/?unsubscribed=true`);

  } catch (error) {
    logger.error('Error unsubscribing user:', error);
    
    // Redirect to frontend with error
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/?unsubscribe_error=true`);
  }
};

// GDPR - Delete user data
const deleteUserData = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Email required',
        details: 'Please provide the email address to delete'
      });
    }

    const sanitizedEmail = sanitizeInput(email.toLowerCase());

    if (!emailRegex.test(sanitizedEmail)) {
      return res.status(400).json({
        error: 'Invalid email address',
        details: 'Please provide a valid email address'
      });
    }

    await database.deleteUserData(sanitizedEmail);

    res.status(200).json({
      success: true,
      message: 'Data deleted successfully',
      details: 'All your data has been permanently removed from our mailing list'
    });

  } catch (error) {
    if (error.message === 'Email not found') {
      return res.status(404).json({
        error: 'Email not found',
        details: 'No data found for the provided email address'
      });
    }

    logger.error('Error deleting user data:', error);
    res.status(500).json({
      error: 'Data deletion failed',
      details: 'An error occurred while deleting your data. Please try again.'
    });
  }
};

// Get subscription stats (admin only)
const getStats = async (req, res) => {
  try {
    // This would typically check for admin authentication
    const adminKey = req.headers['x-admin-key'];
    if (!adminKey || adminKey !== process.env.ADMIN_KEY) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const subscribers = await database.getAllConfirmedSubscribers();
    
    res.status(200).json({
      totalConfirmedSubscribers: subscribers.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error getting mailing list stats:', error);
    res.status(500).json({
      error: 'Failed to retrieve stats',
      details: 'An error occurred while retrieving subscription statistics'
    });
  }
};

module.exports = {
  subscribe,
  confirmSubscription,
  unsubscribe,
  deleteUserData,
  getStats
};