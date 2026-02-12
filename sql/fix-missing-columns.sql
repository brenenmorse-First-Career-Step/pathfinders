-- ============================================
-- FIX: MISSING COLUMNS IN USERS TABLE
-- ============================================
-- The Stripe webhook requires the 'full_name' column to exist in the 'users' table.
-- Run this script in the Supabase SQL Editor.

-- 1. Add missing columns to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS linkedin_link TEXT,
ADD COLUMN IF NOT EXISTS date_created TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Ensure role column exists (for admin panel)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin'));

-- 3. Backfill any missing names from auth.users metadata
UPDATE public.users u
SET full_name = COALESCE(
  au.raw_user_meta_data->>'full_name', 
  au.raw_user_meta_data->>'name', 
  split_part(au.email, '@', 1)
)
FROM auth.users au
WHERE u.id = au.id AND (u.full_name IS NULL OR u.full_name = '');

-- 4. Verify columns
DO $$ 
BEGIN
  RAISE NOTICE '✅ Users table schema updated successfully';
END $$;
