# Student Contest UI - Implementation Guide

## Overview
Complete student-facing UI for participating in contests has been implemented. Students can view assigned contests, take them, track progress, and view leaderboards.

## Pages Created

### 1. **Contest List Page** (`/contests`)
**Path**: `app/(codeproctor)/(dashboard)/contests/page.tsx`

**Features**:
- ✅ View all assigned contests
- ✅ Contests grouped by status (Active, Upcoming, Past)
- ✅ Progress tracking for each contest
- ✅ Visual indicators for contest status
- ✅ Quick actions to start/continue contests

**What Students See**:
- **Active Contests** - Green border, "Start Contest" button
- **Upcoming Contests** - Blue border, shows start time
- **Past Contests** - Gray opacity, shows final score

**Card Information**:
- Contest title & description
- Start/End dates
- Duration (if set)
- Problem count
- Personal progress bar
- Solved count

---

### 2. **Take Contest Page** (`/contests/[id]/take`)
**Path**: `app/(codeproctor)/(dashboard)/contests/[id]/take/page.tsx`

**Features**:
- ✅ Live countdown timer
- ✅ Problem list with solve status
- ✅ Real-time progress tracking
- ✅ Points display
- ✅ Navigate to editor for each problem
- ✅ Refresh status button

**Layout**:
- **Left Panel** - Contest info and problem list
- **Right Sidebar** (Sticky) - Timer, score, progress, actions

**Problem Display**:
- Check mark for solved problems
- Green background for completed
- Points badge
- "Solve" or "Review" button

**Progress Panel Shows**:
- Time remaining (live countdown)
- Total points earned
- Problems solved count
- Problems remaining
- Progress percentage bar
- Leaderboard link

---

### 3. **Contest Details Page** (`/contests/[id]`)
**Path**: `app/(codeproctor)/(dashboard)/contests/[id]/page.tsx`

**Features**:
- ✅ Contest information overview
- ✅ Full problem list
- ✅ Contest status badge
- ✅ "Start Contest" button (when active)
- ✅ View leaderboard link

**Use Case**: Preview contest before starting or review after completion

---

### 4. **Contest Leaderboard** (`/contests/[id]/leaderboard`)
**Path**: `app/(codeproctor)/(dashboard)/contests/[id]/leaderboard/page.tsx`

**Features**:
- ✅ Rankings table with all participants
- ✅ Rank icons (🏆 for 1st, 🥈 for 2nd, 🥉 for 3rd)
- ✅ Top 3 podium display
- ✅ Shows: Rank, Name, Problems Solved, Points, Last Submission
- ✅ Refresh button
- ✅ Highlighted top 3 rows

**Special Elements**:
- Trophy/Medal icons for top 3
- Larger cards for top 3 winners
- Gold border for 1st place
- Real-time refresh capability

---

## API Endpoints Used

### Student-Accessible Endpoints:
```
GET  /api/contests?forStudent=true        - Get assigned contests
GET  /api/contests/[id]                   - Get contest details
GET  /api/contests/[id]/problems          - Get contest problems
GET  /api/contests/[id]/submissions       - Get user's submissions
POST /api/contests/[id]/submissions       - Submit solution
GET  /api/contests/[id]/leaderboard       - View rankings
```

---

## Navigation

**Sidebar**: 
- "Contests" link added with Trophy icon
- Visible to: Admin, Faculty, **Students**
- Route: `/contests`

---

## User Flow

### Starting a Contest:
1. Student navigates to `/contests`
2. Sees all assigned contests
3. Clicks "Start Contest" on an active contest
4. Redirected to `/contests/[id]/take`
5. Sees timer, problems, and progress
6. Clicks "Solve" on a problem
7. Redirected to `/editor?problemId=X&contestId=Y`
8. Submits solution in editor (integration needed)
9. Returns to contest page to see updated progress

