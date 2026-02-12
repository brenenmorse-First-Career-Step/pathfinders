# Fix Instructions for Storage & Resume Issues

## Issues Identified

### Issue 1: Photo Upload Failing (Step 6)
**Error**: `StorageApiError: new row violates row-level security policy`

**Cause**: The `resume-assets` storage bucket either:
- Doesn't exist
- Has incorrect RLS (Row-Level Security) policies
- Policies are checking folder structure incorrectly

### Issue 2: Resume Not Created After Payment
**Cause**: The `resumes` storage bucket:
- Doesn't exist 
- Has no RLS policies configured
- Service role doesn't have permission to upload PDFs

## Solution: Run the SQL Fix Script

I've created a comprehensive SQL script that fixes BOTH issues.

### Step 1: Run the SQL Script

1. Open your Supabase Dashboard
2. Go to **SQL Editor**
3. Open the file: `sql/FINAL-FIX-ALL-STORAGE-ISSUES.sql`
4. Copy the entire contents
5. Paste into Supabase SQL Editor
6. Click **Run**

### Step 2: Verify the Fix

After running the script, you should see output like:

```
✅ ALL STORAGE ISSUES FIXED!

✅ resume-assets bucket: Created and configured
   - Profile photos can now be uploaded in Step 6

✅ resumes bucket: Created and configured
   - PDF generation will now work after payment

✅ RLS policies: All set for authenticated users and service role
```

The script also runs verification queries showing:
- Both buckets exist and are public
- All required RLS policies are in place
- Service role has permissions

### Step 3: Test the Fixes

#### Test Photo Upload (Step 6)
1. Go to `/builder/step-6`
2. Upload a photo
3. Should upload successfully without RLS errors
4. Check browser console - no 400 errors

#### Test Resume Creation
1. Complete the builder flow
2. Go to review page
3. Click "Complete and Pay"
4. Complete payment (use test card: 4242 4242 4242 4242)
5. After payment success, go to `/dashboard/resumes`
6. Your resume should appear with:
   - Status: "paid"
   - PDF URL should generate within 10-30 seconds
   - Shareable link should be available

## What the SQL Script Does

### Part 1: Fix resume-assets Bucket (Profile Photos)
- Creates `resume-assets` bucket (or updates if exists)
- Sets bucket to public
- Removes ALL old/conflicting policies
- Creates 4 new simplified policies:
  - `resume_assets_insert_policy`: Allows authenticated users to upload
  - `resume_assets_select_policy`: Allows public read access
  - `resume_assets_update_policy`: Allows authenticated users to update
  - `resume_assets_delete_policy`: Allows authenticated users to delete

### Part 2: Fix resumes Bucket (PDF Storage)
- Creates `resumes` bucket (or updates if exists)
- Sets bucket to public
- Creates 4 new policies:
  - `resumes_insert_policy`: Allows service role + authenticated to upload
  - `resumes_select_policy`: Allows public read access
  - `resumes_update_policy`: Allows service role + authenticated to update
  - `resumes_delete_policy`: Allows service role + authenticated to delete

### Part 3: Fix resumes Table RLS
- Updates RLS policies on the `resumes` table
- Ensures service role can create resumes (for webhook)
- Ensures users can view/manage their own resumes

## Technical Details

### Why the Photo Upload Was Failing

The old policy tried to parse the folder structure like this:
```sql
(storage.foldername(name))[1] = 'profile-photos' AND
auth.uid()::text = (storage.foldername(name))[2]
```

But the actual file path is:
```
profile-photos/f6ab1b6a-93b3-4d46-8299-f1d069896590-1768881397438.png
```

The policy expected a folder structure like `profile-photos/{userId}/filename.png` but the code uploads directly to `profile-photos/{userId}-{timestamp}.{ext}`.

### Why Resume Creation Was Failing

1. The Stripe webhook runs with **service_role** permissions
2. It calls `generateAndUploadResumePDF()` which uploads to the `resumes` bucket
3. The `resumes` bucket either didn't exist or didn't allow service_role uploads
4. Result: Resume record created, but PDF upload failed silently

## Monitoring Logs

After the fix, check your terminal/logs for:

### Successful Photo Upload
```
[Supabase Info] Client Creation: {message: 'Browser client created successfully'}
```

### Successful Resume Creation
```
[INFO] [Database]: INSERT on resumes {userId: '...', resumeId: '...'}
PDF generated and uploaded successfully
```

## Troubleshooting

### If Photo Upload Still Fails
1. Check browser console for exact error
2. Verify you're logged in (auth.uid() must exist)
3. Go to Supabase Dashboard > Storage > resume-assets > Check policies exist

### If Resume Still Not Created
1. Check Stripe webhook logs in Supabase Dashboard > Database > Functions & Edge Functions
2. Verify webhook is receiving events
3. Check if resume record is created but pdf_url is null
4. Look for errors in webhook execution logs

### If PDF URL is Null
The webhook creates the resume record first, then generates the PDF. This can take 10-30 seconds. 

If after 1 minute the PDF URL is still null:
1. Check webhook logs for PDF generation errors
2. Verify the `resumes` bucket exists and is public
3. Check if service role has upload permissions

## Next Steps After Fix

1. ✅ Run the SQL script
2. ✅ Test photo upload in Step 6
3. ✅ Test complete payment flow
4. ✅ Verify resume appears in dashboard with PDF

## Files Modified/Created

- ✅ Created: `sql/FINAL-FIX-ALL-STORAGE-ISSUES.sql` - The comprehensive fix
- ✅ Created: `FIX-INSTRUCTIONS.md` - This instruction document

## Support

If issues persist after running the script:
1. Check Supabase logs (Dashboard > Logs)
2. Check browser console errors
3. Verify both storage buckets exist and are public
4. Verify RLS policies are listed correctly
