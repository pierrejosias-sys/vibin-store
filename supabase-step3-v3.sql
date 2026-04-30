-- STEP 3 v3: Fix UUID vs TEXT type mismatch
-- Run this in Supabase SQL Editor

-- First, drop ALL existing FK constraints (ignore errors if they don't exist)
ALTER TABLE support_messages DROP CONSTRAINT IF EXISTS fk_support_messages_chat_id;
ALTER TABLE ambassador_referrals DROP CONSTRAINT IF EXISTS fk_ambassador_referrals_code;
ALTER TABLE verification_requests DROP CONSTRAINT IF EXISTS fk_verification_requests_chat_id;

-- Check and fix support_chats.chat_id type
DO $$
BEGIN
  -- Check if chat_id column exists and its type
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'support_chats' AND column_name = 'chat_id') THEN
    -- Drop default value first
    ALTER TABLE support_chats ALTER COLUMN chat_id DROP DEFAULT;
    -- Change type to TEXT
    ALTER TABLE support_chats ALTER COLUMN chat_id TYPE TEXT USING chat_id::TEXT;
    -- Restore default
    ALTER TABLE support_chats ALTER COLUMN chat_id SET DEFAULT 'CHAT-' || floor(random() * 100000)::text;
  END IF;
END $$;

-- Fix support_messages.chat_id type
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'support_messages' AND column_name = 'chat_id') THEN
    ALTER TABLE support_messages ALTER COLUMN chat_id TYPE TEXT USING chat_id::TEXT;
  END IF;
END $$;

-- Fix ambassador_referrals.ambassador_code type
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ambassador_referrals' AND column_name = 'ambassador_code') THEN
    ALTER TABLE ambassador_referrals ALTER COLUMN ambassador_code TYPE TEXT USING ambassador_code::TEXT;
  END IF;
END $$;

-- Fix verification_requests.chat_id type
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'verification_requests' AND column_name = 'chat_id') THEN
    ALTER TABLE verification_requests ALTER COLUMN chat_id TYPE TEXT USING chat_id::TEXT;
  END IF;
END $$;

-- Ensure ambassadors.code is TEXT (should already be)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ambassadors' AND column_name = 'code') THEN
    ALTER TABLE ambassadors ALTER COLUMN code TYPE TEXT USING code::TEXT;
  END IF;
END $$;

-- Now add foreign keys
ALTER TABLE support_messages 
ADD CONSTRAINT fk_support_messages_chat_id 
FOREIGN KEY (chat_id) REFERENCES support_chats(chat_id) ON DELETE CASCADE;

ALTER TABLE ambassador_referrals 
ADD CONSTRAINT fk_ambassador_referrals_code 
FOREIGN KEY (ambassador_code) REFERENCES ambassadors(code);

ALTER TABLE verification_requests 
ADD CONSTRAINT fk_verification_requests_chat_id 
FOREIGN KEY (chat_id) REFERENCES support_chats(chat_id);

-- Done with Step 3!
SELECT 'Step 3 completed successfully!' as status;
