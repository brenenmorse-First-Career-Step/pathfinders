# Fix Resumes RLS (Row Level Security) Issue

## Problem Identified

The console logs show:
```
Resume deleted successfully: []  ← Empty array = 0 rows deleted!
```

This means **Supabase RLS policies are blocking the delete operation**. The user can SELECT resumes but cannot DELETE them.

## Root Cause

The `resumes` table likely has RLS enabled but is missing the DELETE policy for authenticated users, or the policy is incorrectly configured.

## Solution

### Step 1: Run the SQL Fix Script

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: **brenenmorse-First-Career-Step's Project**
3. Click on **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy and paste the contents of `sql/fix-resumes-rls-policies.sql`
6. Click **Run** (or press Cmd/Ctrl + Enter)

### Step 2: Verify the Fix

After running the SQL script, you should see output showing the policies were created:

```
policyname: "Users can view their own resumes"
policyname: "Users can insert their own resumes"
policyname: "Users can update their own resumes"
policyname: "Users can delete their own resumes"
```

### Step 3: Test Delete Functionality

1. Refresh your dashboard page
2. Try to delete the resume again
3. Check the console logs - you should see:
   ```
   Resume deleted successfully: [{id: '...', ...}]  ← Non-empty array!
   ```

## What the SQL Script Does

1. **Drops existing policies** (if any) to start fresh
2. **Enables RLS** on the resumes table
3. **Creates 4 policies**:
   - SELECT: Users can view their own resumes
   - INSERT: Users can create their own resumes
   - UPDATE: Users can update their own resumes
   - DELETE: Users can delete their own resumes
4. **Grants permissions** to authenticated users
5. **Verifies** the policies were created

## Expected Behavior After Fix

### Delete Operation
- User clicks "Delete" button
- Confirmation dialog appears
- After confirmation:
  - Resume is deleted from database
  - Resume disappears from UI immediately
  - Console shows: `Resume deleted successfully: [{...}]`

### Resume Display
- Locked resumes show "Payment Required" badge
- Paid resumes show "Ready to Download" badge
- Delete button works for all resumes

## Additional Notes

### Why This Happened

Supabase RLS is a security feature that prevents unauthorized access. When RLS is enabled without proper policies, even the table owner (authenticated user) cannot perform operations.

### Service Role vs Authenticated Role

- **Service Role**: Used by webhooks and server-side operations (bypasses RLS)
- **Authenticated Role**: Used by client-side operations (respects RLS)

The webhook uses service role (admin client), so it can update resumes. But the dashboard uses authenticated role (browser client), so it needs proper RLS policies.

## Troubleshooting

### If delete still doesn't work after running SQL:

1. Check if RLS is enabled:
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public' AND tablename = 'resumes';
   ```
   Should show `rowsecurity: true`

2. Check existing policies:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'resumes';
   ```
   Should show 4 policies

3. Check user authentication:
   - Open browser console
   - Look for: `Auth state changed: SIGNED_IN`
   - Verify user ID matches the resume's user_id

4. Try using the admin client temporarily (for testing only):
   ```typescript
   // In src/app/dashboard/resumes/page.tsx
   import { createAdminClient } from '@/lib/supabase';
   const supabase = createAdminClient(); // Instead of createBrowserClient()
   ```
   If this works, it confirms RLS is the issue.

## Next Steps After Fix

Once delete works:
1. Test creating a new resume (go through builder)
2. Test payment flow (checkout → webhook → dashboard refresh)
3. Verify resume appears with "paid" status after payment
4. Test PDF download and shareable link

## Contact

If you continue to have issues after running the SQL script, share:
1. The output from running the SQL script
2. Console logs when attempting to delete
3. Screenshot of Supabase RLS policies for the `resumes` table
