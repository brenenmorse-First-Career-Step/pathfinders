-- ============================================
-- FIX WEBHOOK POLICIES FOR RESUME CREATION
-- ============================================
-- Run this in Supabase SQL Editor to fix the issue where
-- resumes are not created after successful Stripe checkout.
--
-- Root cause: The webhook runs as service_role but the
-- users and resumes tables don't have service_role policies,
-- so RLS blocks the webhook's INSERT/UPSERT operations.
-- ============================================

-- ============================================
-- 1. SERVICE ROLE POLICY ON USERS TABLE
-- ============================================
-- The webhook upserts into public.users to ensure the user
-- record exists before creating subscriptions and resumes.
-- Without this policy, the upsert is silently blocked by RLS.

DROP POLICY IF EXISTS "Service role can manage users" ON users;

CREATE POLICY "Service role can manage users" ON users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DO $$ BEGIN
  RAISE NOTICE '✅ Service role policy added to users table';
END $$;

-- ============================================
-- 2. SERVICE ROLE POLICY ON RESUMES TABLE
-- ============================================
-- The webhook inserts into resumes to create the user's
-- first resume after successful checkout payment.

DROP POLICY IF EXISTS "Service role can manage all resumes" ON resumes;

CREATE POLICY "Service role can manage all resumes" ON resumes
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DO $$ BEGIN
  RAISE NOTICE '✅ Service role policy added to resumes table';
END $$;

-- ============================================
-- 3. BACKFILL MISSING PUBLIC.USERS RECORDS
-- ============================================
-- Users who signed up via auth.users but don't have a
-- corresponding row in public.users will never get resumes
-- because the FK constraint blocks the insert.

INSERT INTO public.users (id, email, full_name)
SELECT
  a.id,
  a.email,
  COALESCE(
    a.raw_user_meta_data->>'full_name',
    a.raw_user_meta_data->>'name',
    split_part(a.email, '@', 1)
  )
FROM auth.users a
LEFT JOIN public.users u ON u.id = a.id
WHERE u.id IS NULL
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  RAISE NOTICE '✅ Backfilled missing public.users records';
END $$;

-- ============================================
-- 4. VERIFY POLICIES ARE IN PLACE
-- ============================================

DO $$
DECLARE
  v_users_ok BOOLEAN := false;
  v_resumes_ok BOOLEAN := false;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'users'
      AND policyname = 'Service role can manage users'
  ) INTO v_users_ok;

  SELECT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'resumes'
      AND policyname = 'Service role can manage all resumes'
  ) INTO v_resumes_ok;

  IF v_users_ok AND v_resumes_ok THEN
    RAISE NOTICE '';
    RAISE NOTICE '============================================';
    RAISE NOTICE '🎉 ALL FIXES APPLIED SUCCESSFULLY!';
    RAISE NOTICE '============================================';
    RAISE NOTICE '';
    RAISE NOTICE '📝 Next steps:';
    RAISE NOTICE '  1. Verify STRIPE_WEBHOOK_SECRET in Vercel matches test-mode secret';
    RAISE NOTICE '  2. Deploy the code change (top-level email import removed)';
    RAISE NOTICE '  3. Test checkout with card: 4242 4242 4242 4242';
    RAISE NOTICE '  4. Resume should appear at /dashboard/resumes';
  ELSE
    IF NOT v_users_ok THEN
      RAISE EXCEPTION '❌ users table service_role policy NOT found';
    END IF;
    IF NOT v_resumes_ok THEN
      RAISE EXCEPTION '❌ resumes table service_role policy NOT found';
    END IF;
  END IF;
END $$;
