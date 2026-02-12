-- Setup storage bucket for career roadmap images
-- Run this in Supabase SQL Editor

-- Create the roadmaps bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('roadmaps', 'roadmaps', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "roadmaps_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "roadmaps_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "roadmaps_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "roadmaps_delete_policy" ON storage.objects;

-- Policy 1: Allow authenticated users to upload roadmap images
CREATE POLICY "roadmaps_insert_policy"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'roadmaps');

-- Policy 2: Allow public read access to roadmap images
CREATE POLICY "roadmaps_select_policy"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'roadmaps');

-- Policy 3: Allow authenticated users to update their roadmap images
CREATE POLICY "roadmaps_update_policy"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'roadmaps')
WITH CHECK (bucket_id = 'roadmaps');

-- Policy 4: Allow authenticated users to delete their roadmap images
CREATE POLICY "roadmaps_delete_policy"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'roadmaps');
