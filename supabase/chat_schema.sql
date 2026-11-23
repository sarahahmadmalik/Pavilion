-- ============================================================================
-- PAVILION — Secure Team Chat Schema (Admin & Staff only; Super Admin excluded)
-- Run this in your Supabase SQL Editor
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel TEXT NOT NULL DEFAULT 'dm' CHECK (channel IN ('workspace', 'dm')),
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  body TEXT,
  attachment_name TEXT,
  attachment_path TEXT,
  attachment_type TEXT,
  attachment_size INTEGER,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chat_has_content CHECK (
    (body IS NOT NULL AND length(trim(body)) > 0) OR attachment_path IS NOT NULL
  )
);

ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS channel TEXT NOT NULL DEFAULT 'dm';
ALTER TABLE public.chat_messages ALTER COLUMN recipient_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_chat_messages_pair ON public.chat_messages(sender_id, recipient_id, created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_recipient_unread ON public.chat_messages(recipient_id, read_at);

-- Helper: only admin and staff can access chat (super_admin is excluded)
CREATE OR REPLACE FUNCTION public.is_chat_eligible()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('admin', 'staff')
  );
$$;

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Chat read own conversations" ON public.chat_messages;
CREATE POLICY "Chat read own conversations" ON public.chat_messages
  FOR SELECT TO authenticated
  USING (
    public.is_chat_eligible()
    AND (
      channel = 'workspace'
      OR sender_id = auth.uid()
      OR recipient_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Chat send to eligible peer" ON public.chat_messages;
CREATE POLICY "Chat send to eligible peer" ON public.chat_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_chat_eligible()
    AND sender_id = auth.uid()
    AND (
      (channel = 'workspace' AND recipient_id IS NULL)
      OR (
        channel = 'dm'
        AND recipient_id IS NOT NULL
        AND recipient_id <> auth.uid()
        AND EXISTS (
          SELECT 1 FROM public.users
          WHERE id = recipient_id AND role IN ('admin', 'staff')
        )
      )
    )
  );

DROP POLICY IF EXISTS "Chat recipient mark delivered or read" ON public.chat_messages;
CREATE POLICY "Chat recipient mark delivered or read" ON public.chat_messages
  FOR UPDATE TO authenticated
  USING (public.is_chat_eligible() AND recipient_id = auth.uid())
  WITH CHECK (public.is_chat_eligible() AND recipient_id = auth.uid());

-- Enable Realtime on chat_messages
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Private Storage Bucket for Chat Attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Chat attachment upload" ON storage.objects;
CREATE POLICY "Chat attachment upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'chat-attachments'
    AND public.is_chat_eligible()
  );

DROP POLICY IF EXISTS "Chat attachment read" ON storage.objects;
CREATE POLICY "Chat attachment read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'chat-attachments'
    AND public.is_chat_eligible()
  );
