const authController = require('../backend/controllers/authController');
const database = require('../backend/utils/database');

function createMockReq(body = {}, ip = '127.0.0.1', headers = {}) {
  return { body, ip, get: (h) => headers[h] || headers[h.toLowerCase()] };
}

function createMockRes() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(obj) { this.body = obj; return this; },
    cookie() { return this; },
    clearCookie() { return this; }
  };
}

async function run() {
  console.log('Starting register tests (manual)');

  // Ensure DB connected
  await database.connect();

  // Test 1: missing fields
  let req = createMockReq({ email: 'a@b.com' });
  let res = createMockRes();
  await authController.register(req, res);
  console.log('Test missing fields status:', res.statusCode, res.body);

  // Test 2: valid registration
  const unique = `test-node-${Date.now()}@example.com`;
  req = createMockReq({ email: unique, password: 'Aa1!aaaa', name: 'Node Test' }, '127.0.0.1');
  res = createMockRes();
  await authController.register(req, res);
  console.log('Test valid registration status:', res.statusCode, res.body && res.body.user && res.body.user.email);

  // Test 3: duplicate registration
  req = createMockReq({ email: unique, password: 'Aa1!aaaa', name: 'Node Test' }, '127.0.0.1');
  res = createMockRes();
  await authController.register(req, res);
  console.log('Test duplicate registration status:', res.statusCode, res.body);

  process.exit(0);
}

run().catch(err => {
  console.error('Test run failed:', err);
  process.exit(1);
});
