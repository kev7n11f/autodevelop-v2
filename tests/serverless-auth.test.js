const jwtService = require('../src/utils/jwt');
const passwordService = require('../src/utils/password');

// Test data
const testUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User'
};

const testPassword = 'TestPassword123!';
const weakPassword = '123';

// Simple test runner
async function runTests() {
  console.log('🧪 Running Serverless Auth Tests...\n');

  let totalTests = 0;
  let passedTests = 0;

  // Helper function to run a test
  const runTest = async (name, testFn) => {
    totalTests++;
    try {
      await testFn();
      console.log(`  ✅ ${name}`);
      passedTests++;
    } catch (error) {
      console.log(`  ❌ ${name}: ${error.message}`);
    }
  };

  console.log('📝 JWT Service Tests:');

  await runTest('should generate access token', () => {
    const token = jwtService.generateAccessToken(testUser);
    if (!token || typeof token !== 'string') {
      throw new Error('Token not generated or invalid type');
    }
  });

  await runTest('should generate refresh token', () => {
    const token = jwtService.generateRefreshToken();
    if (!token || typeof token !== 'string' || token.length !== 64) {
      throw new Error('Refresh token not generated correctly');
    }
  });

  await runTest('should generate both tokens', () => {
    const tokens = jwtService.generateTokens(testUser);
    if (!tokens.accessToken || !tokens.refreshToken || !tokens.expiresIn) {
      throw new Error('Token generation incomplete');
    }
  });

  await runTest('should verify valid access token', () => {
    const token = jwtService.generateAccessToken(testUser);
    const verification = jwtService.verifyAccessToken(token);
    
    if (!verification.valid || verification.payload.id !== testUser.id) {
      throw new Error('Token verification failed');
    }
  });

  await runTest('should reject invalid access token', () => {
    const verification = jwtService.verifyAccessToken('invalid-token');
    if (verification.valid) {
      throw new Error('Invalid token was accepted');
    }
  });

  await runTest('should extract token from header', () => {
    const token = 'test-token';
    const bearerHeader = `Bearer ${token}`;
    
    if (jwtService.extractTokenFromHeader(bearerHeader) !== token) {
      throw new Error('Failed to extract token from Bearer header');
    }
    if (jwtService.extractTokenFromHeader(token) !== token) {
      throw new Error('Failed to extract plain token');
    }
    if (jwtService.extractTokenFromHeader(null) !== null) {
      throw new Error('Should return null for empty header');
    }
  });

  console.log('\n📝 Password Service Tests:');

  await runTest('should hash password', async () => {
    const hash = await passwordService.hashPassword(testPassword);
    if (!hash || typeof hash !== 'string' || hash === testPassword) {
      throw new Error('Password not hashed correctly');
    }
  });

  await runTest('should verify correct password', async () => {
    const hash = await passwordService.hashPassword(testPassword);
    const isValid = await passwordService.verifyPassword(testPassword, hash);
    if (!isValid) {
      throw new Error('Correct password not verified');
    }
  });

  await runTest('should reject incorrect password', async () => {
    const hash = await passwordService.hashPassword(testPassword);
    const isValid = await passwordService.verifyPassword('wrongpassword', hash);
    if (isValid) {
      throw new Error('Incorrect password was accepted');
    }
  });

  await runTest('should validate strong password', () => {
    const validation = passwordService.validatePassword(testPassword);
    if (!validation.valid || validation.errors.length > 0) {
      throw new Error('Strong password rejected');
    }
  });

  await runTest('should reject weak password', () => {
    const validation = passwordService.validatePassword(weakPassword);
    if (validation.valid || validation.errors.length === 0) {
      throw new Error('Weak password accepted');
    }
  });

  await runTest('should generate secure password', () => {
    const password = passwordService.generateSecurePassword(16);
    if (!password || password.length !== 16) {
      throw new Error('Secure password not generated correctly');
    }
    
    const validation = passwordService.validatePassword(password);
    if (!validation.valid) {
      throw new Error('Generated password is not valid');
    }
  });

  console.log(`\n📊 Test Results: ${passedTests}/${totalTests} passed (${Math.round(passedTests/totalTests*100)}%)`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed!');
    process.exit(0);
  } else {
    console.log('💥 Some tests failed');
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests };