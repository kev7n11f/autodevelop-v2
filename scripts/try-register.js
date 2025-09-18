const fs = require('fs');
const path = require('path');

async function run() {
  try {
    const email = `node-cli-${Date.now()}@example.com`;
    const payload = { email, password: 'TestPass1!', name: 'Node CLI' };
    console.log('Registering:', email);

    const res = await fetch('http://localhost:3001/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    console.log('Status:', res.status);
    console.log('Response body:', text);

    // Print recent backend logs if available
    const logPath = path.join(__dirname, '..', 'backend', 'logs', 'app.log');
    if (fs.existsSync(logPath)) {
      const all = fs.readFileSync(logPath, 'utf8').split('\n');
      const tail = all.slice(-120).join('\n');
      console.log('\n--- last 120 log lines ---\n' + tail);
    } else {
      console.log('No backend log found at', logPath);
    }
  } catch (err) {
    console.error('Request failed:', err.message);
  }
}

run();
