-- Contest Feature Migration
-- Run this SQL to create all necessary tables for the contest/quiz feature

-- =====================================================
-- 1. Create contests table
-- =====================================================
CREATE TABLE IF NOT EXISTS contests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES users(id),
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  duration_minutes INTEGER,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- =====================================================
-- 2. Create contests_problems junction table
-- =====================================================
CREATE TABLE IF NOT EXISTS contests_problems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id UUID NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
  problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  points INTEGER DEFAULT 10,
  order_index INTEGER,
  UNIQUE(contest_id, problem_id)
);

-- =====================================================
-- 3. Create contests_sections junction table
-- =====================================================
CREATE TABLE IF NOT EXISTS contests_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id UUID NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
  section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  UNIQUE(contest_id, section_id)
);

-- =====================================================
-- 4. Create contest_submissions table
-- =====================================================
CREATE TABLE IF NOT EXISTS contest_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id UUID NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  is_solved BOOLEAN DEFAULT false,
  points_earned INTEGER DEFAULT 0,
  submission_time TIMESTAMP DEFAULT now(),
  started_at TIMESTAMP,
  UNIQUE(contest_id, user_id, problem_id)
);

-- =====================================================
-- 5. Create indexes for performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_contests_created_by ON contests(created_by);
CREATE INDEX IF NOT EXISTS idx_contests_active ON contests(is_active);
CREATE INDEX IF NOT EXISTS idx_contests_time ON contests(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_contests_problems_contest ON contests_problems(contest_id);
CREATE INDEX IF NOT EXISTS idx_contests_problems_problem ON contests_problems(problem_id);
CREATE INDEX IF NOT EXISTS idx_contests_sections_contest ON contests_sections(contest_id);
CREATE INDEX IF NOT EXISTS idx_contests_sections_section ON contests_sections(section_id);
CREATE INDEX IF NOT EXISTS idx_contest_submissions_contest ON contest_submissions(contest_id);
CREATE INDEX IF NOT EXISTS idx_contest_submissions_user ON contest_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_contest_submissions_contest_user ON contest_submissions(contest_id, user_id);

-- =====================================================
-- Migration Complete!
-- =====================================================
-- You can now:
-- 1. Create contests via the UI at /contests
-- 2. Add problems to contests
-- 3. Assign sections to contests
-- 4. Track student submissions
-- 5. View leaderboards
