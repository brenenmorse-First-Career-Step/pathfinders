-- Add new contact fields to profile table
-- Run this in your Supabase SQL Editor

ALTER TABLE profile 
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS linkedin TEXT;

-- Optional: Add comment to document the columns
COMMENT ON COLUMN profile.phone IS 'User phone number';
COMMENT ON COLUMN profile.location IS 'User location (e.g., New York, NY)';
COMMENT ON COLUMN profile.linkedin IS 'LinkedIn profile URL';
