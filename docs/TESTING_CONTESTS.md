# Testing the Contest Feature

## Pre-Testing Setup

### 1. Ensure Database Tables Exist
```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('contests', 'contests_problems', 'contests_sections', 'contest_submissions');
```

Expected: 4 rows returned

### 2. Verify User Roles
Make sure you have test users with different roles:
```sql
-- Create admin user (if needed)
UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';

-- Create faculty user (if needed)
UPDATE users SET role = 'faculty' WHERE email = 'faculty@example.com';

-- Create student users (if needed)
UPDATE users SET role = 'student' WHERE email LIKE 'student%';
```

### 3. Verify Problems and Sections Exist
```sql
-- Check problems
SELECT COUNT(*) FROM problems;

-- Check sections
SELECT COUNT(*) FROM sections;
```

Need at least 1 problem and 1 section to fully test contests.

## Test Plan

### Phase 1: Admin Contest Management

#### Test 1.1: View Contests Page
1. Log in as **admin**
2. Navigate to `/contests`
3. **Expected**: 
   - See "Contests" heading
   - See "Create Contest" button
   - See empty DataTable OR existing contests
4. **Check Browser Console** for logs:
   ```
   Fetching contests from: /api/contests isAdmin: true
   Contests received: { contests: [...] }
   ```

#### Test 1.2: Create Contest
1. Click "Create Contest" button
2. Fill in form:
   - **Title**: "Test Contest 1"
   - **Description**: "This is a test contest"
   - **Start Time**: Today's date, current time
   - **End Time**: Tomorrow's date, same time
   - **Duration**: 60 (minutes)
   - **Active**: Toggle ON
3. Click "Create Contest"
4. **Expected**:
   - Success toast: "Contest created successfully"
   - Redirected to `/contests/[id]` (contest details page)
5. **Verify in DB**:
   ```sql
   SELECT * FROM contests ORDER BY created_at DESC LIMIT 1;
   ```

#### Test 1.3: View Contest Details
1. On the contest details page (`/contests/[id]`)
2. **Expected**:
   - See contest title and description
   - See 3 tabs: Overview, Problems, Sections
   - Overview shows: start/end times, duration, status
   - Problems tab is empty (0 problems)
   - Sections tab is empty (0 sections)

#### Test 1.4: Add Problems to Contest
1. Go to "Problems" tab
2. Click "Add Problem" button
3. Select a problem from dropdown
4. Set points (e.g., 10)
5. Click "Add"
6. **Expected**:
   - Problem appears in list
   - Shows title, description, points
   - Has "Remove" button
7. **Repeat** for 2-3 more problems
8. **Verify in DB**:
   ```sql
   SELECT * FROM contests_problems WHERE contest_id = 'contest-id-here';
   ```

#### Test 1.5: Update Problem Points
1. In Problems tab, change points value
2. Click "Update Points"
3. **Expected**:
   - Success toast
   - Points value updates
4. **Verify in DB**:
   ```sql
   SELECT points FROM contests_problems 
   WHERE contest_id = 'contest-id' AND problem_id = 'problem-id';
   ```

#### Test 1.6: Remove Problem
1. Click "Remove" button on a problem
2. **Expected**:
   - Problem disappears from list
   - Problem count decreases

#### Test 1.7: Assign Sections
1. Go to "Sections" tab
2. Click "Assign Section" button
3. Select a section from dropdown
4. Click "Add"
5. **Expected**:
   - Section appears in list
   - Shows section name, course, semester
   - Has "Remove" button
6. **Repeat** for 2-3 sections
7. **Verify in DB**:
   ```sql
   SELECT * FROM contests_sections WHERE contest_id = 'contest-id-here';
   ```

#### Test 1.8: Remove Section
1. Click "Remove" button on a section
2. **Expected**:
   - Section disappears from list
   - Students in that section lose access

#### Test 1.9: Edit Contest
1. On contest details page, click "Edit Contest"
2. Modify title or dates
3. Save changes
4. **Expected**:
   - Success toast
   - Changes reflected on page
5. **Verify in DB**:
   ```sql
   SELECT title, start_time, end_time FROM contests WHERE id = 'contest-id';
   ```

#### Test 1.10: Delete Contest
1. In contests list, click delete action
2. Confirm deletion
3. **Expected**:
   - Contest removed from list
   - All related data cleaned up
4. **Verify in DB**:
   ```sql
   -- Contest should still exist (soft delete)
   SELECT * FROM contests WHERE id = 'contest-id';
   
   -- But problems and sections should be gone (cascade delete)
   SELECT * FROM contests_problems WHERE contest_id = 'contest-id';
   SELECT * FROM contests_sections WHERE contest_id = 'contest-id';
   ```

### Phase 2: Student Contest Participation

#### Test 2.1: View Student Contests
1. Log in as **student** (must be in assigned section)
2. Navigate to `/contests`
3. **Expected**:
   - See "My Contests" heading
   - See contests grouped by status:
     - **Active Contests**: Green cards, "Start Contest" button
     - **Upcoming Contests**: Blue cards, "View Details" button
     - **Past Contests**: Gray cards, "Results"/"Review" buttons
4. **If no contests**: See message "No contests assigned to you yet"

#### Test 2.2: Start Active Contest
1. Click "Start Contest" on an active contest
2. **Expected**:
   - Redirected to `/contests/[id]/take`
   - See contest title, description, status badge
   - See timer counting down (if contest is active)
   - See list of problems with checkmarks/circles
   - See progress sidebar:
     - Time remaining
     - Total points (0 initially)
     - Solved/Remaining counts
     - Progress bar (0%)

