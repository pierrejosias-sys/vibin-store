-- Support intake: /contact + floating Help chat write through /api/support (service role).
-- Customers read their own thread only via the server route (email + token); no anon table access.

ALTER TABLE public.support_chats
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS topic TEXT,
  ADD COLUMN IF NOT EXISTS order_number TEXT,
  ADD COLUMN IF NOT EXISTS source TEXT,
  ADD COLUMN IF NOT EXISTS access_token_hash TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMPTZ NOT NULL DEFAULT now();

UPDATE public.support_chats SET status = 'open' WHERE status IS NULL OR status NOT IN ('open', 'answered', 'closed');
ALTER TABLE public.support_chats ALTER COLUMN status SET DEFAULT 'open';
ALTER TABLE public.support_chats ALTER COLUMN status SET NOT NULL;
ALTER TABLE public.support_chats DROP CONSTRAINT IF EXISTS support_chats_status_check;
ALTER TABLE public.support_chats ADD CONSTRAINT support_chats_status_check CHECK (status IN ('open', 'answered', 'closed'));
ALTER TABLE public.support_chats DROP CONSTRAINT IF EXISTS support_chats_topic_check;
ALTER TABLE public.support_chats ADD CONSTRAINT support_chats_topic_check
  CHECK (topic IS NULL OR topic IN ('order', 'sizing', 'shipping', 'returns', 'pre-order', 'other'));

ALTER TABLE public.support_messages DROP CONSTRAINT IF EXISTS support_messages_sender_check;
ALTER TABLE public.support_messages ADD CONSTRAINT support_messages_sender_check CHECK (sender IN ('customer', 'agent', 'system'));

CREATE INDEX IF NOT EXISTS idx_support_chats_status_last ON public.support_chats (status, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_messages_sender_email_created ON public.support_messages (lower(sender_email), created_at DESC);

-- All public writes now go through the server route; drop the always-true INSERT policies.
DROP POLICY IF EXISTS "Anyone can create chat" ON public.support_chats;
DROP POLICY IF EXISTS "Anyone can send message" ON public.support_messages;

-- Anon gets no table privileges at all (RLS stays: owner-only reads, admins manage).
REVOKE ALL ON public.support_chats FROM anon;
REVOKE ALL ON public.support_messages FROM anon;

-- Read-only queue for support agents (service role only).
CREATE OR REPLACE VIEW public.support_queue_open
WITH (security_invoker = true) AS
SELECT
  c.id,
  c.chat_id AS ticket,
  c.email,
  c.name,
  c.topic,
  c.order_number,
  c.status,
  c.source,
  c.created_at,
  c.last_message_at,
  (SELECT count(*) FROM public.support_messages m WHERE m.chat_id = c.id) AS message_count,
  (SELECT m.message FROM public.support_messages m WHERE m.chat_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS last_message,
  (SELECT m.sender FROM public.support_messages m WHERE m.chat_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS last_sender
FROM public.support_chats c
WHERE c.status = 'open'
ORDER BY c.last_message_at ASC;

REVOKE ALL ON public.support_queue_open FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.support_queue_open TO service_role;
COMMENT ON VIEW public.support_queue_open IS 'Open support tickets, oldest first. Read-only; service role only.';
