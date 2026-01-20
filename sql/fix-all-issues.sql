-- ============================================
-- COMPLETE FIX SCRIPT - RUN THIS ONE
-- ============================================
-- This script fixes all database and storage issues:
-- 1. Creates user records for existing auth users
-- 2. Fixes RLS policies for tables
-- 3. Fixes storage RLS policies for photo uploads
-- ============================================

-- ============================================
-- PART 1: FIX EXISTING USERS
-- ============================================

-- Insert missing user records from auth.users
INSERT INTO public.users (id, email, full_name, linkedin_link, date_created)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', ''),
  COALESCE(au.raw_user_meta_data->>'linkedin_link', NULL),
  au.created_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- PART 2: FIX RLS POLICIES FOR TABLES
-- ============================================

-- USERS TABLE POLICIES
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;
DROP POLICY IF EXISTS "Service role can insert users" ON users;

CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own data" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- PROFILE TABLE POLICIES
DROP POLICY IF EXISTS "Users can view own profile" ON profile;
DROP POLICY IF EXISTS "Users can insert own profile" ON profile;
DROP POLICY IF EXISTS "Users can update own profile" ON profile;

CREATE POLICY "Users can view own profile" ON profile
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON profile
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON profile
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- PART 3: FIX STORAGE BUCKET AND POLICIES
-- ============================================

-- Create the resume-assets bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('resume-assets', 'resume-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing storage policies for resume-assets
DROP POLICY IF EXISTS "Users can upload their own files" ON storage.objects;
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;

-- Policy: Allow authenticated users to upload files to profile-photos folder
-- The path is: profile-photos/{userId}-{timestamp}.{ext}
-- Extract userId from filename (format: {userId}-{timestamp}.{ext})
CREATE POLICY "Users can upload their own files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'resume-assets' AND
  name LIKE 'profile-photos/%' AND
  SPLIT_PART(REPLACE(name, 'profile-photos/', ''), '-', 1) = auth.uid()::text
);

-- Policy: Allow public read access to all files
CREATE POLICY "Public read access"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'resume-assets');

-- Policy: Allow users to update their own files
CREATE POLICY "Users can update their own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'resume-assets' AND
  name LIKE 'profile-photos/%' AND
  SPLIT_PART(REPLACE(name, 'profile-photos/', ''), '-', 1) = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'resume-assets' AND
  name LIKE 'profile-photos/%' AND
  SPLIT_PART(REPLACE(name, 'profile-photos/', ''), '-', 1) = auth.uid()::text
);

-- Policy: Allow users to delete their own files
CREATE POLICY "Users can delete their own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'resume-assets' AND
  name LIKE 'profile-photos/%' AND
  SPLIT_PART(REPLACE(name, 'profile-photos/', ''), '-', 1) = auth.uid()::text
);

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ All fixes applied successfully!';
  RAISE NOTICE '✅ User records created for existing auth users';
  RAISE NOTICE '✅ RLS policies fixed for tables';
  RAISE NOTICE '✅ Storage bucket and policies fixed for photo uploads';
  RAISE NOTICE '✅ Ready to use!';
END $$;