#### Test 2.3: Solve Problem in Contest
1. Click "Solve" on a problem
2. **Expected**:
   - Redirected to `/editor?problemId=...&contestId=...`
   - Editor loads with problem
3. Write and submit solution
4. **Expected**:
   - On successful solve, submission recorded
   - Points awarded
5. Go back to `/contests/[id]/take`
6. **Expected**:
   - Problem marked as solved (green checkmark)
   - Total points updated
   - Solved count increased
   - Progress bar updated

#### Test 2.4: View Leaderboard
1. On take contest page, click "View Leaderboard"
2. **Expected**:
   - Redirected to `/contests/[id]/leaderboard`
   - See top 3 podium:
     - 1st place: Gold trophy
     - 2nd place: Silver medal
     - 3rd place: Bronze award
   - See full leaderboard table:
     - Rank, Name, Problems Solved, Total Points
   - Your rank highlighted

#### Test 2.5: Review Past Contest
1. On `/contests`, click "Review" on a past contest
2. **Expected**:
   - See contest details
   - See your final score
   - Can view problems (but not solve them)

### Phase 3: Faculty Testing

#### Test 3.1: Faculty Access
1. Log in as **faculty**
2. Navigate to `/contests`
3. **Expected**:
   - Same view as admin
   - Can create contests
   - Can manage contests they created
   - Cannot delete contests (admin only)

### Phase 4: Edge Cases

#### Test 4.1: Contest Status Transitions
1. Create contest with:
   - Start time: 1 minute from now
   - End time: 2 minutes from now
2. Wait and observe status changes:
   - Initially: "Upcoming"
   - After start time: "Active"
   - After end time: "Ended"

#### Test 4.2: Concurrent Problem Solving
1. Have 2 students in same section
2. Both join same contest
3. Both solve same problem
4. **Expected**:
   - Both get points
   - Leaderboard updates for both
   - Rank determined by:
     1. Problems solved (more is better)
     2. Total points (more is better)

#### Test 4.3: Student Without Section
1. Create student user not in any section
2. Log in as that student
3. Navigate to `/contests`
4. **Expected**:
   - See message "No contests assigned to you yet"

#### Test 4.4: Contest Without Problems
1. Create contest
2. Assign sections (but don't add problems)
3. Log in as student
4. Try to take contest
5. **Expected**:
   - See "No problems available"
   - Cannot earn points

#### Test 4.5: Contest Without Sections
1. Create contest
2. Add problems (but don't assign sections)
3. Log in as student
4. Navigate to `/contests`
5. **Expected**:
   - Contest not visible to any students

#### Test 4.6: Access Control
1. Get contest ID from admin view
2. Log in as student (not in assigned section)
3. Try to access `/contests/[id]/take` directly via URL
4. **Expected**:
   - 403 Forbidden or redirected
   - Error message: "You don't have access to this contest"

### Phase 5: API Testing

#### Test 5.1: GET /api/contests
```bash
# As admin
curl -X GET http://localhost:3000/api/contests \
  -H "Cookie: next-auth.session-token=..."

# Expected: All contests

# As student
curl -X GET http://localhost:3000/api/contests \
  -H "Cookie: next-auth.session-token=..."

# Expected: Only assigned contests
```

#### Test 5.2: POST /api/contests
```bash
curl -X POST http://localhost:3000/api/contests \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d '{
    "title": "API Test Contest",
    "description": "Created via API",
    "start_time": "2025-10-08T10:00:00",
    "end_time": "2025-10-08T12:00:00",
    "duration_minutes": 120,
    "is_active": true
  }'

# Expected: 201 Created, returns contest object
```

#### Test 5.3: GET /api/contests/[id]/leaderboard
```bash
curl -X GET http://localhost:3000/api/contests/[id]/leaderboard \
  -H "Cookie: next-auth.session-token=..."

# Expected: Array of leaderboard entries sorted by rank
```

## Success Criteria

✅ **All tests pass without errors**
✅ **Admin can create and manage contests**
✅ **Faculty can create contests**
✅ **Students can view assigned contests only**
✅ **Students can solve problems and earn points**
✅ **Leaderboard updates correctly**
✅ **Contest status changes based on time**
✅ **Access control works properly**
✅ **No TypeScript errors**
✅ **No console errors**
✅ **Database stays consistent**

## Troubleshooting

### Issue: "No contests visible"
- Check browser console for API response
- Verify session role
- Check database for contest records

### Issue: "Can't solve problems"
- Verify contest is active
- Check if student is in assigned section
- Ensure problems are added to contest

### Issue: "Leaderboard empty"
- Verify students have submitted solutions
- Check contest_submissions table
- Ensure submissions are marked as solved

### Issue: "Timer not counting down"
- Check contest start_time and end_time
- Verify browser time is correct
- Look for JavaScript errors

## Cleanup After Testing

```sql
-- Remove test data
DELETE FROM contest_submissions WHERE contest_id IN (
  SELECT id FROM contests WHERE title LIKE '%Test%'
);
DELETE FROM contests_problems WHERE contest_id IN (
  SELECT id FROM contests WHERE title LIKE '%Test%'
);
DELETE FROM contests_sections WHERE contest_id IN (
  SELECT id FROM contests WHERE title LIKE '%Test%'
);
DELETE FROM contests WHERE title LIKE '%Test%';
```
