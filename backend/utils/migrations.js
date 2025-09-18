const logger = require('./logger');
const db = require('./database');

/**
 * Run deterministic schema migrations required for current app version.
 * Keep migrations idempotent and safe to run on every startup.
 */
async function runMigrations() {
  logger.info('Running deterministic DB migrations');

  // 1) Ensure users.google_id allows NULL (migrate if necessary)
  try {
    const info = await new Promise((resolve) => {
      db.db.all(`PRAGMA table_info(users)`, [], (err, rows) => resolve(rows || []));
    });
    const hasGoogleId = info.some(r => r.name === 'google_id');
    // If google_id exists but has a NOT NULL constraint, we rely on existing migrate helper
    // The helper internally tests inserting null and migrates if needed.
    if (hasGoogleId) {
      logger.info('Checking users.google_id nullability');
      try {
        // Attempt to insert a test row to detect NOT NULL constraint; the helper used earlier can migrate
        await db.ensureCustomAuthColumns();
      } catch (err) {
        logger.warn('ensureCustomAuthColumns encountered error during migration check', { error: err.message });
      }
    }
  } catch (err) {
    logger.error('Error checking users table schema during migrations:', { error: err.message });
  }

  // 2) Ensure user_sessions has session_token NOT NULL (we handle by ensuring column exists and using defaults if possible)
  try {
    const info = await new Promise((resolve) => {
      db.db.all(`PRAGMA table_info(user_sessions)`, [], (err, rows) => resolve(rows || []));
    });

    const hasSessionToken = info.some(r => r.name === 'session_token');
    if (!hasSessionToken) {
      // Add column defensively (should not occur because table is created earlier), set TEXT
      await db.runQuery(`ALTER TABLE user_sessions ADD COLUMN session_token TEXT`);
      logger.info('Added missing session_token column to user_sessions');
    }

    // Ensure indexes for lookup performance
    await db.runQuery(`CREATE INDEX IF NOT EXISTS idx_user_sessions_session_token ON user_sessions(session_token)`);
    await db.runQuery(`CREATE INDEX IF NOT EXISTS idx_user_sessions_refresh_token ON user_sessions(refresh_token)`);
  } catch (err) {
    logger.error('Error ensuring user_sessions schema/indexes during migrations:', { error: err.message });
  }

  logger.info('DB migrations completed');
}

module.exports = { runMigrations };
