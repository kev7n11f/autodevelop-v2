#!/usr/bin/env node
/**
 * reset-test-usage.js
 * Utility to reset usage counters in the local SQLite DB so integration tests start from a clean state.
 * Usage: node scripts/reset-test-usage.js
 */
const db = require('../backend/utils/database');

(async function main() {
  try {
    // utils/database exports an instance which needs connect() called
    await db.connect();
    console.log('Connected to DB at', db.dbPath || 'unknown');

    // Reset all usage counters (for test runs) - this is safe for local/dev only
    const resetSql = `UPDATE usage_counters SET message_count = 0, monthly_message_count = 0, period_start = CURRENT_TIMESTAMP, monthly_period_start = CURRENT_TIMESTAMP`;
    await db.runQuery(resetSql);

    // Log an audit event to indicate reset
    await db.runQuery(`INSERT INTO usage_events (user_id, event_type, daily_count, monthly_count, delta, ip, source) VALUES (?, 'usage_reset', 0, 0, 0, '127.0.0.1', 'test-run')`, ['system']);

    console.log('Usage counters reset for all users.');
    process.exit(0);
  } catch (err) {
    console.error('Failed to reset usage counters:', err.message);
    process.exit(1);
  }
})();
