# Debugging: Contests Not Showing on Page

## Issue
Created contests are not visible on the `/contests` page for admins.

## Debugging Steps

### 1. Check Browser Console
Open the browser console (F12) and look for the debug logs:
```javascript
console.log("Fetching contests from:", url, "isAdmin:", isAdmin);
console.log("Contests received:", data);
```

Expected output for admin:
```
Fetching contests from: /api/contests isAdmin: true
Contests received: { contests: [...] }
```

### 2. Check Network Tab
1. Open DevTools → Network tab
2. Refresh `/contests` page
3. Look for the API call to `/api/contests`
4. Click on it and check:
   - **Status**: Should be 200
   - **Response**: Should contain `{ contests: [...] }`
   - **Headers**: Check authorization headers

### 3. Check Database Directly
Run this query to verify contests exist:
```sql
SELECT * FROM contests ORDER BY created_at DESC;
```

Expected output:
- If empty: No contests have been created yet
- If has data: Contests exist but aren't being returned by API

### 4. Test API Endpoint Directly
Open a new browser tab and navigate to:
```
http://localhost:3000/api/contests
```

Expected response:
```json
{
  "contests": [
    {
      "id": "uuid",
      "title": "Contest Title",
      "description": "Description",
      "created_by": "user-id",
      "start_time": "2025-10-07T...",
      "end_time": "2025-10-07T...",
      "is_active": true,
      ...
    }
  ]
}
```

Possible error responses:
- **401 Unauthorized**: Not logged in
- **500 Server Error**: Database issue or query error

### 5. Check Session/Authentication
The session must have a valid user with role. Add this to the page:
```typescript
console.log("Session:", session);
console.log("User Role:", session?.user?.role);
console.log("isAdmin:", isAdmin);
```

Expected:
```
Session: { user: { id: "...", name: "...", email: "...", role: "admin" } }
User Role: admin
isAdmin: true
```

### 6. Check API Route Logic
In `/api/contests/route.ts`, the GET handler has this logic:
```typescript
// If student, return only contests they can access
if (forStudent || session.user.role === "student") {
  const contests = await getContestsForStudent(session.user.id);
  return NextResponse.json({ contests });
}

// Admin/Faculty - return all contests
const contests = await getAllContests();
return NextResponse.json({ contests });
```

For admins, it should call `getAllContests()`.

### 7. Verify Repository Function
Check `repository/contest.repository.ts`:
```typescript
export async function getAllContests() {
  try {
    const contests = await sql`
      SELECT c.*, u.name as created_by_name
      FROM contests c
      INNER JOIN users u ON c.created_by = u.id
      ORDER BY c.created_at DESC
    `;
    return contests;
  } catch (error) {
    console.error("Error getting all contests:", error);
    throw error;
  }
}
```

This should return all contests with creator names.

### 8. Check for Empty State
If no contests exist, the admin view should show an empty DataTable, not an error.

## Common Causes

### Issue 1: No Contests Created
**Symptom**: API returns `{ contests: [] }`
**Solution**: Create a contest using the "Create Contest" button

### Issue 2: Session Not Loaded
**Symptom**: `isAdmin` is undefined or false when it should be true
**Solution**: Wait for session to load:
```typescript
const { data: session, status } = useSession();

if (status === "loading") {
  return <div>Loading...</div>;
}
```

### Issue 3: Wrong Role Check
**Symptom**: Admin user is being treated as student
**Solution**: Verify the role check:
```typescript
const isAdmin = session?.user?.role === "admin" || session?.user?.role === "faculty";
```

### Issue 4: DataTable Not Rendering
**Symptom**: Data exists but table is blank
**Solution**: Check:
- Columns are properly defined in `columns.tsx`
- DataTable component is imported correctly
- No CSS hiding the table

### Issue 5: Database Connection Issue
**Symptom**: 500 error or timeout
**Solution**:
- Check `.env.local` has correct `DATABASE_URL`
- Verify database is running
- Test connection: `psql $DATABASE_URL`

### Issue 6: INNER JOIN Failing
**Symptom**: Contests exist but query returns empty
**Solution**: The query uses `INNER JOIN users`, so creator must exist:
```sql
-- Check if creators exist
SELECT c.id, c.title, c.created_by, u.name
FROM contests c
LEFT JOIN users u ON c.created_by = u.id;
```

If `u.name` is NULL, the creator user was deleted.

Fix:
```sql
-- Update orphaned contests to current admin
UPDATE contests 
SET created_by = 'current-admin-id' 
WHERE created_by NOT IN (SELECT id FROM users);
```

## Quick Fix Commands

### Reset Contest Data (Caution!)
```sql
-- Delete all contest data
DELETE FROM contest_submissions;
DELETE FROM contests_problems;
DELETE FROM contests_sections;
DELETE FROM contests;
```

### Create Test Contest
```sql
INSERT INTO contests (
  id, title, description, created_by, 
  start_time, end_time, duration_minutes, is_active
) VALUES (
  gen_random_uuid(),
  'Test Contest',
  'A test contest for debugging',
  'your-user-id-here',
  NOW(),
  NOW() + INTERVAL '1 day',
  60,
  true
);
```

### Verify User Roles
```sql
SELECT id, name, email, role FROM users;
```

## Still Not Working?

1. **Check Terminal Logs**: Look for errors in the Next.js server terminal
2. **Clear Browser Cache**: Hard refresh with Ctrl+Shift+R
3. **Restart Dev Server**: Stop and start `npm run dev`
4. **Check for Typos**: Verify API route paths match exactly
5. **Test with Postman**: Make direct API calls to isolate frontend vs backend issues

## Expected Console Output (Working)
```
Fetching contests from: /api/contests isAdmin: true
Contests received: {
  contests: [
    {
      id: "abc-123",
      title: "Midterm Quiz",
      created_by_name: "John Doe",
      problem_count: 5,
      section_count: 2,
      ...
    }
  ]
}
```

## Next Steps
Once you see data in the console but not on the page:
1. Check DataTable props
2. Verify columns configuration
3. Inspect React DevTools for component state
4. Look for CSS issues hiding content
