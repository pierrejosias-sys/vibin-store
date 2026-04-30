-- ══════════════════════════════════════════════════════════════════
-- VIBIN APPAREL — COMPLETE DATABASE SCHEMA
-- Copy-paste ALL of this into Supabase SQL Editor → Run
-- ══════════════════════════════════════════════════════════════════

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ══════════════════════════════════════════════════════════════════
-- 1. PRODUCTS TABLE
-- ══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS products (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  category TEXT,
  color TEXT,
  image_color TEXT,
  description TEXT,
  in_stock BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_created ON products(created_at DESC);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Public can view products" ON products FOR SELECT USING (true);

-- ══════════════════════════════════════════════════════════════════
-- 2. ORDERS TABLE
-- ══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS orders (
  id BIGSERIAL PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL DEFAULT 'ORD-' || floor(random() * 100000)::text,
  customer_email TEXT NOT NULL,
  items JSONB NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending',
  shipping_address JSONB,
  stripe_session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Admins manage orders" ON orders FOR ALL USING (true);

-- ══════════════════════════════════════════════════════════════════
-- 3. VIBIN_SIGNUPS TABLE
-- ══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS vibin_signups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  coupon_code TEXT,
  source TEXT,
  metadata JSONB DEFAULT '{}',
  is_notified BOOLEAN DEFAULT FALSE,
  is_customer BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vibin_signups_email ON vibin_signups(email);
CREATE INDEX IF NOT EXISTS idx_vibin_signups_created ON vibin_signups(created_at DESC);

ALTER TABLE vibin_signups ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Anyone can sign up" ON vibin_signups FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Anyone can read by email" ON vibin_signups FOR SELECT USING (true);

-- ══════════════════════════════════════════════════════════════════
-- 4. JOB_APPLICATIONS TABLE
-- ══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS job_applications (
  id BIGSERIAL PRIMARY KEY,
  job_id INTEGER NOT NULL,
  job_title TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  portfolio TEXT,
  experience TEXT NOT NULL,
  cover_letter TEXT,
  status TEXT DEFAULT 'pending',
  applied_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications(status);

ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Anyone can apply" ON job_applications FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Admins manage applications" ON job_applications FOR ALL USING (true);

-- ══════════════════════════════════════════════════════════════════
-- 5. AMBASSADORS TABLE
-- ══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS ambassadors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  instagram_handle TEXT,
  tiktok_handle TEXT,
  status TEXT DEFAULT 'pending',
  commission_rate INTEGER DEFAULT 15,
  total_earned DECIMAL(10,2) DEFAULT 0.00,
  total_clicks INTEGER DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  referral_link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ambassadors_code ON ambassadors(code);
CREATE INDEX IF NOT EXISTS idx_ambassadors_email ON ambassadors(email);

ALTER TABLE ambassadors ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Ambassadors view own" ON ambassadors FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Anyone can apply ambassador" ON ambassadors FOR INSERT WITH CHECK (true);

-- ══════════════════════════════════════════════════════════════════
-- 6. AMBASSADOR_REFERRALS TABLE
-- ══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS ambassador_referrals (
  id BIGSERIAL PRIMARY KEY,
  ambassador_code TEXT REFERENCES ambassadors(code),
  visitor_email TEXT,
  ip_address TEXT,
  user_agent TEXT,
  converted BOOLEAN DEFAULT FALSE,
  order_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referrals_code ON ambassador_referrals(ambassador_code);

ALTER TABLE ambassador_referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Ambassadors view own referrals" ON ambassador_referrals FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "System tracks referrals" ON ambassador_referrals FOR INSERT WITH CHECK (true);

-- ══════════════════════════════════════════════════════════════════
-- 7. PROFILES TABLE
-- ══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  is_ambassador BOOLEAN DEFAULT FALSE,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Users view own profile" ON profiles FOR SELECT USING (auth.uid() = id);

-- ══════════════════════════════════════════════════════════════════
-- 8. SUPPORT_CHATS TABLE
-- ══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS support_chats (
  id BIGSERIAL PRIMARY KEY,
  chat_id TEXT UNIQUE NOT NULL DEFAULT 'CHAT-' || floor(random() * 100000)::text,
  email TEXT NOT NULL,
  status TEXT DEFAULT 'open',
  subject TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_support_chats_email ON support_chats(email);
CREATE INDEX IF NOT EXISTS idx_support_chats_status ON support_chats(status);

ALTER TABLE support_chats ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Anyone can create chat" ON support_chats FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Users view own chats" ON support_chats FOR SELECT USING (true);

-- ══════════════════════════════════════════════════════════════════
-- 9. SUPPORT_MESSAGES TABLE
-- ══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS support_messages (
  id BIGSERIAL PRIMARY KEY,
  chat_id TEXT REFERENCES support_chats(chat_id) ON DELETE CASCADE,
  sender TEXT NOT NULL,
  sender_email TEXT,
  message TEXT NOT NULL,
  needs_verification BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_messages_chat ON support_messages(chat_id);

ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Anyone can send message" ON support_messages FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Users view messages" ON support_messages FOR SELECT USING (true);

-- ══════════════════════════════════════════════════════════════════
-- 10. VERIFICATION_REQUESTS TABLE
-- ══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS verification_requests (
  id BIGSERIAL PRIMARY KEY,
  chat_id TEXT REFERENCES support_chats(chat_id),
  request_type TEXT NOT NULL,
  order_id TEXT,
  reason TEXT,
  status TEXT DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_verification_chat ON verification_requests(chat_id);

ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Anyone can create request" ON verification_requests FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Admins manage verifications" ON verification_requests FOR ALL USING (true);

-- ══════════════════════════════════════════════════════════════════
-- 11. NOTIFICATIONS TABLE
-- ══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS notifications (
  id BIGSERIAL PRIMARY KEY,
  user_email TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_email ON notifications(user_email);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Users view own notifications" ON notifications FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "System creates notifications" ON notifications FOR INSERT WITH CHECK (true);

-- ══════════════════════════════════════════════════════════════════
-- DONE! All 11 tables created.
-- ══════════════════════════════════════════════════════════════════
