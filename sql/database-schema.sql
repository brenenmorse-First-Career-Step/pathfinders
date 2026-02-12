-- FirstCareerSteps Database Schema
-- Execute this in Supabase SQL Editor

-- Users table (extends auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  linkedin_link TEXT,
  full_name TEXT,
  date_created TIMESTAMP DEFAULT NOW()
);

-- Profile table
CREATE TABLE IF NOT EXISTS profile (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  
  -- Step 1: Student Basics
  high_school TEXT,
  graduation_year TEXT,
  interests TEXT[],
  
  -- Step 2: Headline
  headline TEXT,
  
  -- Step 3: About
  about_text TEXT,
  
  -- Step 5: Skills
  skills TEXT[],
  
  -- Step 6: Photo
  photo_url TEXT,
  photo_enhanced_url TEXT,
  
  date_updated TIMESTAMP DEFAULT NOW()
);

-- Experiences table (Step 4)
CREATE TABLE IF NOT EXISTS experiences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('job','sport','club','volunteer','project','extracurricular','other')),
  title TEXT,
  organization TEXT,
  bullets TEXT[],
  date_created TIMESTAMP DEFAULT NOW()
);

-- Resume table (for payment and PDF generation)
CREATE TABLE IF NOT EXISTS resume (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  pdf_url TEXT,
  generated_at TIMESTAMP DEFAULT NOW(),
  version INTEGER DEFAULT 1,
  stripe_session_id TEXT,
  payment_status TEXT CHECK (payment_status IN ('pending','paid')) DEFAULT 'pending'
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE resume ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON profile;
DROP POLICY IF EXISTS "Users can insert own profile" ON profile;
DROP POLICY IF EXISTS "Users can update own profile" ON profile;
DROP POLICY IF EXISTS "Users can view own experiences" ON experiences;
DROP POLICY IF EXISTS "Users can insert own experiences" ON experiences;
DROP POLICY IF EXISTS "Users can update own experiences" ON experiences;
DROP POLICY IF EXISTS "Users can delete own experiences" ON experiences;
DROP POLICY IF EXISTS "Users can view own resume" ON resume;
DROP POLICY IF EXISTS "Users can insert own resume" ON resume;

-- RLS Policies for users table
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for profile table
CREATE POLICY "Users can view own profile" ON profile
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON profile
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON profile
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for experiences table
CREATE POLICY "Users can view own experiences" ON experiences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own experiences" ON experiences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own experiences" ON experiences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own experiences" ON experiences
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for resume table
CREATE POLICY "Users can view own resume" ON resume
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own resume" ON resume
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create storage buckets (run these separately in Supabase Dashboard > Storage)
-- 1. Create bucket named "resumes" - Set as PUBLIC
-- 2. Create bucket named "photos" - Set as PUBLIC

-- Storage Policies for resumes bucket
-- Allow authenticated users to upload their own resumes
INSERT INTO storage.buckets (id, name, public) 
VALUES ('resumes', 'resumes', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow users to upload to their own folder
CREATE POLICY "Users can upload own resumes"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'resumes' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update their own resumes
CREATE POLICY "Users can update own resumes"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'resumes' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own resumes
CREATE POLICY "Users can delete own resumes"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'resumes' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access (since bucket is public)
CREATE POLICY "Public can view resumes"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'resumes');

-- Storage Policies for photos bucket
-- Allow authenticated users to upload their own photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow users to upload to their own folder
CREATE POLICY "Users can upload own photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update their own photos
CREATE POLICY "Users can update own photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own photos
CREATE POLICY "Users can delete own photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access (since bucket is public)
CREATE POLICY "Public can view photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'photos');
