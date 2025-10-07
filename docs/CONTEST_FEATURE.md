# Contest/Quiz Feature Implementation

## Overview
A complete contest (quiz) management system has been implemented for your CodeProctor platform. Admins can create contests, add problems, assign sections, and track student performance.

## What's Been Created

### 1. **Repository Layer** (`repository/contest.repository.ts`)
Complete database operations for:
- ✅ Contest CRUD operations
- ✅ Managing contest problems (add, remove, update points)
- ✅ Managing contest sections (add, remove)
- ✅ Contest submissions tracking
- ✅ Leaderboard generation
- ✅ Student access checking
- ✅ Contest statistics

### 2. **API Routes**
- ✅ `/api/contests` - GET (list), POST (create)
- ✅ `/api/contests/[id]` - GET, PUT, DELETE
- ✅ `/api/contests/[id]/problems` - GET, POST, PUT, DELETE
- ✅ `/api/contests/[id]/sections` - GET, POST, DELETE
- ✅ `/api/contests/[id]/leaderboard` - GET

### 3. **Admin UI Pages**
- ✅ `/contests` - Contest list with data table
- ✅ `/contests/[id]` - Contest details with tabs for:
  - Problems management
  - Sections management
  - Edit contest details
  - View leaderboard

### 4. **Types** (`types/types.ts`)
- ✅ `contest` type added with all necessary fields

## How to Use

### For Admins:

1. **Create a Contest**
   - Navigate to `/contests`
   - Click "Create Contest"
   - Fill in title, description, start/end times, duration
   - Set as active/inactive

2. **Add Problems**
   - Open contest details
   - Go to "Problems" tab
   - Click "Add Problem"
   - Select problem and set points
   - Remove problems with trash icon

3. **Assign Sections**
   - Go to "Sections" tab
   - Click "Add Section"
   - Select section from dropdown
   - Remove sections with trash icon

4. **Edit Contest**
   - Click "Edit Contest" button
   - Update details as needed

5. **View Leaderboard**
   - Click "Leaderboard" button on contest page
   - See student rankings by points and solved problems

## Database Tables Created

You should have created these 4 tables:

```sql
-- Main contests table
CREATE TABLE contests (
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

-- Junction table for contest-problem relationship
CREATE TABLE contests_problems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id UUID NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
  problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  points INTEGER DEFAULT 10,
  order_index INTEGER,
  UNIQUE(contest_id, problem_id)
);

-- Junction table for contest-section relationship
CREATE TABLE contests_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id UUID NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
  section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  UNIQUE(contest_id, section_id)
);

-- Track student submissions
CREATE TABLE contest_submissions (
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

-- Recommended indexes
CREATE INDEX idx_contests_created_by ON contests(created_by);
CREATE INDEX idx_contests_active ON contests(is_active);
CREATE INDEX idx_contests_time ON contests(start_time, end_time);
CREATE INDEX idx_contests_problems_contest ON contests_problems(contest_id);
CREATE INDEX idx_contests_sections_contest ON contests_sections(contest_id);
CREATE INDEX idx_contests_sections_section ON contests_sections(section_id);
CREATE INDEX idx_contest_submissions_contest_user ON contest_submissions(contest_id, user_id);
```

## Features

✅ **Contest Management**
- Create, edit, delete contests
- Set time windows and duration limits
- Activate/deactivate contests

✅ **Problem Assignment**
- Add multiple problems to a contest
- Set custom points per problem
- Remove problems from contest

✅ **Section Assignment**
- Assign multiple sections to a contest
- Only assigned sections can access the contest
- Remove sections from contest

✅ **Access Control**
- Admins: Full CRUD access
- Faculty: Can create and manage contests
- Students: View only assigned contests

✅ **Tracking & Analytics**
- Contest submissions tracking
- Leaderboard by points and solved count
- Contest statistics (participants, submissions, etc.)

## Next Steps (Optional Enhancements)

1. **Student Contest View**
   - Create `/contests/[id]/take` page for students
   - Show contest problems
   - Timer if duration is set
   - Submit solutions

2. **Integration with Existing Editor**
   - Link contest problems to your code editor
   - Track submissions in contest context
   - Award points on successful submission

3. **Enhanced Leaderboard**
   - Real-time updates
   - Filtering by section
   - Export to CSV

4. **Notifications**
   - Email students when contest is assigned
   - Remind students before contest ends

5. **Contest Templates**
   - Save contest configurations as templates
   - Quick create from template

## Files Created

```
repository/
  ├── contest.repository.ts       ✅ New

app/api/contests/
  ├── route.ts                     ✅ New
  ├── [id]/
      ├── route.ts                 ✅ New
      ├── problems/route.ts        ✅ New
      ├── sections/route.ts        ✅ New
      └── leaderboard/route.ts     ✅ New

app/(codeproctor)/(admin)/contests/
  ├── page.tsx                     ✅ New
  ├── columns.tsx                  ✅ New
  └── [id]/page.tsx                ✅ New

types/
  └── types.ts                     ✅ Updated
```

## Testing Checklist

- [ ] Create a new contest
- [ ] Add problems to contest
- [ ] Assign sections to contest
- [ ] Edit contest details
- [ ] View contest list
- [ ] Remove problems from contest
- [ ] Remove sections from contest
- [ ] Toggle contest active status
- [ ] View leaderboard (after student submissions)

## Notes

- All cascade deletes are configured (deleting contest removes all related data)
- Unique constraints prevent duplicate problem/section assignments
- Timestamps are tracked automatically
- Proper authentication and authorization checks in place
- Error handling and toast notifications implemented
