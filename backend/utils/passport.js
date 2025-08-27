const passport = require('passport');
// const GoogleStrategy = require('passport-google-oauth20').Strategy;
const database = require('./database');
const logger = require('./logger');

/* 
 * ARCHIVED GOOGLE OAUTH CODE (for future restoration)
 * To re-enable Google OAuth:
 * 1. Uncomment the GoogleStrategy import above
 * 2. Uncomment the configuration block below
 * 3. Update .env with GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
 * 4. Uncomment Google OAuth routes in authRoutes.js
 * 5. Update frontend to include Google login option
 */

/*
// Google OAuth configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:8080/api/auth/google/callback';

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  logger.warn('Google OAuth credentials not configured. Google authentication will not be available.');
} else {
  // Configure Google OAuth strategy only if credentials are available
  passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: GOOGLE_CALLBACK_URL,
    scope: ['profile', 'email']
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const googleId = profile.id;
      const email = profile.emails?.[0]?.value;
      const name = profile.displayName;
      const avatarUrl = profile.photos?.[0]?.value;
      const locale = profile._json?.locale;
      const verifiedEmail = profile.emails?.[0]?.verified || false;

      if (!email) {
        logger.warn('Google OAuth profile missing email', { googleId, name });
        return done(new Error('Email is required'), null);
      }

      // Check if user already exists
      let user = await database.getUserByGoogleId(googleId);
      
      if (user) {
        // Update user info in case it changed
        logger.info('Existing user logging in via Google OAuth', {
          userId: user.id,
          email: user.email
        });
        return done(null, user);
      }

      // Check if user exists with same email but different Google ID
      const existingEmailUser = await database.getUserByEmail(email);
      if (existingEmailUser) {
        logger.warn('User with same email already exists with different Google ID', {
          email,
          existingUserId: existingEmailUser.id,
          newGoogleId: googleId
        });
        return done(new Error('An account with this email already exists. Please contact support.'), null);
      }

      // Create new user
      const userData = {
        googleId,
        email,
        name,
        avatarUrl,
        locale,
        verifiedEmail
      };

      user = await database.createUser(userData);
      
      logger.info('New user created via Google OAuth', {
        userId: user.id,
        email: user.email
      });

      return done(null, user);
    } catch (error) {
      logger.error('Error in Google OAuth strategy:', {
        error: error.message,
        stack: error.stack,
        googleId: profile?.id
      });
      return done(error, null);
    }
  }));
}
*/

// Serialize user for session (not used with JWT, but required by Passport)
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session (not used with JWT, but required by Passport)
passport.deserializeUser(async (id, done) => {
  try {
    const user = await database.getUserById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;