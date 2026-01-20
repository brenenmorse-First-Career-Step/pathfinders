-- Create the resume-assets storage bucket for profile photos and resume assets
-- Run this in your Supabase SQL Editor

-- Create the bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('resume-assets', 'resume-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for the resume-assets bucket

-- Policy: Allow authenticated users to upload their own files
CREATE POLICY "Users can upload their own files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'resume-assets' AND
  (storage.foldername(name))[1] = 'profile-photos' AND
  auth.uid()::text = (storage.foldername(name))[2]
);

-- Policy: Allow public read access to all files
CREATE POLICY "Public read access"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'resume-assets');

-- Policy: Allow users to update their own files
CREATE POLICY "Users can update their own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'resume-assets' AND
  (storage.foldername(name))[1] = 'profile-photos' AND
  auth.uid()::text = (storage.foldername(name))[2]
)
WITH CHECK (
  bucket_id = 'resume-assets' AND
  (storage.foldername(name))[1] = 'profile-photos' AND
  auth.uid()::text = (storage.foldername(name))[2]
);

-- Policy: Allow users to delete their own files
CREATE POLICY "Users can delete their own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'resume-assets' AND
  (storage.foldername(name))[1] = 'profile-photos' AND
  auth.uid()::text = (storage.foldername(name))[2]
);
