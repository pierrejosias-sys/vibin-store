-- Supabase tables for support chatbot
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/grbwnjnngzcsjlubcmtp/sql

-- Chat sessions table
CREATE TABLE IF NOT EXISTS support_chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT,
  email TEXT,
  status TEXT DEFAULT 'open', -- open, pending_verification, resolved
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS support_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID REFERENCES support_chats(id) ON DELETE CASCADE,
  sender TEXT, -- 'user', 'bot', 'admin'
  message TEXT,
  needs_verification BOOLEAN DEFAULT FALSE,
  verified_by TEXT,
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Verification requests table
CREATE TABLE IF NOT EXISTS verification_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID REFERENCES support_chats(id) ON DELETE CASCADE,
  message_id UUID REFERENCES support_messages(id) ON DELETE CASCADE,
  requester_email TEXT,
  request_type TEXT, -- 'refund', 'exchange', 'price_match', 'other'
  details JSONB,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  admin_response TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP
);

-- Enable RLS
ALTER TABLE support_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;

-- Policies (allow all for now since we're using anon key)
CREATE POLICY "Allow anon access" ON support_chats FOR ALL USING (true);
CREATE POLICY "Allow anon access" ON support_messages FOR ALL USING (true);
CREATE POLICY "Allow anon access" ON verification_requests FOR ALL USING (true);
