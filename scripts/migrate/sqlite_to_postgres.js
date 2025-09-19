const sqlite3 = require('sqlite3').verbose();
const { Client } = require('pg');
const path = require('path');
const logger = require('../../backend/utils/logger');

async function migrate() {
  const sqlitePath = process.env.SQLITE_PATH || path.join(__dirname, '..', '..', 'backend', 'data', 'mailing_list.db');
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL must be set to run migration');

  // Open sqlite
  const sqlDb = new sqlite3.Database(sqlitePath);
  const pg = new Client({ connectionString: databaseUrl });
  await pg.connect();

  try {
    // Users
    await migrateTable(sqlDb, pg, 'users', [`id`,`google_id`,`email`,`password_hash`,`name`,`avatar_url`,`locale`,`verified_email`,`created_at`,`updated_at`,`last_login_at`]);

    // user_sessions
    await migrateTable(sqlDb, pg, 'user_sessions', [`id`,`user_id`,`session_token`,`refresh_token`,`expires_at`,`created_at`,`last_accessed_at`,`ip_address`,`user_agent`]);

    // mailing_list_subscribers
    await migrateTable(sqlDb, pg, 'mailing_list_subscribers', [`id`,`email`,`name`,`subscribed_at`,`confirmed`,`confirmation_token`,`unsubscribe_token`,`status`,`last_confirmation_sent`,`last_unsubscribe_request`,`last_subscribe_attempt`,`subscribe_attempts`,`confirmed_at`,`unsubscribed_at`,`ip`,`user_agent`,`source`,`consent_version`]);

    // payment_subscriptions
    await migrateTable(sqlDb, pg, 'payment_subscriptions', [`id`,`user_id`,`email`,`name`,`plan_type`,`status`,`current_period_start`,`current_period_end`,`next_billing_date`,`amount`,`currency`,`payment_method`,`created_at`,`updated_at`,`stripe_customer_id`,`stripe_subscription_id`,`stripe_price_id`,`stripe_product_id`,`plan_interval`,`cancel_at_period_end`]);

    // payment_events
    await migrateTable(sqlDb, pg, 'payment_events', [`id`,`user_id`,`subscription_id`,`event_type`,`amount`,`currency`,`payment_method`,`transaction_id`,`failure_reason`,`metadata`,`processed_at`,`notification_sent`]);

    // usage_counters
    await migrateTable(sqlDb, pg, 'usage_counters', [`user_id`,`message_count`,`period_start`,`monthly_message_count`,`monthly_period_start`]);

    // usage_events
    await migrateTable(sqlDb, pg, 'usage_events', [`id`,`user_id`,`event_type`,`daily_count`,`monthly_count`,`delta`,`ip`,`source`,`created_at`,`meta`]);

    // stripe_events
    await migrateTable(sqlDb, pg, 'stripe_events', [`id`,`stripe_event_id`,`type`,`payload_json`,`received_at`,`processed_at`,`status`,`error_message`]);

    logger.info('Migration completed');
  } finally {
    sqlDb.close();
    await pg.end();
  }
}

function migrateTable(sqlDb, pg, tableName, columns) {
  return new Promise((resolve, reject) => {
    const colList = columns.join(',');
    sqlDb.all(`SELECT ${colList} FROM ${tableName}`, async (err, rows) => {
      if (err) {
        // Table might not exist in sqlite — skip
        logger.warn(`Skipping ${tableName}: ${err.message}`);
        return resolve();
      }

      for (const row of rows) {
        const vals = columns.map(c => row[c]);
        const placeholders = columns.map((_, i) => `$${i+1}`).join(',');
        const upsertSQL = `INSERT INTO ${tableName} (${columns.join(',')}) VALUES (${placeholders}) ON CONFLICT (id) DO UPDATE SET ${columns.filter(c=>c!=='id').map((c,i)=>`${c}=EXCLUDED.${c}`).join(',')}`;
        try {
          await pg.query(upsertSQL, vals);
        } catch (e) {
          logger.warn(`Failed to upsert into ${tableName}: ${e.message}`);
        }
      }

      resolve();
    });
  });
}

if (require.main === module) {
  migrate().catch(err => { console.error(err); process.exit(2); });
}

module.exports = { migrate };
