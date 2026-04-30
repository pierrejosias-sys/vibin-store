-- Vibin Apparel - Clean SQL Schema
-- Run each CREATE TABLE block separately if needed

-- Enable extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Products table
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

-- 2. Orders table
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

-- 3. Vibin signups table
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

-- 4. Job applications table
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

-- 5. Ambassadors table
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

-- 6. Ambassador referrals table
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

-- 7. Profiles table (if not already existing)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  is_ambassador BOOLEAN DEFAULT FALSE,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Support chats table
CREATE TABLE IF NOT EXISTS support_chats (
  id BIGSERIAL PRIMARY KEY,
  chat_id TEXT UNIQUE NOT NULL DEFAULT 'CHAT-' || floor(random() * 100000)::text,
  email TEXT NOT NULL,
  status TEXT DEFAULT 'open',
  subject TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

-- 9. Support messages table
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

-- 10. Verification requests table
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

-- 11. Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id BIGSERIAL PRIMARY KEY,
  user_email TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Done! Check tables with:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
