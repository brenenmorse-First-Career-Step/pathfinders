-- ============================================
-- FIX RLS POLICIES IF MISSING
-- ============================================
-- This script ensures all necessary RLS policies exist
-- Run this if you're getting 406 errors
-- ============================================

-- ============================================
-- USERS TABLE POLICIES
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;
DROP POLICY IF EXISTS "Service role can insert users" ON users;

-- Create policies
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own data" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================
-- PROFILE TABLE POLICIES
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON profile;
DROP POLICY IF EXISTS "Users can insert own profile" ON profile;
DROP POLICY IF EXISTS "Users can update own profile" ON profile;

-- Create policies
CREATE POLICY "Users can view own profile" ON profile
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON profile
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON profile
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ RLS policies fixed!';
  RAISE NOTICE '✅ Users can now access their own data';
END $$;
