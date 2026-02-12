-- Add show_photo_on_resume column to profile table
-- This controls whether the user's photo appears on their resume

ALTER TABLE profile 
ADD COLUMN IF NOT EXISTS show_photo_on_resume BOOLEAN DEFAULT true;

COMMENT ON COLUMN profile.show_photo_on_resume IS 'Whether to display profile photo on resume';
