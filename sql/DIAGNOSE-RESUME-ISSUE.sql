-- ============================================
-- DIAGNOSTIC QUERIES FOR RESUME ISSUE
-- ============================================
-- Run these queries to understand what's happening
-- ============================================

-- 1. Check if any resumes exist in the database
SELECT 
  id,
  user_id,
  title,
  status,
  pdf_url,
  shareable_link,
  stripe_session_id,
  version,
  created_at,
  updated_at
FROM resumes
ORDER BY created_at DESC
LIMIT 10;

-- 2. Check recent payment records (if you have a payments table)
-- Comment out if you don't have this table
-- SELECT * FROM payments ORDER BY created_at DESC LIMIT 5;

-- 3. Check storage policies for resumes bucket
SELECT 
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' 
  AND policyname LIKE '%resume%'
ORDER BY policyname;

-- 4. Check if resumes table RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'resumes';

-- 5. List all policies on resumes table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'resumes'
ORDER BY policyname;

-- 6. Check if storage buckets exist
SELECT 
  id,
  name,
  public,
  created_at
FROM storage.buckets
WHERE id IN ('resumes', 'resume-assets')
ORDER BY name;

-- 7. Check if any files are in the resumes bucket
SELECT 
  id,
  name,
  bucket_id,
  owner,
  created_at,
  updated_at,
  last_accessed_at
FROM storage.objects
WHERE bucket_id = 'resumes'
ORDER BY created_at DESC
LIMIT 10;

-- ============================================
-- INTERPRETATION GUIDE
-- ============================================
-- Query 1: Shows if resume RECORDS are being created
--   - If empty: Webhook isn't creating records at all
--   - If has records but pdf_url is NULL: PDF generation failing
--   - If has records with pdf_url: Everything working!
--
-- Query 3: Shows storage bucket policies
--   - Should have policies for service_role
--
-- Query 5: Shows resumes table policies
--   - "Service role" policy should have TO service_role
--
-- Query 7: Shows actual PDF files in storage
--   - If empty: PDFs aren't being uploaded
--   - If has files: PDFs are uploading correctly
-- ============================================
