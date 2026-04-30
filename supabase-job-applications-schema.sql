-- ══════════════════════════════════════════════════════════════════
-- VIBIN APPAREL — Job Applications Table
-- Run this in Supabase SQL Editor → New Query → Run
-- ══════════════════════════════════════════════════════════════════

CREATE TABLE job_applications (
  id BIGSERIAL PRIMARY KEY,
  job_id INTEGER NOT NULL,
  job_title TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  portfolio TEXT,
  experience TEXT NOT NULL,
  cover_letter TEXT,
  status TEXT DEFAULT 'pending', -- pending, reviewing, accepted, rejected
  applied_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX idx_job_applications_job_id ON job_applications(job_id);
CREATE INDEX idx_job_applications_status ON job_applications(status);
CREATE INDEX idx_job_applications_email ON job_applications(email);

-- Enable Row Level Security
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can submit (insert) an application
CREATE POLICY "Anyone can apply for jobs"
  ON job_applications FOR INSERT
  WITH CHECK (true);

-- Policy: Only admins can view/update/delete applications
CREATE POLICY "Admins manage applications"
  ON job_applications FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- ══════════════════════════════════════════════════════════════════
-- USEFUL QUERIES (run anytime to see your data)
-- ══════════════════════════════════════════════════════════════════

-- See all applications for a specific job
-- SELECT * FROM job_applications
-- WHERE job_id = 1
-- ORDER BY applied_at DESC;

-- Update application status
-- UPDATE job_applications
-- SET status = 'reviewing'
-- WHERE id = 123;

-- Count applications by status
-- SELECT status, COUNT(*) FROM job_applications GROUP BY status;

-- Get applications with job details
-- SELECT
--   job_applications.*,
--   jobs.title as job_title
-- FROM job_applications
-- LEFT JOIN jobs ON job_applications.job_id = jobs.id
-- ORDER BY applied_at DESC;
