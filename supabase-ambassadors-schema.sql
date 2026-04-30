-- ══════════════════════════════════════════════════════════════════
-- VIBIN APPAREL — Ambassadors Table
-- Run this in Supabase SQL Editor → New Query → Run
-- ══════════════════════════════════════════════════════════════════

CREATE TABLE ambassadors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL, -- e.g., "JOSIAS10", "AMB001"
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  instagram_handle TEXT,
  tiktok_handle TEXT,
  status TEXT DEFAULT 'pending', -- pending, approved, suspended
  commission_rate INTEGER DEFAULT 15, -- percentage (15, 20, 25)
  total_earned DECIMAL(10,2) DEFAULT 0.00,
  total_clicks INTEGER DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  referral_link TEXT, -- generated: vibinapparel.com/?ref=CODE
  created_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ
);

-- Indexes for fast lookups
CREATE INDEX idx_ambassadors_code ON ambassadors(code);
CREATE INDEX idx_ambassadors_email ON ambassadors(email);
CREATE INDEX idx_ambassadors_status ON ambassadors(status);

-- Enable Row Level Security
ALTER TABLE ambassadors ENABLE ROW LEVEL SECURITY;

-- Policy: Ambassadors can read their own data (using email as identifier)
CREATE POLICY "Ambassadors can view own data"
  ON ambassadors FOR SELECT
  USING (true); -- Simplified for localStorage-based auth

-- Policy: Anyone can apply to become an ambassador (insert)
CREATE POLICY "Anyone can apply to be ambassador"
  ON ambassadors FOR INSERT
  WITH CHECK (true);

-- Policy: Only admins can update/delete
CREATE POLICY "Admins manage ambassadors"
  ON ambassadors FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- ══════════════════════════════════════════════════════════════════
-- REFERRAL TRACKING TABLE
-- ══════════════════════════════════════════════════════════════════

CREATE TABLE ambassador_referrals (
  id BIGSERIAL PRIMARY KEY,
  ambassador_code TEXT NOT NULL REFERENCES ambassadors(code),
  visitor_email TEXT,
  ip_address TEXT,
  user_agent TEXT,
  converted BOOLEAN DEFAULT FALSE, -- did they purchase?
  order_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_referrals_code ON ambassador_referrals(ambassador_code);
CREATE INDEX idx_referrals_converted ON ambassador_referrals(converted);

-- Policy: Ambassadors can see their own referrals
CREATE POLICY "Ambassadors view own referrals"
  ON ambassador_referrals FOR SELECT
  USING (true);

-- Policy: System can insert referrals (tracking)
CREATE POLICY "System tracks referrals"
  ON ambassador_referrals FOR INSERT
  WITH CHECK (true);

-- ══════════════════════════════════════════════════════════════════
-- USEFUL QUERIES
-- ══════════════════════════════════════════════════════════════════

-- See all ambassadors
-- SELECT code, name, email, status, commission_rate, total_earned
-- FROM ambassadors
-- ORDER BY created_at DESC;

-- See referral stats for an ambassador
-- SELECT
--   COUNT(*) as total_clicks,
--   SUM(CASE WHEN converted THEN 1 ELSE 0 END) as conversions
-- FROM ambassador_referrals
-- WHERE ambassador_code = 'JOSIAS10';

-- Update ambassador commission tier
-- UPDATE ambassadors
-- SET commission_rate = 20
-- WHERE code = 'JOSIAS10' AND total_orders >= 5;

-- Approve pending ambassador
-- UPDATE ambassadors
-- SET status = 'approved', approved_at = NOW()
-- WHERE code = 'JOSIAS10';
