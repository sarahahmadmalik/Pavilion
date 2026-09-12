-- ============================================================================
-- MTA Ghana Operations Dashboard — Ticket Attachments
-- Run this in your Supabase SQL Editor (after tickets_schema.sql)
-- ============================================================================

-- 1. ATTACHMENTS TABLE — one row per uploaded file, on a ticket or a reply
CREATE TABLE IF NOT EXISTS public.ticket_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES public.tickets(id) ON DELETE CASCADE,
    reply_id UUID REFERENCES public.ticket_replies(id) ON DELETE CASCADE,
    uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    uploaded_by_name VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_type VARCHAR(100),
    file_size BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ticket_attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Ticket attachment full access" ON public.ticket_attachments;
CREATE POLICY "Ticket attachment full access" ON public.ticket_attachments FOR ALL USING (true);

CREATE INDEX IF NOT EXISTS idx_ticket_attachments_ticket_id ON public.ticket_attachments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_attachments_reply_id ON public.ticket_attachments(reply_id);

-- 2. STORAGE BUCKET — private. Anyone not logged into the app at all must
-- not be able to pull a file just by having the URL, so the bucket is
-- non-public and the client fetches short-lived signed URLs instead of
-- permanent public links (see getAttachmentSignedUrl in supabaseService.js).
INSERT INTO storage.buckets (id, name, public)
VALUES ('ticket-attachments', 'ticket-attachments', false)
ON CONFLICT (id) DO UPDATE SET public = false;

DROP POLICY IF EXISTS "Authenticated can upload ticket attachments" ON storage.objects;
CREATE POLICY "Authenticated can upload ticket attachments" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'ticket-attachments' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Anyone can view ticket attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can view ticket attachments" ON storage.objects;
CREATE POLICY "Authenticated can view ticket attachments" ON storage.objects
  FOR SELECT USING (bucket_id = 'ticket-attachments' AND auth.role() = 'authenticated');
