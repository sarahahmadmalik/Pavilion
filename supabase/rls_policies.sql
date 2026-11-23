-- ============================================================================
-- PAVILION — Row Level Security (RLS) Policies for Core Tables
-- Run this in your Supabase SQL Editor so authenticated users can access data.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_admin_or_super()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  );
$$;

-- 1. USERS
DROP POLICY IF EXISTS "Users read authenticated" ON public.users;
CREATE POLICY "Users read authenticated" ON public.users
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users update own profile" ON public.users;
CREATE POLICY "Users update own profile" ON public.users
  FOR UPDATE TO authenticated USING (id = auth.uid() OR public.is_admin_or_super())
  WITH CHECK (id = auth.uid() OR public.is_admin_or_super());

DROP POLICY IF EXISTS "Admins manage users" ON public.users;
CREATE POLICY "Admins manage users" ON public.users
  FOR ALL TO authenticated USING (public.is_admin_or_super())
  WITH CHECK (public.is_admin_or_super());

-- 2. USER PERMISSIONS
DROP POLICY IF EXISTS "Permissions read authenticated" ON public.user_permissions;
CREATE POLICY "Permissions read authenticated" ON public.user_permissions
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin_or_super());

DROP POLICY IF EXISTS "Admins manage permissions" ON public.user_permissions;
CREATE POLICY "Admins manage permissions" ON public.user_permissions
  FOR ALL TO authenticated USING (public.is_admin_or_super())
  WITH CHECK (public.is_admin_or_super());

-- 3. OPERATIONAL TABLES (authenticated read/insert/update; admin delete)
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'guest_list',
    'guest_house_maintenance',
    'guest_house_inventory',
    'office_bill_payments',
    'vehicles_maintenance',
    'office_maintenance'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Auth read %I" ON public.%I', tbl, tbl);
    EXECUTE format('CREATE POLICY "Auth read %I" ON public.%I FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL)', tbl, tbl);

    EXECUTE format('DROP POLICY IF EXISTS "Auth insert %I" ON public.%I', tbl, tbl);
    EXECUTE format('CREATE POLICY "Auth insert %I" ON public.%I FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL)', tbl, tbl);

    EXECUTE format('DROP POLICY IF EXISTS "Auth update %I" ON public.%I', tbl, tbl);
    EXECUTE format('CREATE POLICY "Auth update %I" ON public.%I FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL)', tbl, tbl);

    EXECUTE format('DROP POLICY IF EXISTS "Admin delete %I" ON public.%I', tbl, tbl);
    EXECUTE format('CREATE POLICY "Admin delete %I" ON public.%I FOR DELETE TO authenticated USING (public.is_admin_or_super())', tbl, tbl);
  END LOOP;
END $$;

-- 4. ACTIVITY LOGS
DROP POLICY IF EXISTS "Activity logs read authenticated" ON public.activity_logs;
CREATE POLICY "Activity logs read authenticated" ON public.activity_logs
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Activity logs insert authenticated" ON public.activity_logs;
CREATE POLICY "Activity logs insert authenticated" ON public.activity_logs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- 5. NOTIFICATIONS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Notifications read own" ON public.notifications;
CREATE POLICY "Notifications read own" ON public.notifications
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Notifications insert authenticated" ON public.notifications;
CREATE POLICY "Notifications insert authenticated" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Notifications update own" ON public.notifications;
CREATE POLICY "Notifications update own" ON public.notifications
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Notifications delete own" ON public.notifications;
CREATE POLICY "Notifications delete own" ON public.notifications
  FOR DELETE TO authenticated USING (user_id = auth.uid());
