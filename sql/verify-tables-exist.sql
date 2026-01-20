-- ============================================
-- VERIFY TABLES EXIST AND ARE ACCESSIBLE
-- ============================================
-- Run this to check if tables exist and can be queried
-- ============================================

-- Check if tables exist
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('users', 'profile', 'experiences', 'certifications', 'resumes', 'user_payments')
ORDER BY table_name;

-- Try to query each table (should return empty if tables exist but no data)
SELECT 'users' as table_name, COUNT(*) as row_count FROM users
UNION ALL
SELECT 'profile', COUNT(*) FROM profile
UNION ALL
SELECT 'experiences', COUNT(*) FROM experiences
UNION ALL
SELECT 'certifications', COUNT(*) FROM certifications
UNION ALL
SELECT 'resumes', COUNT(*) FROM resumes
UNION ALL
SELECT 'user_payments', COUNT(*) FROM user_payments;

-- Check RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('users', 'profile', 'experiences', 'certifications', 'resumes', 'user_payments')
ORDER BY tablename;

-- Check if trigger exists
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table = 'users';
