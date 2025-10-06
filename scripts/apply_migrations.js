#!/usr/bin/env node
/*
  Usage:
    # install pg first: pnpm add pg
    # use DATABASE_URL from .env.local or pass connection string as first arg
    node scripts/apply_migrations.js "postgresql://user:pass@host:port/db" migrations/20251006-add-points-earned.sql
    or
    DATABASE_URL="postgresql://..." node scripts/apply_migrations.js migrations/20251006-add-points-earned.sql

  This script runs the provided SQL files sequentially.
*/
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function run() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Usage: [DATABASE_URL=...] node scripts/apply_migrations.js <file1.sql> [file2.sql ...]');
    process.exit(1);
  }

  // If first arg looks like a connection string, use it; otherwise use env DATABASE_URL
  let conn = process.env.DATABASE_URL;
  let files = args;
  if (args[0] && args[0].startsWith('postgres')) {
    conn = args[0];
    files = args.slice(1);
  }

  if (!conn) {
    console.error('DATABASE_URL not provided. Set env var or pass as first argument.');
    process.exit(1);
  }

  if (files.length === 0) {
    console.error('No SQL files provided.');
    process.exit(1);
  }

  const client = new Client({ connectionString: conn });
  try {
    await client.connect();
    for (const f of files) {
      const filePath = path.resolve(f);
      console.log(`Applying migration: ${filePath}`);
      const sql = fs.readFileSync(filePath, 'utf8');
      // Split on semicolon followed by newline to allow multiple statements; simple but works for our files
      // Use a single query to preserve statements order
      await client.query(sql);
      console.log(`Applied: ${filePath}`);
    }
    console.log('Migrations applied successfully');
  } catch (err) {
    console.error('Migration failed:', err.message || err);
    process.exitCode = 2;
  } finally {
    await client.end();
  }
}

run();
