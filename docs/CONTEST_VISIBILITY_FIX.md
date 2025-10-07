# Contest Visibility Issue - Fixed!

## Problem
Contests exist in the database but don't show on the `/contests` page.

## Root Cause
The `getAllContests()` and other query functions used `INNER JOIN` with the users table:

```sql
SELECT c.*, u.name as created_by_name
FROM contests c
INNER JOIN users u ON c.created_by = u.id  -- ❌ This hides contests if user doesn't exist
```

If the `created_by` user ID doesn't exist in the users table (deleted user, invalid ID, etc.), the contest won't be returned.

## Solution
Changed all contest queries from `INNER JOIN` to `LEFT JOIN`:

```sql
SELECT c.*, u.name as created_by_name
FROM contests c
LEFT JOIN users u ON c.created_by = u.id  -- ✅ Returns contests even if user is missing
```

This ensures contests are always returned, even if the creator user doesn't exist anymore.

## Files Fixed

### 1. `repository/contest.repository.ts`
Fixed 5 functions:
- ✅ `getAllContests()` - Changed to LEFT JOIN
- ✅ `getContestById()` - Changed to LEFT JOIN
- ✅ `getContestsWithPagination()` - Changed to LEFT JOIN (2 queries)
- ✅ `getContestsForStudent()` - Changed to LEFT JOIN

### 2. `app/api/contests/route.ts`
Added logging to help debug:
```typescript
console.log("All contests fetched:", contests.length, "contests");
```

## Verification Steps

### 1. Check Database for Orphaned Contests
Run this SQL query:
```sql
SELECT 
    c.id,
    c.title,
    c.created_by,
    CASE 
        WHEN u.id IS NULL THEN '⚠️ USER DOES NOT EXIST'
        ELSE u.name
    END as creator_status
FROM contests c
LEFT JOIN users u ON c.created_by = u.id;
```

### 2. Check Server Logs
After refreshing `/contests` page, check terminal for:
```
All contests fetched: X contests
```

### 3. Check Browser Console
Look for:
```
Fetching contests from: /api/contests isAdmin: true
Contests received: { contests: [...] }
```

### 4. Test API Directly
Visit: `http://localhost:3000/api/contests`

Should return:
```json
{
  "contests": [
    {
      "id": "...",
      "title": "...",
      "created_by_name": null,  // or user name if exists
      ...
    }
  ]
}
```

## Fix Orphaned Contests (Optional)

If contests have invalid `created_by` IDs, you can reassign them to an admin:

```sql
-- Get your admin user ID
SELECT id, name, email FROM users WHERE role = 'admin' LIMIT 1;

-- Update orphaned contests (replace 'admin-user-id' with actual ID)
UPDATE contests 
SET created_by = 'admin-user-id'
WHERE created_by NOT IN (SELECT id FROM users);
```

Or run the debug script:
```bash
# Edit scripts/debug_contests.sql and uncomment the UPDATE statement
# Then run it against your database
```

## Why This Happened

Common scenarios:
1. **Test User Deleted**: Created contests during testing, then deleted the test user
2. **Manual Database Edit**: Directly edited `created_by` field to invalid ID
3. **Migration Issue**: User IDs changed during database migration
4. **Seeding Error**: Contest seeding script used non-existent user IDs

## Prevention

### Use Foreign Key Constraints
Add to migration:
```sql
ALTER TABLE contests
ADD CONSTRAINT fk_contests_created_by
FOREIGN KEY (created_by) REFERENCES users(id)
ON DELETE SET NULL;  -- or CASCADE to delete contests when user is deleted
```

This prevents orphaned records by either:
- Setting `created_by` to NULL when user is deleted
- Deleting the contest when user is deleted (if using CASCADE)

### Use Application-Level Validation
Before creating contest:
```typescript
// Verify user exists
const userExists = await sql`SELECT 1 FROM users WHERE id = ${userId}`;
if (userExists.length === 0) {
  throw new Error("User does not exist");
}
```

## Expected Behavior Now

✅ All contests in database will show on page
✅ Contests with valid creators show creator name
✅ Contests with missing creators show `created_by_name: null`
✅ No contests hidden due to user deletion

## Test Results

After the fix:
- [ ] Refresh `/contests` page - should see all contests
- [ ] Check browser console - should show contest data
- [ ] Check server logs - should show "X contests" message
- [ ] Create new contest - should work normally
- [ ] Delete contest creator user - contest should still be visible

## Additional Notes

If contests still don't show:
1. Clear browser cache and hard refresh (Ctrl+Shift+R)
2. Check session is loaded (`session?.user?.role`)
3. Verify database connection is working
4. Check for JavaScript errors in console
5. Verify `is_active` field isn't filtering all contests out
