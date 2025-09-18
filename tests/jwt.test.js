const assert = require('assert');
const jwt = require('jsonwebtoken');
// Ensure test runs with deterministic secret
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';

const authController = require('../backend/controllers/authController');
const authMiddleware = require('../backend/middleware/auth');

async function run() {
  console.log('Running JWT flow unit test...');

  // Create a fake user
  const user = { id: 'u123', email: 'test@example.com', name: 'Tester' };

  // Generate tokens
  const tokens = authController.generateTokens(user);
  assert(tokens && tokens.accessToken && tokens.refreshToken, 'Tokens should be returned');

  // Verify access token is a valid JWT
  const decoded = jwt.verify(tokens.accessToken, process.env.JWT_SECRET);
  assert.strictEqual(decoded.email, user.email, 'JWT payload should include email');

  // Test authenticateToken middleware behavior (simulate express req/res)
  const req = { cookies: { accessToken: tokens.accessToken }, headers: {} };
  const res = { status: () => ({ json: () => {} }), cookie: () => {}, clearCookie: () => {} };

  let nextCalled = false;
  await new Promise((resolve) => {
    authMiddleware.authenticateToken(req, res, () => {
      nextCalled = true;
      resolve();
    });
  });

  assert(nextCalled, 'authenticateToken should call next() for valid token');
  assert(req.user && req.user.email === user.email, 'req.user should be populated by middleware');

  console.log('JWT flow unit test passed');
  process.exit(0);
}

run().catch((err) => {
  console.error('JWT test failed:', err);
  process.exit(1);
});
