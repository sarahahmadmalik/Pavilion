-- 1. DELETE BROKEN USERS
DELETE FROM auth.users;

-- 2. TRUNCATE PUBLIC TABLES
TRUNCATE TABLE public.activity_logs CASCADE;
TRUNCATE TABLE public.user_permissions CASCADE;
TRUNCATE TABLE public.users CASCADE;
TRUNCATE TABLE public.guest_list CASCADE;
TRUNCATE TABLE public.guest_house_maintenance CASCADE;
TRUNCATE TABLE public.guest_house_inventory CASCADE;
TRUNCATE TABLE public.office_bill_payments CASCADE;
TRUNCATE TABLE public.vehicles_maintenance CASCADE;
TRUNCATE TABLE public.office_maintenance CASCADE;

-- 3. FIX POLICIES
DROP POLICY IF EXISTS "Allow authenticated read/write on users" ON public.users;
CREATE POLICY "Allow authenticated read/write on users" ON public.users FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow authenticated read/write on guest_list" ON public.guest_list;
CREATE POLICY "Allow authenticated read/write on guest_list" ON public.guest_list FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow authenticated read/write on guest_house_maintenance" ON public.guest_house_maintenance;
CREATE POLICY "Allow authenticated read/write on guest_house_maintenance" ON public.guest_house_maintenance FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow authenticated read/write on guest_house_inventory" ON public.guest_house_inventory;
CREATE POLICY "Allow authenticated read/write on guest_house_inventory" ON public.guest_house_inventory FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow authenticated read/write on office_bill_payments" ON public.office_bill_payments;
CREATE POLICY "Allow authenticated read/write on office_bill_payments" ON public.office_bill_payments FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow authenticated read/write on vehicles_maintenance" ON public.vehicles_maintenance;
CREATE POLICY "Allow authenticated read/write on vehicles_maintenance" ON public.vehicles_maintenance FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow authenticated read/write on office_maintenance" ON public.office_maintenance;
CREATE POLICY "Allow authenticated read/write on office_maintenance" ON public.office_maintenance FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow authenticated read/write on activity_logs" ON public.activity_logs;
CREATE POLICY "Allow authenticated read/write on activity_logs" ON public.activity_logs FOR ALL USING (true);
