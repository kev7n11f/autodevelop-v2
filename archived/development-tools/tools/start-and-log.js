const fs = require('fs');
const app = require('../backend/server');
// If server exports an app but not started, start it
(async () => {
  fs.writeFileSync('tools/server-log.txt', 'STARTING\n');
  try {
    if (app && app.listen) {
      const server = app.listen(0, '127.0.0.1', () => {
        const addr = server.address();
        fs.appendFileSync('tools/server-log.txt', 'LISTENING ' + JSON.stringify(addr) + '\n');
        // Close immediately after confirmation
        server.close(() => fs.appendFileSync('tools/server-log.txt', 'CLOSED\n'));
      });
      server.on('error', (err) => {
        fs.appendFileSync('tools/server-log.txt', 'ERROR:' + (err && err.stack ? err.stack : err) + '\n');
        process.exit(1);
      });
    } else {
      fs.appendFileSync('tools/server-log.txt', 'APP_NO_LISTEN\n');
    }
  } catch (e) {
    fs.appendFileSync('tools/server-log.txt', 'EXCEPTION:' + (e && e.stack ? e.stack : e) + '\n');
    process.exit(1);
  }
})();
