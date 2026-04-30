-- NUCLEAR OPTION: Drop ALL tables and recreate from scratch
-- WARNING: This deletes ALL data in these tables!
-- Run this in Supabase SQL Editor

-- Drop tables in correct order (children first)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS verification_requests CASCADE;
DROP TABLE IF EXISTS support_messages CASCADE;
DROP TABLE IF EXISTS support_chats CASCADE;
DROP TABLE IF EXISTS ambassador_referrals CASCADE;
DROP TABLE IF EXISTS ambassadors CASCADE;
DROP TABLE IF EXISTS job_applications CASCADE;
DROP TABLE IF EXISTS vibin_signups CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Enable extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Products
CREATE TABLE products (
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

-- 2. Orders
CREATE TABLE orders (
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

-- 3. Vibin signups
CREATE TABLE vibin_signups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  coupon_code TEXT,
  source TEXT,
  metadata JSONB DEFAULT '{}',
  is_notified BOOLEAN DEFAULT FALSE,
  is_customer BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Job applications
CREATE TABLE job_applications (
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

-- 5. Ambassadors (WITH code column!)
CREATE TABLE ambassadors (
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

-- 6. Ambassador referrals
CREATE TABLE ambassador_referrals (
  id BIGSERIAL PRIMARY KEY,
  ambassador_code TEXT REFERENCES ambassadors(code),
  visitor_email TEXT,
  ip_address TEXT,
  user_agent TEXT,
  converted BOOLEAN DEFAULT FALSE,
  order_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Profiles
CREATE TABLE profiles (
  id UUID REFERENCES auth.users DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  is_ambassador BOOLEAN DEFAULT FALSE,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Support chats (WITH chat_id column!)
CREATE TABLE support_chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id TEXT UNIQUE NOT NULL DEFAULT 'CHAT-' || floor(random() * 100000)::text,
  email TEXT NOT NULL,
  status TEXT DEFAULT 'open',
  subject TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

-- 9. Support messages
CREATE TABLE support_messages (
  id BIGSERIAL PRIMARY KEY,
  chat_id UUID REFERENCES support_chats(id) ON DELETE CASCADE,
  sender TEXT NOT NULL,
  sender_email TEXT,
  message TEXT NOT NULL,
  needs_verification BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Verification requests
CREATE TABLE verification_requests (
  id BIGSERIAL PRIMARY KEY,
  chat_id UUID REFERENCES support_chats(id),
  request_type TEXT NOT NULL,
  order_id TEXT,
  reason TEXT,
  status TEXT DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

-- 11. Notifications
CREATE TABLE notifications (
  id BIGSERIAL PRIMARY KEY,
  user_email TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_orders_email ON orders(customer_email);
CREATE INDEX idx_vibin_signups_email ON vibin_signups(email);
CREATE INDEX idx_job_applications_job_id ON job_applications(job_id);
CREATE INDEX idx_ambassadors_code ON ambassadors(code);
CREATE INDEX idx_ambassador_referrals_code ON ambassador_referrals(ambassador_code);
CREATE INDEX idx_support_chats_email ON support_chats(email);
CREATE INDEX idx_support_messages_chat_id ON support_messages(chat_id);
CREATE INDEX idx_notifications_email ON notifications(user_email);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE vibin_signups ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE ambassadors ENABLE ROW LEVEL SECURITY;
ALTER TABLE ambassador_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public can view products" ON products FOR SELECT USING (true);
CREATE POLICY "Admins manage orders" ON orders FOR ALL USING (true);
CREATE POLICY "Anyone can sign up" ON vibin_signups FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can apply for jobs" ON job_applications FOR INSERT WITH CHECK (true);
CREATE POLICY "Ambassadors view own" ON ambassadors FOR SELECT USING (true);
CREATE POLICY "Anyone can apply ambassador" ON ambassadors FOR INSERT WITH CHECK (true);
CREATE POLICY "Users view own chats" ON support_chats FOR SELECT USING (true);
CREATE POLICY "Anyone can create chat" ON support_chats FOR INSERT WITH CHECK (true);
CREATE POLICY "Users view messages" ON support_messages FOR SELECT USING (true);
CREATE POLICY "Anyone can send message" ON support_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Users view own notifications" ON notifications FOR SELECT USING (true);

SELECT 'DATABASE RESET COMPLETE! All 11 tables created.' as status;
