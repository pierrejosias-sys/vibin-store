-- STEP 3 FINAL: Add FK constraints
-- Run this AFTER fixing ambassadors table

-- Drop existing FK constraints
ALTER TABLE support_messages DROP CONSTRAINT IF EXISTS fk_support_messages_chat_id;
ALTER TABLE ambassador_referrals DROP CONSTRAINT IF EXISTS fk_ambassador_referrals_code;
ALTER TABLE verification_requests DROP CONSTRAINT IF EXISTS fk_verification_requests_chat_id;

-- Add FK: support_messages.chat_id (UUID) -> support_chats.id (UUID)
ALTER TABLE support_messages 
ADD CONSTRAINT fk_support_messages_chat_id 
FOREIGN KEY (chat_id) REFERENCES support_chats(id) ON DELETE CASCADE;

-- Add FK: ambassador_referrals.ambassador_code (TEXT) -> ambassadors.code (TEXT)
ALTER TABLE ambassador_referrals 
ADD CONSTRAINT fk_ambassador_referrals_code 
FOREIGN KEY (ambassador_code) REFERENCES ambassadors(code);

-- Add FK: verification_requests.chat_id (UUID) -> support_chats.id (UUID)
ALTER TABLE verification_requests 
ADD CONSTRAINT fk_verification_requests_chat_id 
FOREIGN KEY (chat_id) REFERENCES support_chats(id);

SELECT 'Step 3 completed successfully!' as status;
