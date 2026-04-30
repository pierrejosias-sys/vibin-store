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

ALTER TABLE support_messages 
ADD CONSTRAINT fk_support_messages_chat_id 
FOREIGN KEY (chat_id) REFERENCES support_chats(chat_id) ON DELETE CASCADE;

ALTER TABLE ambassador_referrals 
ADD CONSTRAINT fk_ambassador_referrals_code 
FOREIGN KEY (ambassador_code) REFERENCES ambassadors(code);

ALTER TABLE verification_requests 
ADD CONSTRAINT fk_verification_requests_chat_id 
FOREIGN KEY (chat_id) REFERENCES support_chats(chat_id);
