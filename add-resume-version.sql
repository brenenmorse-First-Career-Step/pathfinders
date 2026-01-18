-- Add version column to resumes table
ALTER TABLE resumes
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- Add comment to explain version column
COMMENT ON COLUMN resumes.version IS 'Resume version number, increments with each regeneration';

-- Update existing resumes to have version 1
UPDATE resumes
SET version = 1
WHERE version IS NULL;
