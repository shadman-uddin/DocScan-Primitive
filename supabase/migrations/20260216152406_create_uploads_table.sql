/*
  # Create uploads table for DocScan app

  1. New Tables
    - `uploads`
      - `id` (uuid, primary key) - Unique identifier for each upload
      - `file_name` (text, not null) - Original filename of uploaded document
      - `file_type` (text, not null) - MIME type (image/jpeg, image/png, application/pdf, etc.)
      - `file_size` (integer, not null) - File size in bytes
      - `thumbnail_url` (text) - URL or base64 data URI for preview image
      - `status` (text, not null) - Current review status (pending_review, approved, rejected)
      - `uploaded_at` (timestamptz, not null) - When the document was uploaded
      - `submitted_by` (text, not null) - User identifier who submitted the document
      - `extracted_data` (jsonb) - Structured extraction results from AI
      - `created_at` (timestamptz, not null) - Record creation timestamp
      - `updated_at` (timestamptz, not null) - Record last update timestamp

  2. Indexes
    - Index on `status` for fast filtering of pending reviews
    - Index on `uploaded_at` for sorting by date
    - Index on `created_at` for general queries

  3. Security
    - Enable RLS on `uploads` table
    - Add policy for public access (authentication will be added in future phases)

  4. Triggers
    - Automatic update of `updated_at` timestamp on row changes
*/

-- Create uploads table
CREATE TABLE IF NOT EXISTS uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name text NOT NULL,
  file_type text NOT NULL,
  file_size integer NOT NULL CHECK (file_size > 0),
  thumbnail_url text,
  status text NOT NULL DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'approved', 'rejected')),
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  submitted_by text NOT NULL DEFAULT 'current_user',
  extracted_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_uploads_status ON uploads(status);
CREATE INDEX IF NOT EXISTS idx_uploads_uploaded_at ON uploads(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_uploads_created_at ON uploads(created_at DESC);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function
DROP TRIGGER IF EXISTS update_uploads_updated_at ON uploads;
CREATE TRIGGER update_uploads_updated_at
  BEFORE UPDATE ON uploads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;

-- Create policy for public access (will be restricted when auth is added)
CREATE POLICY "Allow public access to uploads"
  ON uploads
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);