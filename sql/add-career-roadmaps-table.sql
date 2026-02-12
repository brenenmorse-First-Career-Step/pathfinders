-- Migration: Add career_roadmaps table
-- Copy and paste this into Supabase SQL Editor and click RUN

-- Create career_roadmaps table
CREATE TABLE IF NOT EXISTS career_roadmaps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    career_name TEXT NOT NULL,
    roadmap_data JSONB NOT NULL,
    infographic_url TEXT,
    milestone_roadmap_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_career_roadmaps_user_id ON career_roadmaps(user_id);
CREATE INDEX idx_career_roadmaps_created_at ON career_roadmaps(created_at DESC);

-- Enable Row Level Security
ALTER TABLE career_roadmaps ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own roadmaps" ON career_roadmaps;
DROP POLICY IF EXISTS "Users can insert own roadmaps" ON career_roadmaps;
DROP POLICY IF EXISTS "Users can update own roadmaps" ON career_roadmaps;
DROP POLICY IF EXISTS "Users can delete own roadmaps" ON career_roadmaps;

-- RLS Policies - Users can only see their own roadmaps
CREATE POLICY "Users can view own roadmaps" ON career_roadmaps
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own roadmaps" ON career_roadmaps
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own roadmaps" ON career_roadmaps
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own roadmaps" ON career_roadmaps
  FOR DELETE USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_career_roadmaps_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_career_roadmaps_updated_at
    BEFORE UPDATE ON career_roadmaps
    FOR EACH ROW
    EXECUTE FUNCTION update_career_roadmaps_updated_at();
