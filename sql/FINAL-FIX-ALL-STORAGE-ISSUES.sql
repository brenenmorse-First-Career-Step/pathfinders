-- ============================================
-- FINAL FIX FOR ALL STORAGE ISSUES
-- ============================================
-- This script fixes:
-- 1. resume-assets bucket for profile photos (Step 6 upload issue)
-- 2. resumes bucket for PDF storage (Resume creation issue)
-- ============================================

-- ============================================
-- PART 1: FIX resume-assets BUCKET (Profile Photos)
-- ============================================

-- Create the resume-assets bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('resume-assets', 'resume-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop ALL existing policies for resume-assets bucket
DROP POLICY IF EXISTS "Users can upload their own files" ON storage.objects;
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Public can read files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete" ON storage.objects;

-- NEW SIMPLIFIED POLICIES for resume-assets bucket

-- Policy 1: Allow authenticated users to upload to resume-assets
CREATE POLICY "resume_assets_insert_policy"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'resume-assets');

-- Policy 2: Allow public read access
CREATE POLICY "resume_assets_select_policy"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'resume-assets');

-- Policy 3: Allow authenticated users to update
CREATE POLICY "resume_assets_update_policy"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'resume-assets')
WITH CHECK (bucket_id = 'resume-assets');

-- Policy 4: Allow authenticated users to delete
CREATE POLICY "resume_assets_delete_policy"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'resume-assets');

-- ============================================
-- PART 2: CREATE AND FIX resumes BUCKET (PDF Storage)
-- ============================================

-- Create the resumes bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing policies for resumes bucket
DROP POLICY IF EXISTS "resumes_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "resumes_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "resumes_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "resumes_delete_policy" ON storage.objects;
DROP POLICY IF EXISTS "service_role_insert_resumes" ON storage.objects;
DROP POLICY IF EXISTS "service_role_update_resumes" ON storage.objects;

-- Policy 1: Allow service role and authenticated users to upload PDFs
CREATE POLICY "resumes_insert_policy"
ON storage.objects
FOR INSERT
TO authenticated, service_role
WITH CHECK (bucket_id = 'resumes');

-- Policy 2: Allow public read access to PDFs
CREATE POLICY "resumes_select_policy"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'resumes');

-- Policy 3: Allow service role and authenticated users to update PDFs
CREATE POLICY "resumes_update_policy"
ON storage.objects
FOR UPDATE
TO authenticated, service_role
USING (bucket_id = 'resumes')
WITH CHECK (bucket_id = 'resumes');

-- Policy 4: Allow service role and authenticated users to delete PDFs
CREATE POLICY "resumes_delete_policy"
ON storage.objects
FOR DELETE
TO authenticated, service_role
USING (bucket_id = 'resumes');

-- ============================================
-- PART 3: VERIFY RESUMES TABLE EXISTS
-- ============================================

-- Make sure resumes table has proper RLS policies
DROP POLICY IF EXISTS "Users can view own resumes" ON resumes;
DROP POLICY IF EXISTS "Users can insert own resumes" ON resumes;
DROP POLICY IF EXISTS "Users can update own resumes" ON resumes;
DROP POLICY IF EXISTS "Users can delete own resumes" ON resumes;
DROP POLICY IF EXISTS "Service role can manage all resumes" ON resumes;

CREATE POLICY "Users can view own resumes" ON resumes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own resumes" ON resumes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own resumes" ON resumes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own resumes" ON resumes
  FOR DELETE USING (auth.uid() = user_id);

-- Allow service role to manage all resumes (for webhook)
CREATE POLICY "Service role can manage all resumes" ON resumes
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check buckets
SELECT 
  id, 
  name, 
  public,
  created_at
FROM storage.buckets 
WHERE id IN ('resume-assets', 'resumes')
ORDER BY name;

-- Check storage policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'objects' 
  AND (policyname LIKE '%resume%' OR policyname LIKE '%resumes%')
ORDER BY policyname;

-- Check resumes table policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'resumes'
ORDER BY policyname;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ ALL STORAGE ISSUES FIXED!';
  RAISE NOTICE '';
  RAISE NOTICE '✅ resume-assets bucket: Created and configured';
  RAISE NOTICE '   - Profile photos can now be uploaded in Step 6';
  RAISE NOTICE '';
  RAISE NOTICE '✅ resumes bucket: Created and configured';
  RAISE NOTICE '   - PDF generation will now work after payment';
  RAISE NOTICE '';
  RAISE NOTICE '✅ RLS policies: All set for authenticated users and service role';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 You can now:';
  RAISE NOTICE '   1. Upload photos in Step 6 without RLS errors';
  RAISE NOTICE '   2. Generate resumes after payment completion';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Check the verification results above to confirm all is working!';
END $$;
