-- ============================================================================
-- MTA Ghana Operations Dashboard — Support Ticket System Schema
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- 1. ENUMS
DO $$ BEGIN
  CREATE TYPE ticket_status AS ENUM ('Open', 'In Progress', 'Closed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE ticket_category AS ENUM (
    'Custom',
    'Guest List',
    'Guest House Maintenance',
    'Guest House Inventory',
    'Office Bill Payments',
    'Vehicles Maintenance',
    'Office Maintenance'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. TICKETS TABLE
CREATE TABLE IF NOT EXISTS public.tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_no BIGSERIAL UNIQUE,
    created_by UUID REFERENCES public.users(id) ON DELETE CASCADE,
    created_by_name VARCHAR(255) NOT NULL,
    created_by_email VARCHAR(255) NOT NULL,
    category ticket_category NOT NULL DEFAULT 'Custom',
    linked_record_id UUID,
    linked_record_label VARCHAR(255),
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status ticket_status NOT NULL DEFAULT 'Open',
    priority VARCHAR(20) NOT NULL DEFAULT 'Normal',
    closed_by UUID REFERENCES public.users(id),
    closed_at TIMESTAMPTZ,
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TICKET REPLIES TABLE
CREATE TABLE IF NOT EXISTS public.ticket_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES public.tickets(id) ON DELETE CASCADE,
    author_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    author_name VARCHAR(255) NOT NULL,
    author_role VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. DROP the old dedicated ticket_notifications table (superseded — see step 5)
DROP TABLE IF EXISTS public.ticket_notifications CASCADE;

-- 5. Reuse the existing public.notifications table (from notifications_schema.sql)
-- for ticket notifications too, so tickets plug into the notification system
-- that's already wired up (fetchNotifications / markNotificationAsRead / realtime).
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS ticket_id UUID REFERENCES public.tickets(id) ON DELETE CASCADE;

-- 6. RLS — permissive, matching this project's existing convention
-- (authorization is enforced app-side via role/permission checks, not RLS).
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_replies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Ticket full access" ON public.tickets;
CREATE POLICY "Ticket full access" ON public.tickets FOR ALL USING (true);

DROP POLICY IF EXISTS "Ticket reply full access" ON public.ticket_replies;
CREATE POLICY "Ticket reply full access" ON public.ticket_replies FOR ALL USING (true);

-- 7. Helpful indexes
CREATE INDEX IF NOT EXISTS idx_tickets_created_by ON public.tickets(created_by);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.tickets(status);
CREATE INDEX IF NOT EXISTS idx_ticket_replies_ticket_id ON public.ticket_replies(ticket_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read);

-- 8. AUTO-CLOSE STALE TICKETS (45 days ≈ 1.5 months of no activity)
-- Reusable function — called by the pg_cron job below AND as a lazy
-- fallback sweep from the client whenever the Tickets page loads
-- (in case pg_cron isn't enabled on this project).
CREATE OR REPLACE FUNCTION public.close_stale_tickets()
RETURNS void AS $$
DECLARE
  stale_ticket RECORD;
BEGIN
  FOR stale_ticket IN
    SELECT id, ticket_no, subject, created_by
    FROM public.tickets
    WHERE status IN ('Open', 'In Progress')
      AND last_activity_at < NOW() - INTERVAL '45 days'
  LOOP
    UPDATE public.tickets
    SET status = 'Closed',
        closed_at = NOW(),
        last_activity_at = NOW()
    WHERE id = stale_ticket.id;

    IF stale_ticket.created_by IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, message, ticket_id)
      VALUES (
        stale_ticket.created_by,
        'Ticket #' || stale_ticket.ticket_no || ' Auto-Closed',
        'Your ticket "' || stale_ticket.subject || '" was automatically closed after 45 days of inactivity.',
        stale_ticket.id
      );
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.close_stale_tickets() TO authenticated;

-- Requires pg_cron: Supabase Dashboard → Database → Extensions → pg_cron
SELECT cron.schedule(
  'auto-close-stale-tickets',
  '0 3 * * *',
  $$ SELECT public.close_stale_tickets(); $$
);
