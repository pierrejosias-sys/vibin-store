-- STEP 3 v2: Fix column types before adding FKs
-- Run this in Supabase SQL Editor

-- First, check and fix support_chats.chat_id type
ALTER TABLE support_chats 
ALTER COLUMN chat_id TYPE TEXT USING chat_id::TEXT;

-- Fix support_messages.chat_id type
ALTER TABLE support_messages 
ALTER COLUMN chat_id TYPE TEXT USING chat_id::TEXT;

-- Fix ambassador_referrals.ambassador_code type
ALTER TABLE ambassador_referrals 
ALTER COLUMN ambassador_code TYPE TEXT USING ambassador_code::TEXT;

-- Fix verification_requests.chat_id type
ALTER TABLE verification_requests 
ALTER COLUMN chat_id TYPE TEXT USING chat_id::TEXT;

-- Now drop any existing FK constraints
ALTER TABLE support_messages 
DROP CONSTRAINT IF EXISTS fk_support_messages_chat_id;

ALTER TABLE ambassador_referrals 
DROP CONSTRAINT IF EXISTS fk_ambassador_referrals_code;

ALTER TABLE verification_requests 
DROP CONSTRAINT IF EXISTS fk_verification_requests_chat_id;

-- Add foreign keys with matching TEXT types
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
