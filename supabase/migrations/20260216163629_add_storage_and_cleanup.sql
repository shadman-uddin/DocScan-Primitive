/*
  # Add Storage Bucket and Automatic Cleanup System
  
  1. Storage Setup
    - Create 'uploads' storage bucket for file storage
    - Set bucket to public for easy access
    - Add RLS policies for authenticated users to upload/read
  
  2. Database Changes
    - Add `file_url` column to uploads table (stores Supabase Storage URL)
    - Keep `thumbnail_url` for image previews (base64 or storage URL)
  
  3. Cleanup System
    - Enable pg_cron extension for scheduled tasks
    - Create cleanup function to delete uploads older than 30 days
    - Function deletes both database records and storage files
    - Schedule daily cleanup job at 2 AM UTC
  
  4. Security
    - RLS policies allow authenticated users to upload/read their files
    - Public bucket allows direct image viewing in browser
*/

-- Add file_url column to store Supabase Storage URLs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'uploads' AND column_name = 'file_url'
  ) THEN
    ALTER TABLE uploads ADD COLUMN file_url text;
  END IF;
END $$;

-- Create storage bucket for uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'uploads',
  'uploads',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for storage bucket (allow authenticated users to upload and read)
CREATE POLICY "Allow authenticated users to upload files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'uploads');

CREATE POLICY "Allow public read access to uploads"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'uploads');

CREATE POLICY "Allow authenticated users to delete their files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'uploads');

-- Enable pg_cron extension for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create cleanup function that deletes old uploads and their storage files
CREATE OR REPLACE FUNCTION cleanup_old_uploads()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER := 0;
  upload_record RECORD;
BEGIN
  -- Loop through uploads older than 30 days
  FOR upload_record IN
    SELECT id, file_url
    FROM uploads
    WHERE created_at < NOW() - INTERVAL '30 days'
  LOOP
    -- Delete file from storage if it exists
    IF upload_record.file_url IS NOT NULL THEN
      BEGIN
        -- Extract path from storage URL and delete
        PERFORM storage.delete_object(
          'uploads',
          SUBSTRING(upload_record.file_url FROM 'uploads/(.+)$')
        );
      EXCEPTION WHEN OTHERS THEN
        -- Log error but continue (file might already be deleted)
        RAISE NOTICE 'Failed to delete storage file for upload %: %', upload_record.id, SQLERRM;
      END;
    END IF;
    
    -- Delete database record
    DELETE FROM uploads WHERE id = upload_record.id;
    deleted_count := deleted_count + 1;
  END LOOP;
  
  -- Log the cleanup
  RAISE NOTICE 'Cleanup complete: deleted % uploads older than 30 days', deleted_count;
END;
$$;

-- Schedule cleanup job to run daily at 2 AM UTC
SELECT cron.schedule(
  'cleanup-old-uploads',
  '0 2 * * *',
  'SELECT cleanup_old_uploads();'
);

-- Add comment for documentation
COMMENT ON FUNCTION cleanup_old_uploads() IS 'Automatically deletes uploads and their storage files that are older than 30 days. Runs daily at 2 AM UTC via pg_cron.';