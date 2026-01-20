-- ============================================
-- MASTER FIX SCRIPT - RUN THIS ONE FILE ONLY
-- ============================================
-- This single script fixes ALL issues:
-- 1. Service role policy for resumes table (causing 400 errors in webhook)
-- 2. Storage bucket policies for resume-assets (profile photos)
-- 3. Storage bucket policies for resumes (PDF files)
-- 4. Verifies all fixes are applied correctly
-- ============================================

-- ============================================
-- FIX 1: RESUMES TABLE - SERVICE ROLE POLICY
-- ============================================
-- This is THE MAIN ISSUE causing 400 errors in Stripe webhook
-- The webhook runs as service_role and needs permission to INSERT

-- Drop the broken policy
DROP POLICY IF EXISTS "Service role can manage all resumes" ON resumes;

-- Create correct policy with explicit service_role grant
CREATE POLICY "Service role can manage all resumes"
ON resumes
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

DO $$ BEGIN
  RAISE NOTICE '✅ Fixed: Service role can now create/update resumes';
END $$;

-- ============================================
-- FIX 2: STORAGE BUCKETS - ENSURE THEY EXIST
-- ============================================

-- Create resume-assets bucket (for profile photos)
INSERT INTO storage.buckets (id, name, public)
VALUES ('resume-assets', 'resume-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Create resumes bucket (for PDF files)
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DO $$ BEGIN
  RAISE NOTICE '✅ Storage buckets created/updated';
END $$;

-- ============================================
-- FIX 3: STORAGE POLICIES - RESUME-ASSETS
-- ============================================

-- Drop old conflicting policies
DROP POLICY IF EXISTS "Users can upload their own files" ON storage.objects;
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Public can read files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete" ON storage.objects;
DROP POLICY IF EXISTS "resume_assets_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "resume_assets_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "resume_assets_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "resume_assets_delete_policy" ON storage.objects;

-- Create new simplified policies for resume-assets
CREATE POLICY "resume_assets_insert_policy"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'resume-assets');

CREATE POLICY "resume_assets_select_policy"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'resume-assets');

CREATE POLICY "resume_assets_update_policy"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'resume-assets')
WITH CHECK (bucket_id = 'resume-assets');

CREATE POLICY "resume_assets_delete_policy"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'resume-assets');

DO $$ BEGIN
  RAISE NOTICE '✅ Profile photo upload policies created';
END $$;

-- ============================================
-- FIX 4: STORAGE POLICIES - RESUMES BUCKET
-- ============================================

-- Drop old policies
DROP POLICY IF EXISTS "resumes_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "resumes_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "resumes_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "resumes_delete_policy" ON storage.objects;

-- Create new policies that allow service_role (for webhook) to upload PDFs
CREATE POLICY "resumes_insert_policy"
ON storage.objects
FOR INSERT
TO authenticated, service_role
WITH CHECK (bucket_id = 'resumes');

CREATE POLICY "resumes_select_policy"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'resumes');

CREATE POLICY "resumes_update_policy"
ON storage.objects
FOR UPDATE
TO authenticated, service_role
USING (bucket_id = 'resumes')
WITH CHECK (bucket_id = 'resumes');

CREATE POLICY "resumes_delete_policy"
ON storage.objects
FOR DELETE
TO authenticated, service_role
USING (bucket_id = 'resumes');

DO $$ BEGIN
  RAISE NOTICE '✅ PDF storage policies created';
END $$;

-- ============================================
-- VERIFICATION
-- ============================================

-- Verify resumes table policy
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM pg_policies 
  WHERE tablename = 'resumes' 
    AND policyname = 'Service role can manage all resumes';
  
  IF v_count > 0 THEN
    RAISE NOTICE '✅ VERIFIED: Service role policy exists on resumes table';
  ELSE
    RAISE EXCEPTION '❌ FAILED: Service role policy not found';
  END IF;
END $$;

