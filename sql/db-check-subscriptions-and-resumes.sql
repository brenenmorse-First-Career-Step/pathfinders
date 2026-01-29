-- =============================================================================
-- DB check: subscriptions, resumes, and public.users (Supabase)
-- Run this in Supabase SQL Editor to see why new users don't get resumes.
-- Project uses Supabase, not Prisma.
-- =============================================================================

-- 1) Working user (you said this one works: 10 resumes, no payment asked)
--    Compare their rows to others.
SELECT 'Working user (c1360f11...)' AS check_name, id, email, full_name
FROM public.users
WHERE id = 'c1360f11-1836-45c1-9947-1c8be0ca7027';

SELECT 'Subscriptions for working user' AS check_name, *
FROM subscriptions
WHERE user_id = 'c1360f11-1836-45c1-9947-1c8be0ca7027';

SELECT 'Resumes for working user' AS check_name, id, user_id, status, created_at
FROM resumes
WHERE user_id = 'c1360f11-1836-45c1-9947-1c8be0ca7027'
ORDER BY created_at DESC;


-- 2) Users in auth.users who do NOT have a row in public.users
--    These users will fail: subscriptions and resumes both reference users(id).
--    create-checkout and webhook need public.users to exist.
SELECT 'Auth users MISSING from public.users (cause of failures)' AS check_name;
SELECT a.id AS auth_id, a.email AS auth_email, a.created_at
FROM auth.users a
LEFT JOIN public.users u ON u.id = a.id
WHERE u.id IS NULL
ORDER BY a.created_at DESC;


-- 3) All subscriptions vs resume counts per user
--    If subscription exists but resume_count = 0, resume creation failed for that user.
SELECT 'Users with subscription but no resumes (failed resume creation)' AS check_name;
SELECT s.user_id, s.status, s.stripe_subscription_id,
       (SELECT COUNT(*) FROM resumes r WHERE r.user_id = s.user_id) AS resume_count
FROM subscriptions s
WHERE (SELECT COUNT(*) FROM resumes r WHERE r.user_id = s.user_id) = 0;


-- 4) Summary: public.users count vs auth.users count
SELECT 'Summary: user table sync' AS check_name;
SELECT
  (SELECT COUNT(*) FROM auth.users) AS auth_users_count,
  (SELECT COUNT(*) FROM public.users) AS public_users_count,
  (SELECT COUNT(*) FROM auth.users a LEFT JOIN public.users u ON u.id = a.id WHERE u.id IS NULL) AS missing_in_public_users;


-- 5) BACKFILL (optional): Add public.users for auth.users that don't have a row
--    Run step 2 first; if you see missing users, run the INSERT below in a new query.
--    Then have affected users log in again and try "Create my resume" (or re-run checkout).
-- INSERT INTO public.users (id, email, full_name)
-- SELECT a.id, a.email, COALESCE(a.raw_user_meta_data->>'full_name', a.raw_user_meta_data->>'name', split_part(a.email, '@', 1))
-- FROM auth.users a
-- LEFT JOIN public.users u ON u.id = a.id
-- WHERE u.id IS NULL
-- ON CONFLICT (id) DO NOTHING;
