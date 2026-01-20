-- ============================================
-- FRESH DATABASE RECREATION SCRIPT
-- ============================================
-- This script drops all existing tables and recreates them fresh
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- STEP 1: DROP ALL EXISTING TABLES (CASCADE)
-- ============================================
DROP TABLE IF EXISTS certifications CASCADE;
DROP TABLE IF EXISTS resumes CASCADE;
DROP TABLE IF EXISTS experiences CASCADE;
DROP TABLE IF EXISTS profile CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS user_payments CASCADE;

-- ============================================
-- STEP 2: CREATE USERS TABLE
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  linkedin_link TEXT,
  full_name TEXT,
  date_created TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- STEP 3: CREATE PROFILE TABLE
-- ============================================
CREATE TABLE profile (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  
  -- Step 1: Student Basics
  phone TEXT,
  location TEXT,
  linkedin TEXT,
  high_school TEXT,
  graduation_year TEXT,
  interests TEXT[] DEFAULT '{}',
  
  -- Step 2: Headline
  headline TEXT,
  
  -- Step 3: About
  about_text TEXT,
  
  -- Step 5: Skills
  skills TEXT[] DEFAULT '{}',
  
  -- Step 6: Photo
  photo_url TEXT,
  photo_enhanced_url TEXT,
  show_photo_on_resume BOOLEAN DEFAULT true,
  
  date_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- STEP 4: CREATE EXPERIENCES TABLE
-- ============================================
CREATE TABLE experiences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  type TEXT CHECK (type IN ('job','sport','club','volunteer','project','extracurricular','other','fulltime','parttime','remote','freelance','hybrid','onsite')) NOT NULL,
  title TEXT NOT NULL,
  organization TEXT NOT NULL,
  bullets TEXT[] DEFAULT '{}',
  start_date TEXT,
  end_date TEXT,
  is_current BOOLEAN DEFAULT false,
  location TEXT,
  date_created TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- STEP 5: CREATE CERTIFICATIONS TABLE
-- ============================================
CREATE TABLE certifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  issuer TEXT,
  date_issued TEXT,
  credential_id TEXT,
  credential_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- STEP 6: CREATE RESUMES TABLE
-- ============================================
CREATE TABLE resumes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL DEFAULT 'My Resume',
  status TEXT NOT NULL CHECK (status IN ('draft', 'locked', 'paid')) DEFAULT 'draft',
  pdf_url TEXT,
  shareable_link TEXT UNIQUE,
  linkedin_content TEXT,
  stripe_session_id TEXT,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- STEP 7: CREATE USER_PAYMENTS TABLE
-- ============================================
CREATE TABLE user_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  has_paid BOOLEAN DEFAULT false,
  payment_amount DECIMAL(10, 2),
  stripe_payment_intent_id TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- STEP 8: CREATE INDEXES
-- ============================================
CREATE INDEX idx_profile_user_id ON profile(user_id);
CREATE INDEX idx_experiences_user_id ON experiences(user_id);
CREATE INDEX idx_experiences_date_created ON experiences(date_created);
CREATE INDEX idx_certifications_user_id ON certifications(user_id);
CREATE INDEX idx_resumes_user_id ON resumes(user_id);
CREATE INDEX idx_resumes_shareable_link ON resumes(shareable_link);
CREATE INDEX idx_resumes_status ON resumes(status);
CREATE INDEX idx_user_payments_user_id ON user_payments(user_id);

-- ============================================
-- STEP 9: ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_payments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 10: DROP EXISTING POLICIES (if any)
-- ============================================
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;

DROP POLICY IF EXISTS "Users can view own profile" ON profile;
DROP POLICY IF EXISTS "Users can insert own profile" ON profile;
DROP POLICY IF EXISTS "Users can update own profile" ON profile;

DROP POLICY IF EXISTS "Users can view own experiences" ON experiences;
DROP POLICY IF EXISTS "Users can insert own experiences" ON experiences;
DROP POLICY IF EXISTS "Users can update own experiences" ON experiences;
DROP POLICY IF EXISTS "Users can delete own experiences" ON experiences;

DROP POLICY IF EXISTS "Users can view own certifications" ON certifications;
DROP POLICY IF EXISTS "Users can insert own certifications" ON certifications;
DROP POLICY IF EXISTS "Users can update own certifications" ON certifications;
DROP POLICY IF EXISTS "Users can delete own certifications" ON certifications;

DROP POLICY IF EXISTS "Users can view own resumes" ON resumes;
DROP POLICY IF EXISTS "Users can insert own resumes" ON resumes;
DROP POLICY IF EXISTS "Users can update own resumes" ON resumes;
DROP POLICY IF EXISTS "Users can delete own resumes" ON resumes;
DROP POLICY IF EXISTS "Public can view shared resumes" ON resumes;

DROP POLICY IF EXISTS "Users can view own payments" ON user_payments;
DROP POLICY IF EXISTS "Users can insert own payments" ON user_payments;
DROP POLICY IF EXISTS "Users can update own payments" ON user_payments;

-- ============================================
-- STEP 11: CREATE RLS POLICIES - USERS
-- ============================================
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Allow users to insert their own record (needed during signup)
CREATE POLICY "Users can insert own data" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Also allow service role to insert (for triggers)
CREATE POLICY "Service role can insert users" ON users
  FOR INSERT 
  TO service_role
  WITH CHECK (true);

-- ============================================
-- STEP 12: CREATE RLS POLICIES - PROFILE
-- ============================================
CREATE POLICY "Users can view own profile" ON profile
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON profile
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON profile
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- STEP 13: CREATE RLS POLICIES - EXPERIENCES
-- ============================================
CREATE POLICY "Users can view own experiences" ON experiences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own experiences" ON experiences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own experiences" ON experiences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own experiences" ON experiences
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- STEP 14: CREATE RLS POLICIES - CERTIFICATIONS
-- ============================================
CREATE POLICY "Users can view own certifications" ON certifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own certifications" ON certifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own certifications" ON certifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own certifications" ON certifications
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- STEP 15: CREATE RLS POLICIES - RESUMES
-- ============================================
CREATE POLICY "Users can view own resumes" ON resumes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own resumes" ON resumes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own resumes" ON resumes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own resumes" ON resumes
  FOR DELETE USING (auth.uid() = user_id);

-- Allow public to view shared resumes
CREATE POLICY "Public can view shared resumes" ON resumes
  FOR SELECT USING (shareable_link IS NOT NULL AND status = 'paid');

-- ============================================
-- STEP 16: CREATE RLS POLICIES - USER_PAYMENTS
-- ============================================
CREATE POLICY "Users can view own payments" ON user_payments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payments" ON user_payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own payments" ON user_payments
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- STEP 17: CREATE TRIGGER TO AUTO-CREATE USER RECORD
-- ============================================
-- This trigger automatically creates a users table record when auth.users is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, linkedin_link)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'linkedin_link', NULL)
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, users.full_name),
    linkedin_link = COALESCE(EXCLUDED.linkedin_link, users.linkedin_link);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Database recreated successfully!';
  RAISE NOTICE '✅ All tables created with correct schema';
  RAISE NOTICE '✅ RLS policies applied';
  RAISE NOTICE '✅ Auto-create trigger for users table added';
  RAISE NOTICE '✅ Ready to use - no user data (fresh start)';
END $$;
