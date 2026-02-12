-- Add date fields to experiences table
-- Run this in your Supabase SQL Editor

ALTER TABLE experiences 
ADD COLUMN IF NOT EXISTS start_date TEXT,
ADD COLUMN IF NOT EXISTS end_date TEXT,
ADD COLUMN IF NOT EXISTS is_current BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS location TEXT;

-- Optional: Add comments to document the columns
COMMENT ON COLUMN experiences.start_date IS 'Start date in YYYY-MM format';
COMMENT ON COLUMN experiences.end_date IS 'End date in YYYY-MM format';
COMMENT ON COLUMN experiences.is_current IS 'Whether this is a current position';
COMMENT ON COLUMN experiences.location IS 'Location of the experience';
