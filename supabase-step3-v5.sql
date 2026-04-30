-- STEP 3 v5: Correct FK references
-- Run this in Supabase SQL Editor

-- Drop existing FK constraints
ALTER TABLE support_messages DROP CONSTRAINT IF EXISTS fk_support_messages_chat_id;
ALTER TABLE ambassador_referrals DROP CONSTRAINT IF EXISTS fk_ambassador_referrals_code;
ALTER TABLE verification_requests DROP CONSTRAINT IF EXISTS fk_verification_requests_chat_id;

-- Fix support_messages FK to reference support_chats.id (UUID)
ALTER TABLE support_messages 
ADD CONSTRAINT fk_support_messages_chat_id 
FOREIGN KEY (chat_id) REFERENCES support_chats(id) ON DELETE CASCADE;

-- Fix ambassador_referrals FK (both are TEXT - correct)
ALTER TABLE ambassador_referrals 
ADD CONSTRAINT fk_ambassador_referrals_code 
FOREIGN KEY (ambassador_code) REFERENCES ambassadors(code);

-- Fix verification_requests FK to reference support_chats.id (UUID)
ALTER TABLE verification_requests 
ADD CONSTRAINT fk_verification_requests_chat_id 
FOREIGN KEY (chat_id) REFERENCES support_chats(id);

SELECT 'Step 3 v5 completed successfully!' as status;
