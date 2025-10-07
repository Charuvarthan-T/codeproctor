# Contest API Routes - Next.js 15 Async Params Fix

## Issue
Next.js 15 introduced a breaking change where dynamic route parameters must be awaited before accessing their properties.

### Error Message
```
Error: Route "/api/contests/[id]" used `params.id`. `params` should be awaited before using its properties. 
Learn more: https://nextjs.org/docs/messages/sync-dynamic-apis
```

## Solution
Changed all route handlers from:
```typescript
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const contestId = params.id; // ❌ This throws an error
}
```

To:
```typescript
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // Promise wrapper
) {
  const { id: contestId } = await params; // ✅ Await params first
}
```

## Files Fixed

### 1. `/api/contests/[id]/route.ts`
- ✅ GET handler - Fixed params.id access
- ✅ PUT handler - Fixed params.id access
- ✅ DELETE handler - Fixed params.id access

### 2. `/api/contests/[id]/problems/route.ts`
- ✅ GET handler - Fixed params.id access
- ✅ POST handler - Fixed params.id access
- ✅ PUT handler - Fixed params.id access
- ✅ DELETE handler - Fixed params.id access

### 3. `/api/contests/[id]/sections/route.ts`
- ✅ GET handler - Fixed params.id access
- ✅ POST handler - Fixed params.id access
- ✅ DELETE handler - Fixed params.id access

### 4. `/api/contests/[id]/leaderboard/route.ts`
- ✅ GET handler - Fixed params.id access

### 5. `/api/contests/[id]/submissions/route.ts`
- ✅ GET handler - Fixed params.id access
- ✅ POST handler - Fixed params.id access

## Total Changes
- 5 API route files
- 14 handler functions fixed
- 0 breaking changes to functionality

## Why This Change?
Next.js 15 made params and searchParams asynchronous to support:
1. **Partial Prerendering (PPR)** - Better performance
2. **Streaming** - Improved server-side rendering
3. **Suspense Integration** - Better React 18 support

## Client-Side Routes (No Changes Needed)
The following files use `useParams()` hook from `next/navigation`, which handles this automatically:
- ✅ `app/(codeproctor)/contests/[id]/page.tsx` - Uses `useParams()`
- ✅ `app/(codeproctor)/contests/[id]/take/page.tsx` - Uses `useParams()`
- ✅ `app/(codeproctor)/contests/[id]/leaderboard/page.tsx` - Uses `useParams()`

Client components don't need changes because React hooks handle async params internally.

## Testing Checklist
- [x] No TypeScript errors
- [ ] GET /api/contests/[id] returns contest details
- [ ] PUT /api/contests/[id] updates contest
- [ ] DELETE /api/contests/[id] removes contest
- [ ] GET /api/contests/[id]/problems returns problems
- [ ] POST /api/contests/[id]/problems adds problem
- [ ] PUT /api/contests/[id]/problems updates points
- [ ] DELETE /api/contests/[id]/problems removes problem
- [ ] GET /api/contests/[id]/sections returns sections
- [ ] POST /api/contests/[id]/sections adds section
- [ ] DELETE /api/contests/[id]/sections removes section
- [ ] GET /api/contests/[id]/leaderboard returns rankings
- [ ] GET /api/contests/[id]/submissions returns user submissions
- [ ] POST /api/contests/[id]/submissions records submission

## Migration Pattern
For any future dynamic routes, use this pattern:

```typescript
// ❌ OLD (Next.js 14)
export async function Handler(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
}

// ✅ NEW (Next.js 15)
export async function Handler(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
}
```

## References
- [Next.js 15 Upgrade Guide](https://nextjs.org/docs/app/building-your-application/upgrading/version-15)
- [Async Request APIs](https://nextjs.org/docs/messages/sync-dynamic-apis)
