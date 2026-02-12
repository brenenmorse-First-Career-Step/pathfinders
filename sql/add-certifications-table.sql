-- Create certifications table for storing user certifications
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS certifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  issuer TEXT,
  date_issued TEXT,
  credential_id TEXT,
  credential_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own certifications"
ON certifications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own certifications"
ON certifications FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own certifications"
ON certifications FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own certifications"
ON certifications FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS certifications_user_id_idx ON certifications(user_id);

COMMENT ON TABLE certifications IS 'User certifications and credentials';
