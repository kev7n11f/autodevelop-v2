const router = require('express').Router();
const passport = require('../utils/passport');
const { 
  googleCallback, 
  getCurrentUser, 
  logout, 
  refreshToken, 
  cleanupExpiredSessions 
} = require('../controllers/authController');
const { 
  authenticateToken, 
  optionalAuth, 
  requireAuth, 
  generateOAuthState, 
  csrfProtection 
} = require('../middleware/auth');

// Google OAuth routes
router.get('/google', generateOAuthState, (req, res, next) => {
  const state = req.oauthState;
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    state: state
  })(req, res, next);
});

router.get('/google/callback', 
  csrfProtection,
  passport.authenticate('google', { 
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=auth_failed`
  }),
  googleCallback
);

// User management routes
router.get('/me', authenticateToken, getCurrentUser);
router.post('/logout', optionalAuth, logout);
router.post('/refresh', refreshToken);

// Admin routes
router.post('/cleanup-sessions', cleanupExpiredSessions);

// Auth status check (public endpoint)
router.get('/status', optionalAuth, (req, res) => {
  res.json({
    authenticated: !!req.user,
    user: req.user ? {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      avatarUrl: req.user.avatar_url
    } : null
  });
});

module.exports = router;