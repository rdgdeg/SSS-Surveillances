-- Create cours table for course instructions registry
CREATE TABLE IF NOT EXISTS cours (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) NOT NULL UNIQUE,
  intitule_complet TEXT NOT NULL,
  consignes TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_cours_code ON cours(code);
CREATE INDEX IF NOT EXISTS idx_cours_intitule ON cours USING gin(to_tsvector('french', intitule_complet));
CREATE INDEX IF NOT EXISTS idx_cours_updated_at ON cours(updated_at DESC);

-- Enable Row Level Security
ALTER TABLE cours ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access to all courses
CREATE POLICY "Allow public read access to cours"
  ON cours
  FOR SELECT
  TO public
  USING (true);

-- Policy: Allow authenticated users to read all courses
CREATE POLICY "Allow authenticated read access to cours"
  ON cours
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Allow all operations on cours (for admin interface)
-- Note: Access control is handled at the application level
CREATE POLICY "Allow all operations on cours"
  ON cours
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_cours_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function
CREATE TRIGGER trigger_update_cours_updated_at
  BEFORE UPDATE ON cours
  FOR EACH ROW
  EXECUTE FUNCTION update_cours_updated_at();

-- Add comment to table
COMMENT ON TABLE cours IS 'Stores course information and exam instructions';
COMMENT ON COLUMN cours.code IS 'Unique course code (e.g., LEDPH1001)';
COMMENT ON COLUMN cours.intitule_complet IS 'Full course title';
COMMENT ON COLUMN cours.consignes IS 'Exam-specific instructions for supervisors';
