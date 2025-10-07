# Contest Routing Architecture Fix

## Problem
Next.js threw an error: "You cannot have two parallel pages that resolve to the same path"

This occurred because we had:
- `app/(codeproctor)/(admin)/contests/page.tsx`
- `app/(codeproctor)/(dashboard)/contests/page.tsx`

Both resolved to `/contests`, causing a routing conflict.

## Solution
Consolidated all contest pages into a single location with role-based rendering:
- **New Location**: `app/(codeproctor)/contests/`
- **Strategy**: Single page with conditional UI based on `session.user.role`

## File Structure

```
app/(codeproctor)/contests/
├── page.tsx                    # Main contests list (role-based UI)
├── columns.tsx                 # DataTable columns for admin view
└── [id]/
    ├── page.tsx               # Contest details/management
    ├── take/
    │   └── page.tsx          # Student contest participation
    └── leaderboard/
        └── page.tsx          # Contest leaderboard
```

## Role-Based Access

### Main Page (`/contests`)
- **Admin/Faculty**: DataTable with all contests, create button, edit/delete actions
- **Students**: Card grid showing assigned contests, grouped by status (Active/Upcoming/Past)

### Contest Details (`/contests/[id]`)
- **Admin/Faculty**: Tabs for Overview/Problems/Sections management
- **Students**: Redirected to `/contests/[id]/take`

### Take Contest (`/contests/[id]/take`)
- **Students Only**: Timer, problem list, progress tracker, solve buttons
- Integrates with editor: `/editor?problemId={id}&contestId={contestId}`

### Leaderboard (`/contests/[id]/leaderboard`)
- **All Roles**: Top 3 podium + full rankings table
- Shows rank, name, problems solved, total points

## API Routes (Unchanged)
All API routes remain in their original locations:
- `/api/contests` - List, Create
- `/api/contests/[id]` - Get, Update, Delete
- `/api/contests/[id]/problems` - Manage problems
- `/api/contests/[id]/sections` - Manage sections
- `/api/contests/[id]/leaderboard` - Get rankings
- `/api/contests/[id]/submissions` - Track submissions

## Navigation
Updated `components/app-sidebar.tsx`:
- Single "Contests" link with Trophy icon
- Visible to all roles (admin, faculty, student)
- Links to `/contests`

## Key Features

### Admin View
1. **Contest List**: DataTable with sorting, filtering
2. **Create Contest**: Dialog form for new contests
3. **Edit Contest**: Inline editing of details
4. **Manage Problems**: Add/remove with points allocation
5. **Assign Sections**: Grant access to student sections
6. **View Submissions**: Track all student progress

### Student View
1. **Active Contests**: Current contests with time remaining
2. **Upcoming Contests**: Future contests with start time
3. **Past Contests**: Completed contests with final scores
4. **Contest Details**: View problems, timer, progress
5. **Take Contest**: Solve problems, earn points
6. **Leaderboard**: See rankings and compete

## Implementation Details

### Session-Based Rendering
```typescript
const { data: session } = useSession();
const isAdminOrFaculty = session?.user?.role === "admin" || session?.user?.role === "faculty";

if (isAdminOrFaculty) {
  return <AdminContestsView />;
} else {
  return <StudentContestsView />;
}
```

### Contest Status Logic
```typescript
const getContestStatus = (contest) => {
  const now = new Date();
  const start = new Date(contest.start_time);
  const end = new Date(contest.end_time);
  
  if (now < start) return "Upcoming";
  if (now > end) return "Past";
  return "Active";
};
```

### Timer Calculation
```typescript
useEffect(() => {
  const interval = setInterval(() => {
    calculateTimeRemaining();
  }, 1000);
  return () => clearInterval(interval);
}, [contest]);
```

## Benefits
1. ✅ No routing conflicts
2. ✅ Single source of truth for contest pages
3. ✅ Role-appropriate UI without duplicate code
4. ✅ Easier to maintain
5. ✅ Consistent URLs across roles

## Migration Steps Completed
1. ✅ Created new `app/(codeproctor)/contests/` directory
2. ✅ Created unified `page.tsx` with role-based rendering
3. ✅ Copied `columns.tsx` from admin folder
4. ✅ Copied `[id]/page.tsx` for contest details
5. ✅ Created `[id]/take/page.tsx` for student participation
6. ✅ Created `[id]/leaderboard/page.tsx` for rankings
7. ✅ Deleted old `(admin)/contests` folder
8. ✅ Deleted old `(dashboard)/contests` folder
9. ✅ Verified no TypeScript errors

## Testing Checklist
- [ ] Admin can view all contests in DataTable
- [ ] Admin can create new contest
- [ ] Admin can edit contest details
- [ ] Admin can add/remove problems
- [ ] Admin can assign sections
- [ ] Faculty can access same features as admin
- [ ] Students see only assigned contests
- [ ] Students can take active contests
- [ ] Timer counts down correctly
- [ ] Problem solving integrates with editor
- [ ] Submissions are recorded
- [ ] Leaderboard updates correctly
- [ ] Points are calculated accurately

## Future Enhancements
1. Real-time leaderboard updates (WebSocket)
2. Contest notifications (start/end reminders)
3. Contest analytics (completion rates, average scores)
4. Export contest results (CSV/PDF)
5. Contest templates (reusable problem sets)
6. Team contests (group participation)
7. Contest difficulty ratings
8. Problem hints system
