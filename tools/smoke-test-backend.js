const http = require('http');

const url = process.env.BACKEND_URL || 'http://127.0.0.1:8080/autodevelop.ai/health';
const timeout = 5000;

function fail(msg) {
  console.error('SMOKE_TEST_FAIL', msg);
  process.exit(1);
}

const req = http.get(url, { timeout }, (res) => {
  let body = '';
  res.on('data', (d) => body += d);
  res.on('end', () => {
    try {
      const json = JSON.parse(body);
      if (json && (json.status === 'ok' || json.status === 'healthy')) {
        console.log('SMOKE_TEST_OK', url);
        process.exit(0);
      }
      fail('Unhealthy response: ' + JSON.stringify(json));
    } catch (e) {
      fail('Invalid JSON response: ' + e.message + ' body=' + body.slice(0, 200));
    }
  });
});

req.on('error', (e) => fail('Request error: ' + e.message));
req.on('timeout', () => { req.destroy(); fail('Request timed out'); });
