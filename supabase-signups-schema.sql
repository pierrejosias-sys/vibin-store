-- ═══════════════════════════════════════════════════════════════════
-- VIBIN APPAREL — Email Signup Table
-- Run this in Supabase SQL Editor → New Query → Run
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE vibin_signups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  coupon_code TEXT,
  source TEXT, -- 'top' or 'bottom' form
  metadata JSONB DEFAULT '{}', -- referrer, user agent, etc.
  is_notified BOOLEAN DEFAULT FALSE, -- have we sent them the launch email yet?
  is_customer BOOLEAN DEFAULT FALSE, -- did they convert into a buyer?
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast email lookups (duplicate detection)
CREATE INDEX idx_vibin_signups_email ON vibin_signups(email);
CREATE INDEX idx_vibin_signups_created ON vibin_signups(created_at DESC);

-- Enable Row Level Security
ALTER TABLE vibin_signups ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can sign up (insert their own email)
CREATE POLICY "Anyone can sign up"
  ON vibin_signups FOR INSERT
  WITH CHECK (true);

-- Policy: Anyone can check if they're already signed up (returns their coupon)
-- This is needed so the duplicate-email handler works
CREATE POLICY "Anyone can read by their own email"
  ON vibin_signups FOR SELECT
  USING (true);

-- Policy: Only admins (you) can update/delete
CREATE POLICY "Admins manage signups"
  ON vibin_signups FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

CREATE POLICY "Admins delete signups"
  ON vibin_signups FOR DELETE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- ═══════════════════════════════════════════════════════════════════
-- USEFUL QUERIES (run anytime to see your data)
-- ═══════════════════════════════════════════════════════════════════

-- See total signups
-- SELECT COUNT(*) FROM vibin_signups;

-- See latest signups
-- SELECT email, coupon_code, source, created_at
-- FROM vibin_signups
-- ORDER BY created_at DESC
-- LIMIT 50;

-- Export all emails (paste this in Supabase SQL Editor, results will be downloadable)
-- SELECT email, coupon_code, created_at FROM vibin_signups ORDER BY created_at;

-- Count signups by source
-- SELECT source, COUNT(*) FROM vibin_signups GROUP BY source;

-- See signups today
-- SELECT * FROM vibin_signups WHERE created_at > NOW() - INTERVAL '24 hours';
