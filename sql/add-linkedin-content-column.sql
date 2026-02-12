-- LinkedIn Content Feature - Database Migration
-- This script ensures the linkedin_content column exists in the resumes table
-- Run this in your Supabase SQL Editor

-- Check if linkedin_content column exists, if not add it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'resumes' 
        AND column_name = 'linkedin_content'
    ) THEN
        ALTER TABLE resumes 
        ADD COLUMN linkedin_content TEXT;
        
        RAISE NOTICE 'Column linkedin_content added to resumes table';
    ELSE
        RAISE NOTICE 'Column linkedin_content already exists in resumes table';
    END IF;
END $$;

-- Optional: Add an index for faster queries if you plan to search by linkedin_content
-- CREATE INDEX IF NOT EXISTS idx_resumes_linkedin_content 
-- ON resumes(linkedin_content) 
-- WHERE linkedin_content IS NOT NULL;

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'resumes'
AND column_name = 'linkedin_content';
