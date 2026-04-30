-- ══════════════════════════════════════════════════════════════════
-- VIBIN APPAREL — Support Chat & Verification Tables
-- Run this in Supabase SQL Editor → New Query → Run
-- ══════════════════════════════════════════════════════════════════

-- PROFILES TABLE (for admin users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  is_ambassador BOOLEAN DEFAULT FALSE,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_admin ON profiles(is_admin);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins manage profiles" ON profiles FOR ALL USING (EXISTS (
  SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE
));

-- SUPPORT CHATS TABLE
CREATE TABLE support_chats (
  id BIGSERIAL PRIMARY KEY,
  chat_id TEXT UNIQUE NOT NULL DEFAULT 'CHAT-' || floor(random() * 100000)::text,
  email TEXT NOT NULL,
  status TEXT DEFAULT 'open', -- open, waiting_for_agent, closed
  subject TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

CREATE INDEX idx_support_chats_email ON support_chats(email);
CREATE INDEX idx_support_chats_status ON support_chats(status);
CREATE INDEX idx_support_chats_created ON support_chats(created_at DESC);

ALTER TABLE support_chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create chat" ON support_chats FOR INSERT WITH CHECK (true);
CREATE POLICY "Users view own chats" ON support_chats FOR SELECT USING (true);
CREATE POLICY "Admins manage chats" ON support_chats FOR ALL USING (true);

-- SUPPORT MESSAGES TABLE
CREATE TABLE support_messages (
  id BIGSERIAL PRIMARY KEY,
  chat_id TEXT REFERENCES support_chats(chat_id) ON DELETE CASCADE,
  sender TEXT NOT NULL, -- 'customer' or 'agent'
  sender_email TEXT,
  message TEXT NOT NULL,
  needs_verification BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_support_messages_chat ON support_messages(chat_id);
CREATE INDEX idx_support_messages_created ON support_messages(created_at);

ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can send message" ON support_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Users view messages from their chats" ON support_messages FOR SELECT USING (true);
CREATE POLICY "Admins manage messages" ON support_messages FOR ALL USING (true);

-- VERIFICATION REQUESTS TABLE (for refunds/exchanges)
CREATE TABLE verification_requests (
  id BIGSERIAL PRIMARY KEY,
  chat_id TEXT REFERENCES support_chats(chat_id),
  request_type TEXT NOT NULL, -- 'refund' or 'exchange'
  order_id TEXT,
  reason TEXT,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

CREATE INDEX idx_verification_chat ON verification_requests(chat_id);
CREATE INDEX idx_verification_status ON verification_requests(status);

ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create verification request" ON verification_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins manage verifications" ON verification_requests FOR ALL USING (true);

-- NOTIFICATIONS TABLE
CREATE TABLE notifications (
  id BIGSERIAL PRIMARY KEY,
  user_email TEXT NOT NULL,
  type TEXT NOT NULL, -- 'order_update', 'chat_reply', 'refund_approved', etc.
  title TEXT NOT NULL,
  message TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_email ON notifications(user_email);
CREATE INDEX idx_notifications_unread ON notifications(is_read) WHERE is_read = FALSE;

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own notifications" ON notifications FOR SELECT USING (true);
CREATE POLICY "System creates notifications" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users mark as read" ON notifications FOR UPDATE USING (true);

-- ══════════════════════════════════════════════════════════════════
-- USEFUL QUERIES
-- ══════════════════════════════════════════════════════════════════

-- See all open support chats
-- SELECT * FROM support_chats WHERE status = 'open' ORDER BY created_at DESC;

-- Get messages for a specific chat
-- SELECT * FROM support_messages WHERE chat_id = 'CHAT-12345' ORDER BY created_at;

-- Check pending verification requests
-- SELECT * FROM verification_requests WHERE status = 'pending';

-- See unread notifications for a user
-- SELECT * FROM notifications WHERE user_email = 'user@example.com' AND is_read = FALSE;
