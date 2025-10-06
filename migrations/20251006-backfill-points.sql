-- Backfill points_earned based on existing solved problems
-- Grants 100 points per solved problem recorded in problems_users

BEGIN;

-- Ensure points_earned column exists before running this
UPDATE users u
SET points_earned = COALESCE(sub.solved_count, 0) * 100
FROM (
  SELECT userid, COUNT(*) as solved_count
  FROM problems_users
  WHERE is_completed = 'solved'
  GROUP BY userid
) sub
WHERE u.id = sub.userid;

-- Optionally populate user_points_log for each solved problem (best-effort)
-- This will insert one row per solved problem if user_points_log exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_points_log') THEN
    INSERT INTO user_points_log (userid, problemid, points)
    SELECT userid, problemid, 100 FROM problems_users WHERE is_completed = 'solved';
  END IF;
END$$;

COMMIT;

-- Run with:
-- psql "postgresql://user:pass@host:port/dbname" -f migrations/20251006-backfill-points.sql
