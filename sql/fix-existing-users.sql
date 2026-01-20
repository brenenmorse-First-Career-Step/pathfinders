-- ============================================
-- FIX EXISTING USERS WITHOUT RECORDS
-- ============================================
-- This script creates user records for existing auth users
-- who don't have records in the users table
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

-- Show how many users were created
SELECT 
  COUNT(*) as users_created,
  'User records created for existing auth users' as message
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;

-- Verify all auth users now have records
SELECT 
  COUNT(DISTINCT au.id) as total_auth_users,
  COUNT(DISTINCT pu.id) as total_user_records,
  CASE 
    WHEN COUNT(DISTINCT au.id) = COUNT(DISTINCT pu.id) THEN '✅ All users have records'
    ELSE '⚠️ Some users are missing records'
  END as status
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id;
