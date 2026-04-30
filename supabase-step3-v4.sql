-- STEP 3 v4: Clean fix for FK issues
-- Run this AFTER the diagnostic query

-- First, let's see what we're working with
DO $$
DECLARE
  col_type TEXT;
BEGIN
  -- Fix support_chats table
  SELECT data_type INTO col_type 
  FROM information_schema.columns 
  WHERE table_name = 'support_chats' AND column_name = 'chat_id';
  
  IF col_type IS NOT NULL AND col_type != 'text' THEN
    ALTER TABLE support_chats ALTER COLUMN chat_id TYPE TEXT USING chat_id::TEXT;
  END IF;

  -- Fix support_messages table
  SELECT data_type INTO col_type 
  FROM information_schema.columns 
  WHERE table_name = 'support_messages' AND column_name = 'chat_id';
  
  IF col_type IS NOT NULL AND col_type != 'text' THEN
    ALTER TABLE support_messages ALTER COLUMN chat_id TYPE TEXT USING chat_id::TEXT;
  END IF;

  -- Fix ambassadors table
  SELECT data_type INTO col_type 
  FROM information_schema.columns 
  WHERE table_name = 'ambassadors' AND column_name = 'code';
  
  IF col_type IS NOT NULL AND col_type != 'text' THEN
    ALTER TABLE ambassadors ALTER COLUMN code TYPE TEXT USING code::TEXT;
  END IF;

  -- Fix ambassador_referrals table
  SELECT data_type INTO col_type 
  FROM information_schema.columns 
  WHERE table_name = 'ambassador_referrals' AND column_name = 'ambassador_code';
  
  IF col_type IS NOT NULL AND col_type != 'text' THEN
    ALTER TABLE ambassador_referrals ALTER COLUMN ambassador_code TYPE TEXT USING ambassador_code::TEXT;
  END IF;

  -- Fix verification_requests table
  SELECT data_type INTO col_type 
  FROM information_schema.columns 
  WHERE table_name = 'verification_requests' AND column_name = 'chat_id';
  
  IF col_type IS NOT NULL AND col_type != 'text' THEN
    ALTER TABLE verification_requests ALTER COLUMN chat_id TYPE TEXT USING chat_id::TEXT;
  END IF;
END $$;

-- Drop all existing FK constraints
ALTER TABLE support_messages DROP CONSTRAINT IF EXISTS fk_support_messages_chat_id;
ALTER TABLE ambassador_referrals DROP CONSTRAINT IF EXISTS fk_ambassador_referrals_code;
ALTER TABLE verification_requests DROP CONSTRAINT IF EXISTS fk_verification_requests_chat_id;

-- Add correct FK constraints
ALTER TABLE support_messages 
ADD CONSTRAINT fk_support_messages_chat_id 
FOREIGN KEY (chat_id) REFERENCES support_chats(chat_id) ON DELETE CASCADE;

ALTER TABLE ambassador_referrals 
ADD CONSTRAINT fk_ambassador_referrals_code 
FOREIGN KEY (ambassador_code) REFERENCES ambassadors(code);

ALTER TABLE verification_requests 
ADD CONSTRAINT fk_verification_requests_chat_id 
FOREIGN KEY (chat_id) REFERENCES support_chats(chat_id);

SELECT 'Step 3 v4 completed!' as status;