### After Contest:
1. Contest ends (time expires)
2. Student can view final score
3. Click "Results" to see leaderboard
4. Click "Review" to see problems again

---

## Integration Points

### With Editor (To Do):
When student clicks "Solve" on a problem, they're sent to:
```
/editor?problemId=XXX&contestId=YYY
```

**Required Editor Changes**:
1. Detect `contestId` parameter
2. When solution is successfully tested:
   ```javascript
   // In your editor submission handler
   if (contestId) {
     await fetch(`/api/contests/${contestId}/submissions`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({
         problemId: problemId,
         isSolved: true,
         pointsEarned: problemPoints // get from problem data
       })
     });
   }
   ```
3. Show "Return to Contest" button
4. Update contest progress after submission

---

## Visual Design

### Status Colors:
- **Active Contest**: Green (`border-green-200`, `bg-green-50`)
- **Upcoming Contest**: Blue (`border-blue-200`)
- **Ended Contest**: Gray (opacity-75)

### Badges:
- Active: Green badge
- Upcoming: Secondary badge
- Ended: Outline badge

### Icons:
- 🏆 Trophy - 1st place, leaderboards
- 🥈 Medal - 2nd place
- 🥉 Award - 3rd place
- ⏰ Clock - Time/duration
- 📅 Calendar - Dates
- 📄 FileText - Problems
- ▶️ Play - Start/active
- ✓ CheckCircle - Completed

---

## Features Summary

### ✅ Implemented:
- Contest list with filtering by status
- Live countdown timer
- Progress tracking
- Problem list with solve status
- Leaderboard with rankings
- Top 3 podium display
- Responsive design
- Status badges and icons
- Navigation between pages
- Refresh functionality

### 🔄 Integration Needed:
- Editor integration for submissions
- Automatic point calculation
- Real-time updates (optional)
- Notifications (optional)

---

## Testing Checklist

- [ ] View assigned contests as student
- [ ] See contests grouped by status
- [ ] Start an active contest
- [ ] See live countdown timer
- [ ] View problem list in contest
- [ ] Click "Solve" navigates to editor
- [ ] Submit solution (after editor integration)
- [ ] See updated progress
- [ ] View leaderboard
- [ ] See top 3 podium
- [ ] View past contest results
- [ ] Navigate between pages smoothly

---

## File Structure

```
app/(codeproctor)/(dashboard)/contests/
├── page.tsx                     ✅ Contest list
├── [id]/
    ├── page.tsx                 ✅ Contest details
    ├── take/
    │   └── page.tsx             ✅ Take contest (main interface)
    └── leaderboard/
        └── page.tsx             ✅ Leaderboard

app/api/contests/[id]/
└── submissions/
    └── route.ts                 ✅ GET/POST submissions
```

---

## Next Steps

1. **Integrate with Editor**:
   - Detect contest context in editor
   - Submit to contest API on success
   - Show contest progress

2. **Real-time Updates** (Optional):
   - WebSocket for live leaderboard
   - Auto-refresh on submission
   - Live timer sync

3. **Enhanced Features** (Optional):
   - Partial points for test cases
   - Penalty for wrong submissions
   - Time bonus calculation
   - Contest history/analytics
   - Download certificate for winners

---

## Student Experience

### Before Contest:
- See upcoming contests
- View problem list
- Know start time and duration

### During Contest:
- Live timer counting down
- See all problems
- Track progress in real-time
- Know current score
- See solved/remaining count

### After Contest:
- View final score
- See leaderboard position
- Review problems
- Compare with peers

---

## Screenshots/Mockup Flow

```
/contests
  ↓ Click "Start Contest"
/contests/123/take
  ↓ Click "Solve" on Problem
/editor?problemId=456&contestId=123
  ↓ Submit Success
/contests/123/take (updated progress)
  ↓ After all problems
/contests/123/leaderboard
```

---

Everything is ready for students to use! Just need to integrate the editor submission with the contest API. 🎉