-- Verify storage buckets exist
DO $$
DECLARE
  v_resume_assets_exists BOOLEAN;
  v_resumes_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'resume-assets'
  ) INTO v_resume_assets_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'resumes'
  ) INTO v_resumes_exists;
  
  IF v_resume_assets_exists AND v_resumes_exists THEN
    RAISE NOTICE '✅ VERIFIED: Both storage buckets exist';
  ELSE
    IF NOT v_resume_assets_exists THEN
      RAISE EXCEPTION '❌ FAILED: resume-assets bucket not found';
    END IF;
    IF NOT v_resumes_exists THEN
      RAISE EXCEPTION '❌ FAILED: resumes bucket not found';
    END IF;
  END IF;
END $$;

-- Verify storage policies
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Check resume-assets policies
  SELECT COUNT(*) INTO v_count
  FROM pg_policies 
  WHERE tablename = 'objects' 
    AND policyname LIKE 'resume_assets%';
  
  IF v_count >= 4 THEN
    RAISE NOTICE '✅ VERIFIED: resume-assets policies exist (% policies)', v_count;
  ELSE
    RAISE EXCEPTION '❌ FAILED: Missing resume-assets policies (found %, need 4)', v_count;
  END IF;
  
  -- Check resumes bucket policies
  SELECT COUNT(*) INTO v_count
  FROM pg_policies 
  WHERE tablename = 'objects' 
    AND policyname LIKE 'resumes_%';
  
  IF v_count >= 4 THEN
    RAISE NOTICE '✅ VERIFIED: resumes bucket policies exist (% policies)', v_count;
  ELSE
    RAISE EXCEPTION '❌ FAILED: Missing resumes policies (found %, need 4)', v_count;
  END IF;
END $$;

-- Display final summary
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE '🎉 ALL FIXES APPLIED SUCCESSFULLY!';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Fixed Items:';
  RAISE NOTICE '   1. Service role can create resumes (fixes 400 webhook error)';
  RAISE NOTICE '   2. resume-assets bucket ready for photo uploads';
  RAISE NOTICE '   3. resumes bucket ready for PDF storage';
  RAISE NOTICE '   4. All RLS policies configured correctly';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Next Steps:';
  RAISE NOTICE '   1. Test photo upload at /builder/step-6';
  RAISE NOTICE '   2. Complete payment with card: 4242 4242 4242 4242';
  RAISE NOTICE '   3. Resume should appear at /dashboard/resumes';
  RAISE NOTICE '   4. PDF will generate within 30 seconds';
  RAISE NOTICE '';
  RAISE NOTICE '🔍 Expected Results:';
  RAISE NOTICE '   - Stripe webhook returns 200 OK (not 400)';
  RAISE NOTICE '   - Resume record created in database';
  RAISE NOTICE '   - PDF uploaded to storage bucket';
  RAISE NOTICE '   - Resume visible in dashboard';
  RAISE NOTICE '';
END $$;

-- Display current state for reference
SELECT 
  'RESUMES TABLE POLICIES' as "Section",
  policyname as "Policy Name",
  cmd as "Command",
  roles::text as "Roles"
FROM pg_policies 
WHERE tablename = 'resumes'
ORDER BY policyname;

SELECT 
  'STORAGE BUCKETS' as "Section",
  id as "Bucket ID",
  CASE WHEN public THEN 'Yes' ELSE 'No' END as "Public"
FROM storage.buckets 
WHERE id IN ('resume-assets', 'resumes')
ORDER BY id;

SELECT 
  'STORAGE POLICIES - RESUME-ASSETS' as "Section",
  policyname as "Policy Name",
  cmd as "Command",
  roles::text as "Roles"
FROM pg_policies 
WHERE tablename = 'objects' 
  AND policyname LIKE 'resume_assets%'
ORDER BY policyname;

SELECT 
  'STORAGE POLICIES - RESUMES' as "Section",
  policyname as "Policy Name",
  cmd as "Command",
  roles::text as "Roles"
FROM pg_policies 
WHERE tablename = 'objects' 
  AND policyname LIKE 'resumes_%'
ORDER BY policyname;
