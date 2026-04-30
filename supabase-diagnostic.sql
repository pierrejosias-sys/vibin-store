-- DIAGNOSTIC: Check actual column types
-- Run this FIRST to see whats in your database

SELECT 
  table_name, 
  column_name, 
  data_type,
  udt_name
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('support_chats', 'support_messages', 'ambassadors', 'ambassador_referrals', 'verification_requests')
AND column_name IN ('chat_id', 'code', 'ambassador_code', 'id')
ORDER BY table_name, column_name;
