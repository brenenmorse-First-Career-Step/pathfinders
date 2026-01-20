-- ============================================
-- COMPLETE FIX FOR WEBHOOK RESUME CREATION
-- ============================================
-- This fixes BOTH the resumes table policy AND storage bucket policies
-- Run this to enable webhook to create resumes with PDFs
-- ============================================

-- ============================================
-- PART 1: FIX RESUMES TABLE POLICY
-- ============================================

-- Drop the incorrect service role policy
DROP POLICY IF EXISTS "Service role can manage all resumes" ON resumes;

-- Create correct policy that allows service_role to bypass RLS
CREATE POLICY "Service role can manage all resumes"
ON resumes
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- PART 2: ENSURE STORAGE POLICIES FOR SERVICE ROLE
-- ============================================

-- Make sure service_role can upload to resumes bucket
DO $$
BEGIN
  -- Check if policy exists, if not create it
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'resumes_insert_policy'
  ) THEN
    CREATE POLICY "resumes_insert_policy"
    ON storage.objects
    FOR INSERT
    TO authenticated, service_role
    WITH CHECK (bucket_id = 'resumes');
    
    RAISE NOTICE 'Created resumes_insert_policy';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'resumes_update_policy'
  ) THEN
    CREATE POLICY "resumes_update_policy"
    ON storage.objects
    FOR UPDATE
    TO authenticated, service_role
    USING (bucket_id = 'resumes')
    WITH CHECK (bucket_id = 'resumes');
    
    RAISE NOTICE 'Created resumes_update_policy';
  END IF;
END $$;

-- ============================================
-- PART 3: VERIFY FIXES
-- ============================================

-- Check resumes table policies
DO $$
DECLARE
  policy_record RECORD;
  has_service_role BOOLEAN := false;
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'RESUMES TABLE POLICIES:';
  RAISE NOTICE '============================================';
  
  FOR policy_record IN 
    SELECT policyname, cmd, roles::text
    FROM pg_policies 
    WHERE tablename = 'resumes'
    ORDER BY policyname
  LOOP
    RAISE NOTICE '  % (%) - roles: %', 
      policy_record.policyname, 
      policy_record.cmd,
      policy_record.roles;
    
    IF policy_record.policyname = 'Service role can manage all resumes' THEN
      has_service_role := true;
    END IF;
  END LOOP;
  
  IF has_service_role THEN
    RAISE NOTICE '✅ Service role policy exists';
  ELSE
    RAISE NOTICE '❌ Service role policy NOT found';
  END IF;
END $$;

-- Check storage policies
DO $$
DECLARE
  policy_record RECORD;
  has_insert BOOLEAN := false;
  has_update BOOLEAN := false;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'RESUMES STORAGE BUCKET POLICIES:';
  RAISE NOTICE '============================================';
  
  FOR policy_record IN 
    SELECT policyname, cmd, roles::text
    FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname LIKE '%resumes%'
    ORDER BY policyname
  LOOP
    RAISE NOTICE '  % (%) - roles: %', 
      policy_record.policyname, 
      policy_record.cmd,
      policy_record.roles;
    
    IF policy_record.policyname = 'resumes_insert_policy' AND policy_record.roles LIKE '%service_role%' THEN
      has_insert := true;
    END IF;
    
    IF policy_record.policyname = 'resumes_update_policy' AND policy_record.roles LIKE '%service_role%' THEN
      has_update := true;
    END IF;
  END LOOP;
  
  IF has_insert AND has_update THEN
    RAISE NOTICE '✅ Storage policies allow service_role';
  ELSE
    IF NOT has_insert THEN
      RAISE NOTICE '❌ Insert policy missing or incorrect';
    END IF;
    IF NOT has_update THEN
      RAISE NOTICE '❌ Update policy missing or incorrect';
    END IF;
  END IF;
END $$;

-- Check storage bucket exists
DO $$
DECLARE
  bucket_record RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'STORAGE BUCKETS:';
  RAISE NOTICE '============================================';
  
  FOR bucket_record IN 
    SELECT id, public 
    FROM storage.buckets 
    WHERE id IN ('resumes', 'resume-assets')
    ORDER BY id
  LOOP
    RAISE NOTICE '  % - Public: %', 
      bucket_record.id,
      CASE WHEN bucket_record.public THEN '✅ Yes' ELSE '❌ No' END;
  END LOOP;
END $$;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ WEBHOOK FIX COMPLETE!';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Next steps:';
  RAISE NOTICE '  1. Test the payment flow again';
  RAISE NOTICE '  2. Complete payment with test card';
  RAISE NOTICE '  3. Check /dashboard/resumes for your resume';
  RAISE NOTICE '  4. Wait 30 seconds for PDF to generate';
  RAISE NOTICE '';
  RAISE NOTICE '🔍 If still not working:';
  RAISE NOTICE '  1. Run DIAGNOSE-RESUME-ISSUE.sql';
  RAISE NOTICE '  2. Check Stripe webhook logs';
  RAISE NOTICE '  3. See WEBHOOK-DEBUGGING-GUIDE.md';
  RAISE NOTICE '';
END $$;
