-- Simple Migration: Add resumes table
-- Copy and paste this into Supabase SQL Editor and click RUN

-- Drop old resume table (you have 0 rows, so safe to drop)
DROP TABLE IF EXISTS resume CASCADE;

-- Create new resumes table
CREATE TABLE resumes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL DEFAULT 'My Resume',
    status TEXT NOT NULL CHECK (status IN ('draft', 'locked', 'paid')) DEFAULT 'draft',
    pdf_url TEXT,
    shareable_link TEXT UNIQUE,
    linkedin_content TEXT,
    stripe_session_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_resumes_user_id ON resumes(user_id);
CREATE INDEX idx_resumes_shareable_link ON resumes(shareable_link);

-- Enable Row Level Security
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Users can only see their own resumes
CREATE POLICY "Users can view own resumes" ON resumes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own resumes" ON resumes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own resumes" ON resumes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own resumes" ON resumes
  FOR DELETE USING (auth.uid() = user_id);

-- Allow public to view shared resumes (for shareable links)
CREATE POLICY "Public can view shared resumes" ON resumes
  FOR SELECT USING (shareable_link IS NOT NULL AND status = 'paid');
