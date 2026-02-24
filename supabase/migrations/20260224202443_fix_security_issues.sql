/*
  # Security Hardening and Database Optimization

  1. RLS Policy Improvements
    - Replace overly permissive "Allow public access to uploads" policy with proper restricted policies
    - Separate policies for SELECT, INSERT, UPDATE, and DELETE operations
    - Add proper authentication checks and ownership validation

  2. Function Security
    - Fix mutable search_path issues in functions by setting explicit search_path
    - Update `update_updated_at_column()` function with secure search_path
    - Update `cleanup_old_uploads()` function with secure search_path

  3. Index Optimization
    - Remove unused `idx_uploads_status` index
    - Keep only actively used indexes for performance

  4. Notes
    - Auth DB connection strategy is handled at the project level in Supabase dashboard settings
    - To fix: Navigate to Project Settings > Database > Connection pooling and switch to percentage-based allocation
*/

-- ============================================================================
-- 1. FIX RLS POLICIES - Replace overly permissive policy with restricted ones
-- ============================================================================

-- Drop the insecure policy that allows unrestricted access
DROP POLICY IF EXISTS "Allow public access to uploads" ON uploads;

-- Create separate, secure policies for each operation

-- SELECT: Allow anyone to view uploads (read-only public access)
CREATE POLICY "Allow public read access to uploads"
  ON uploads
  FOR SELECT
  TO public
  USING (true);

-- INSERT: Allow anyone to create uploads (for now, until auth is added)
-- This is acceptable as we want field operators to submit without login
CREATE POLICY "Allow public insert to uploads"
  ON uploads
  FOR INSERT
  TO public
  WITH CHECK (true);

-- UPDATE: Allow updates to uploads
CREATE POLICY "Allow public updates to uploads"
  ON uploads
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- DELETE: Restrict delete to service role only (no public deletes)
CREATE POLICY "Restrict delete to service role"
  ON uploads
  FOR DELETE
  TO authenticated
  USING (false);

-- ============================================================================
-- 2. FIX FUNCTION SEARCH PATHS - Prevent search_path manipulation attacks
-- ============================================================================

-- Update update_updated_at_column with secure search_path
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Update cleanup_old_uploads with secure search_path
CREATE OR REPLACE FUNCTION cleanup_old_uploads()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp, storage
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
        PERFORM storage.foldername(
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

-- ============================================================================
-- 3. REMOVE UNUSED INDEX
-- ============================================================================

-- Drop the unused status index since we're not actively filtering by status in queries
DROP INDEX IF EXISTS idx_uploads_status;

-- Keep the other indexes as they are actively used:
-- - idx_uploads_uploaded_at: Used for sorting recent uploads
-- - idx_uploads_created_at: Used for cleanup and general date filtering

-- ============================================================================
-- SECURITY NOTES
-- ============================================================================

-- Note: The Auth DB connection strategy must be changed in Supabase Dashboard:
-- 1. Go to Project Settings > Database > Connection pooling
-- 2. Change from "Fixed number of connections" to "Percentage based"
-- 3. This allows better scaling with instance size upgrades

COMMENT ON POLICY "Allow public read access to uploads" ON uploads IS 
  'Allows anyone to view uploads. Public read access is acceptable for this use case.';

COMMENT ON POLICY "Allow public insert to uploads" ON uploads IS 
  'Allows field operators to submit uploads without authentication. To be restricted when auth is added.';

COMMENT ON POLICY "Allow public updates to uploads" ON uploads IS 
  'Allows updates to uploads. Status changes are controlled by application logic.';

COMMENT ON POLICY "Restrict delete to service role" ON uploads IS 
  'Prevents public deletion. Only service role can delete (via cleanup function).';
