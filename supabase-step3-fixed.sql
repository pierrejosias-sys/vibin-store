-- STEP 3 FIXED: Add columns and FK constraints
-- Run this in Supabase SQL Editor

-- First, ensure support_chats has chat_id column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'support_chats' AND column_name = 'chat_id'
  ) THEN
    ALTER TABLE support_chats ADD COLUMN chat_id TEXT UNIQUE NOT NULL DEFAULT 'CHAT-' || floor(random() * 100000)::text;
  END IF;
END $$;

-- Ensure support_messages has chat_id column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'support_messages' AND column_name = 'chat_id'
  ) THEN
    ALTER TABLE support_messages ADD COLUMN chat_id TEXT;
  END IF;
END $$;

-- Now create support_messages table if not exists
CREATE TABLE IF NOT EXISTS support_messages (
  id BIGSERIAL PRIMARY KEY,
  chat_id TEXT,
  sender TEXT NOT NULL,
  sender_email TEXT,
  message TEXT NOT NULL,
  needs_verification BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key constraints (drop first if exists)
ALTER TABLE support_messages 
DROP CONSTRAINT IF EXISTS fk_support_messages_chat_id;

ALTER TABLE support_messages 
ADD CONSTRAINT fk_support_messages_chat_id 
FOREIGN KEY (chat_id) REFERENCES support_chats(chat_id) ON DELETE CASCADE;

-- For ambassador_referrals
ALTER TABLE ambassador_referrals 
DROP CONSTRAINT IF EXISTS fk_ambassador_referrals_code;

ALTER TABLE ambassador_referrals 
ADD CONSTRAINT fk_ambassador_referrals_code 
FOREIGN KEY (ambassador_code) REFERENCES ambassadors(code);

-- For verification_requests
ALTER TABLE verification_requests 
DROP CONSTRAINT IF EXISTS fk_verification_requests_chat_id;

ALTER TABLE verification_requests 
ADD CONSTRAINT fk_verification_requests_chat_id 
FOREIGN KEY (chat_id) REFERENCES support_chats(chat_id);

-- Done with Step 3!
