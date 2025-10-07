-- Check contests and their creators
SELECT 
    c.id,
    c.title,
    c.created_by,
    u.name as creator_name,
    u.email as creator_email,
    c.is_active,
    c.start_time,
    c.end_time,
    c.created_at
FROM contests c
LEFT JOIN users u ON c.created_by = u.id
ORDER BY c.created_at DESC;

-- Check if there are contests with missing users
SELECT 
    c.id,
    c.title,
    c.created_by,
    CASE 
        WHEN u.id IS NULL THEN 'USER DOES NOT EXIST'
        ELSE u.name
    END as creator_status
FROM contests c
LEFT JOIN users u ON c.created_by = u.id
WHERE u.id IS NULL;

-- Count total contests
SELECT COUNT(*) as total_contests FROM contests;

-- Count contests with valid creators
SELECT COUNT(*) as contests_with_valid_creators 
FROM contests c
INNER JOIN users u ON c.created_by = u.id;

-- If there's a mismatch, fix orphaned contests by assigning to first admin
-- UNCOMMENT TO RUN:
-- UPDATE contests 
-- SET created_by = (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
-- WHERE created_by NOT IN (SELECT id FROM users);
