-- Fix Storage RLS Policies for resume-assets bucket
-- Run this in your Supabase SQL Editor to fix the upload error

-- First, drop the existing policies
DROP POLICY IF EXISTS "Users can upload their own files" ON storage.objects;
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;

-- Create simplified policies

-- Policy: Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'resume-assets');

-- Policy: Allow public read access to all files
CREATE POLICY "Public can read files"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'resume-assets');

-- Policy: Allow authenticated users to update files
CREATE POLICY "Authenticated users can update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'resume-assets')
WITH CHECK (bucket_id = 'resume-assets');

-- Policy: Allow authenticated users to delete files
CREATE POLICY "Authenticated users can delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'resume-assets');
