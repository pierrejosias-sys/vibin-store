CREATE TABLE IF NOT EXISTS ambassador_referrals (
  id BIGSERIAL PRIMARY KEY,
  ambassador_code TEXT,
  visitor_email TEXT,
  ip_address TEXT,
  user_agent TEXT,
  converted BOOLEAN DEFAULT FALSE,
  order_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS support_chats (
  id BIGSERIAL PRIMARY KEY,
  chat_id TEXT UNIQUE NOT NULL DEFAULT 'CHAT-' || floor(random() * 100000)::text,
  email TEXT NOT NULL,
  status TEXT DEFAULT 'open',
  subject TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS verification_requests (
  id BIGSERIAL PRIMARY KEY,
  chat_id TEXT,
  request_type TEXT NOT NULL,
  order_id TEXT,
  reason TEXT,
  status TEXT DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);
