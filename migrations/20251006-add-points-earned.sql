-- Migration: Add points_earned column to users and optional audit table
-- Run this on your Postgres database. Adjust schema/owner as needed.

BEGIN;

-- Add points_earned column (default 0) if it doesn't already exist
ALTER TABLE users
ADD COLUMN IF NOT EXISTS points_earned INTEGER DEFAULT 0;

-- Ensure existing student users have a defined points value (optional)
UPDATE users SET points_earned = 0 WHERE role = 'student' AND points_earned IS NULL;

-- Optional audit table to record awarded points per user/problem
CREATE TABLE IF NOT EXISTS user_points_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userid UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  problemid UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  awarded_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

COMMIT;

-- Notes:
-- 1) gen_random_uuid() requires the pgcrypto or pgcrypto-like extension; if not available use uuid_generate_v4()
-- 2) Run this migration with psql or your DB migration tool. Example:
--    psql "postgresql://user:pass@host:port/dbname" -f migrations/20251006-add-points-earned.sql
