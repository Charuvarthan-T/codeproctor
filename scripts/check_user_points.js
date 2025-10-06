#!/usr/bin/env node
/*
Usage:
  # with connection string and IDs
  node scripts/check_user_points.js "postgresql://user:pass@host:port/db" <userId> <problemId>

  # or with DATABASE_URL env:
  DATABASE_URL="postgresql://..." node scripts/check_user_points.js <userId> <problemId>
*/
const { Client } = require('pg');

async function run() {
  const args = process.argv.slice(2);
  let conn = process.env.DATABASE_URL;

  let userId, problemId;
  if (args.length === 3 && args[0].startsWith('postgres')) {
    conn = args[0];
    userId = args[1];
    problemId = args[2];
  } else if (args.length >= 2) {
    userId = args[0];
    problemId = args[1];
  }

  if (!conn) {
    console.error('Missing connection string. Set DATABASE_URL or pass connection string as first arg.');
    process.exit(1);
  }
  if (!userId || !problemId) {
    console.error('Usage: node scripts/check_user_points.js [CONN_STR] <userId> <problemId>');
    process.exit(1);
  }

  const client = new Client({ connectionString: conn });
  try {
    await client.connect();

    const userRes = await client.query('SELECT id, name, email, role, COALESCE(points_earned,0) AS points_earned FROM users WHERE id = $1', [userId]);
    console.log('User:');
    console.log(userRes.rows[0] || 'Not found');

    const puRes = await client.query('SELECT * FROM problems_users WHERE userid = $1 AND problemid = $2', [userId, problemId]);
    console.log('\nproblems_users:');
    console.log(puRes.rows.length ? puRes.rows : 'Not found');

    // user_points_log may or may not exist
    const logExistsRes = await client.query("SELECT to_regclass('public.user_points_log') as exists");
    if (logExistsRes.rows[0]?.exists) {
      const logRes = await client.query('SELECT * FROM user_points_log WHERE userid = $1 AND problemid = $2 ORDER BY awarded_at DESC', [userId, problemId]);
      console.log('\nuser_points_log:');
      console.log(logRes.rows.length ? logRes.rows : 'No log entries');
    } else {
      console.log('\nuser_points_log table does not exist');
    }

  } catch (err) {
    console.error('Error querying DB:', err.message || err);
  } finally {
    await client.end();
  }
}

run();
