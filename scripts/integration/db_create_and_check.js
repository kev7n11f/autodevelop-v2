const { spawnSync } = require('child_process');
const database = require('../../backend/utils/database');

async function main() {
  try {
    const testEmail = `direct-persist-${Date.now()}@example.com`;
    const userData = {
      email: testEmail,
      password_hash: 'hashedpasswordplaceholder',
      name: 'Direct Persist',
      avatarUrl: null,
      locale: 'en',
      verifiedEmail: false
    };

    console.log('Connecting to DB and creating user...');
    await database.connect();
    const created = await database.createUserWithPassword(userData).catch(err => { throw err; });
    console.log('User created:', { id: created.id, email: created.email });

    // Close DB connection
    database.close();

    // Spawn a child process to check DB directly (simulates a restart)
    const checker = `const db = require('./backend/utils/database'); (async()=>{ await db.connect(); const u = await db.getUserByEmail('${testEmail}'); console.log(JSON.stringify(u||null)); process.exit(u?0:2); })()`;
    const res = spawnSync(process.execPath, ['-e', checker], { encoding: 'utf8' });

    console.log('Checker stdout:', res.stdout.trim());
    console.log('Checker stderr:', res.stderr.trim());
    console.log('Checker exit code:', res.status);

    if (res.status === 0) process.exit(0);
    process.exit(3);
  } catch (err) {
    console.error('Error in db_create_and_check:', err);
    process.exit(4);
  }
}

main();
