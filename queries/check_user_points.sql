-- Replace the USER_ID and PROBLEM_ID values before running or pass via your client
-- Check user's total points and whether problem is marked solved

-- Set these values when running manually or edit the file
\set USER_ID '12819fd2-fe1f-4bf0-be6b-47cfdf7e1986'
\set PROBLEM_ID 'fb8da709-963a-4c26-850e-de0a3982f6c7'

SELECT id, name, email, role, COALESCE(points_earned,0) AS points_earned
FROM users
WHERE id = :'USER_ID';

SELECT * FROM problems_users WHERE userid = :'USER_ID' AND problemid = :'PROBLEM_ID';

SELECT * FROM user_points_log WHERE userid = :'USER_ID' AND problemid = :'PROBLEM_ID' ORDER BY awarded_at DESC;
