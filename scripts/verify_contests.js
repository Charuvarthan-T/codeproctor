/**
 * Quick verification script to test contest visibility fix
 * 
 * Run this to verify contests are now visible:
 * node scripts/verify_contests.js
 */

// Note: This is a reference script. To actually test:
// 1. Open http://localhost:3000/contests in your browser
// 2. Check browser console for logs
// 3. Check server terminal for "All contests fetched: X contests"
// 4. Verify contests appear on the page

console.log(`
╔════════════════════════════════════════════════════════╗
║         Contest Visibility Fix Verification            ║
╚════════════════════════════════════════════════════════╝

✅ FIXED: Changed INNER JOIN to LEFT JOIN in contest queries
✅ FIXED: Added server-side logging for debugging
✅ READY: Contests with missing creators will now show

📋 Manual Verification Steps:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Open your browser to: http://localhost:3000/contests

2. Open DevTools (F12) → Console tab
   Look for:
   - "Fetching contests from: /api/contests isAdmin: true"
   - "Contests received: { contests: [...] }"

3. Check your server terminal
   Look for:
   - "All contests fetched: X contests"

4. Verify the page shows contests (not empty)

📊 Database Check:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Run this SQL query to check for orphaned contests:

SELECT 
    c.id,
    c.title,
    c.created_by,
    CASE 
        WHEN u.id IS NULL THEN '⚠️ USER MISSING'
        ELSE u.name
    END as creator_status
FROM contests c
LEFT JOIN users u ON c.created_by = u.id
ORDER BY c.created_at DESC;

If any contests show "USER MISSING", run:

UPDATE contests 
SET created_by = (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
WHERE created_by NOT IN (SELECT id FROM users);

🔍 Troubleshooting:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

❌ Still no contests showing?
   → Check: SELECT COUNT(*) FROM contests;
   → If 0: No contests exist, create one via UI
   → If >0: Check session.user.role in browser console

❌ API returns empty array?
   → Check server terminal for error messages
   → Check database connection
   → Verify DATABASE_URL in .env.local

❌ "Unauthorized" error?
   → Log out and log back in
   → Check session cookie exists
   → Verify NextAuth configuration

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
For detailed documentation, see:
  - docs/CONTEST_VISIBILITY_FIX.md
  - docs/DEBUG_CONTESTS_VISIBILITY.md
  - docs/TESTING_CONTESTS.md
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
