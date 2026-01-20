-- ============================================
-- CHECK RLS POLICIES
-- ============================================
-- Run this to see all RLS policies and verify they're correct
-- ============================================

-- Check all RLS policies
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
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Check if specific policies exist for users table
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'users'
ORDER BY cmd, policyname;

-- Check if specific policies exist for profile table
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'profile'
ORDER BY cmd, policyname;
