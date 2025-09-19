const fetch = require('node-fetch');
const database = require('../../backend/utils/database');

async function run() {
  try {
    const testEmail = `persist-test-${Date.now()}@example.com`;
    const payload = { email: testEmail, password: 'Str0ngP@ssword!', name: 'Persist Test' };

    console.log('Posting registration to server...');
    const res = await fetch('http://localhost:3001/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const body = await res.json().catch(() => ({}));
    console.log('Register response status:', res.status, body);

    // Give DB a moment (server writes session, etc.)
    await new Promise(r => setTimeout(r, 300));

    console.log('Checking DB directly via backend database module...');
    // Ensure database module is connected (it should be via server), but connect if needed
    try {
      await database.connect();
    } catch (e) {
      // ignore if already connected
    }

    const user = await database.getUserByEmail(testEmail).catch(err => {
      console.error('Error querying DB:', err.message);
      return null;
    });

    if (user) {
      console.log('User persisted in DB:', { id: user.id, email: user.email });
      process.exit(0);
    } else {
      console.error('User not found in DB - persistence failure');
      process.exit(2);
    }
  } catch (err) {
    console.error('Integration test failed:', err);
    process.exit(3);
  }
}

run();
