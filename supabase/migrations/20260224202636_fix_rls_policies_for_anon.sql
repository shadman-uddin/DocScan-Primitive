/*
  # Fix RLS Policies for Anonymous Users

  1. Problem
    - Current policies are set for 'public' role
    - Supabase anon key uses 'anon' role, not 'public'
    - This causes permission errors when trying to insert/update data

  2. Solution
    - Update all policies to use 'anon' role instead of 'public'
    - Keep the same security logic but apply to correct role

  3. Changes
    - DROP existing public policies
    - CREATE new policies for anon role with same logic
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow public read access to uploads" ON uploads;
DROP POLICY IF EXISTS "Allow public insert to uploads" ON uploads;
DROP POLICY IF EXISTS "Allow public updates to uploads" ON uploads;
DROP POLICY IF EXISTS "Restrict delete to service role" ON uploads;

-- Create policies for anonymous users (anon role)

-- SELECT: Allow anonymous users to view all uploads
CREATE POLICY "Allow anonymous read access to uploads"
  ON uploads
  FOR SELECT
  TO anon
  USING (true);

-- INSERT: Allow anonymous users to create uploads
CREATE POLICY "Allow anonymous insert to uploads"
  ON uploads
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- UPDATE: Allow anonymous users to update uploads
CREATE POLICY "Allow anonymous updates to uploads"
  ON uploads
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- DELETE: Restrict delete to authenticated users only
CREATE POLICY "Restrict delete to authenticated users"
  ON uploads
  FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Also add policies for authenticated users in case auth is added later

-- SELECT: Allow authenticated users to view all uploads
CREATE POLICY "Allow authenticated read access to uploads"
  ON uploads
  FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: Allow authenticated users to create uploads
CREATE POLICY "Allow authenticated insert to uploads"
  ON uploads
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- UPDATE: Allow authenticated users to update uploads
CREATE POLICY "Allow authenticated updates to uploads"
  ON uploads
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Add comments for documentation
COMMENT ON POLICY "Allow anonymous read access to uploads" ON uploads IS 
  'Allows unauthenticated users (anon role) to view all uploads';

COMMENT ON POLICY "Allow anonymous insert to uploads" ON uploads IS 
  'Allows unauthenticated users (anon role) to submit uploads';

COMMENT ON POLICY "Allow anonymous updates to uploads" ON uploads IS 
  'Allows unauthenticated users (anon role) to update uploads';

COMMENT ON POLICY "Allow authenticated read access to uploads" ON uploads IS 
  'Allows authenticated users to view all uploads';

COMMENT ON POLICY "Allow authenticated insert to uploads" ON uploads IS 
  'Allows authenticated users to submit uploads';

COMMENT ON POLICY "Allow authenticated updates to uploads" ON uploads IS 
  'Allows authenticated users to update uploads';

COMMENT ON POLICY "Restrict delete to authenticated users" ON uploads IS 
  'Only authenticated users can delete uploads';
