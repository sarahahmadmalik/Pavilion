-- 1. CREATE NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 3. CREATE POLICIES
DROP POLICY IF EXISTS "Users can read own notifications" ON public.notifications;
CREATE POLICY "Users can read own notifications" ON public.notifications
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
CREATE POLICY "Users can delete own notifications" ON public.notifications
    FOR DELETE USING (user_id = auth.uid());

-- Allow all authenticated users to insert (so a staff member's action can notify an admin)
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON public.notifications;
CREATE POLICY "Authenticated users can insert notifications" ON public.notifications
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 4. CREATE TRIGGER FUNCTION FOR ACTIVITY LOGS
CREATE OR REPLACE FUNCTION notify_admins_on_activity()
RETURNS TRIGGER AS $$
DECLARE
    admin_record RECORD;
BEGIN
    -- We want to notify all super_admins and admins of this activity
    FOR admin_record IN SELECT id FROM public.users WHERE role IN ('super_admin', 'admin') LOOP
        -- Don't notify the person who just did the action
        IF admin_record.id != NEW.user_id THEN
            INSERT INTO public.notifications (user_id, title, message)
            VALUES (
                admin_record.id, 
                'New Activity: ' || NEW.module_name, 
                NEW.user_name || ' ' || NEW.action || ' ' || NEW.record_affected
            );
        END IF;
    END LOOP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. ATTACH TRIGGER TO ACTIVITY LOGS
DROP TRIGGER IF EXISTS trigger_notify_admins ON public.activity_logs;
CREATE TRIGGER trigger_notify_admins
    AFTER INSERT ON public.activity_logs
    FOR EACH ROW
    EXECUTE FUNCTION notify_admins_on_activity();
