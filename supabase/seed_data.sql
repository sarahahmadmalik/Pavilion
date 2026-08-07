-- ============================================================================
-- MTA Ghana Operations Dashboard - Complete Supabase Database Seed File
-- Includes Schema, RLS, 3 Accounts (No Profile Pics), & Full Dashboard Seed Data
-- ============================================================================

-- 1. ENUMS
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'staff');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE maintenance_status AS ENUM ('Open', 'In Progress', 'Resolved');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE inventory_condition AS ENUM ('Good', 'Fair', 'Damaged');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE asset_status AS ENUM ('In Use', 'In Storage', 'Retired');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE log_action AS ENUM ('Created', 'Edited', 'Deleted');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. USERS & PERMISSIONS TABLE
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role user_role NOT NULL DEFAULT 'staff',
    status VARCHAR(20) NOT NULL DEFAULT 'Active',
    avatar VARCHAR(255) DEFAULT NULL,
    last_login TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    module_key VARCHAR(50) NOT NULL,
    can_view BOOLEAN DEFAULT FALSE,
    can_add BOOLEAN DEFAULT FALSE,
    can_edit BOOLEAN DEFAULT FALSE,
    can_delete BOOLEAN DEFAULT FALSE,
    UNIQUE(user_id, module_key)
);

-- 3. MODULE TABLES
CREATE TABLE IF NOT EXISTS public.guest_list (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    country VARCHAR(100) NOT NULL,
    room_allocated VARCHAR(50) NOT NULL,
    purpose_of_stay TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.guest_house_maintenance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reported_on DATE NOT NULL DEFAULT CURRENT_DATE,
    issue TEXT NOT NULL,
    status maintenance_status NOT NULL DEFAULT 'Open',
    updates TEXT,
    location VARCHAR(100) NOT NULL,
    name_of_worker VARCHAR(255),
    cost NUMERIC(12, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.guest_house_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item VARCHAR(255) NOT NULL,
    qty INTEGER NOT NULL DEFAULT 1,
    condition inventory_condition NOT NULL DEFAULT 'Good',
    location VARCHAR(100) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.office_bill_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    company VARCHAR(255) NOT NULL,
    cheque_no VARCHAR(100) NOT NULL,
    payee VARCHAR(255) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.office_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barcode VARCHAR(100) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    status asset_status NOT NULL DEFAULT 'In Use',
    location VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.office_maintenance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reported_on DATE NOT NULL DEFAULT CURRENT_DATE,
    issue TEXT NOT NULL,
    status maintenance_status NOT NULL DEFAULT 'Open',
    updates TEXT,
    location VARCHAR(100) NOT NULL,
    name_of_worker VARCHAR(255),
    cost NUMERIC(12, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES public.users(id),
    user_name VARCHAR(255) NOT NULL,
    user_avatar VARCHAR(255) DEFAULT NULL,
    action log_action NOT NULL,
    module_name VARCHAR(100) NOT NULL,
    record_affected VARCHAR(255) NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Enablement
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_house_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_house_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.office_bill_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.office_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.office_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Permissive RLS Policies for authenticated dashboard sessions
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

DROP POLICY IF EXISTS "Allow authenticated read/write on office_assets" ON public.office_assets;
CREATE POLICY "Allow authenticated read/write on office_assets" ON public.office_assets FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow authenticated read/write on office_maintenance" ON public.office_maintenance;
CREATE POLICY "Allow authenticated read/write on office_maintenance" ON public.office_maintenance FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow authenticated read/write on activity_logs" ON public.activity_logs;
CREATE POLICY "Allow authenticated read/write on activity_logs" ON public.activity_logs FOR ALL USING (true);

-- 4. CLEAR EXISTING SEED DATA
TRUNCATE TABLE public.activity_logs CASCADE;
TRUNCATE TABLE public.user_permissions CASCADE;
TRUNCATE TABLE public.users CASCADE;
TRUNCATE TABLE public.guest_list CASCADE;
TRUNCATE TABLE public.guest_house_maintenance CASCADE;
TRUNCATE TABLE public.guest_house_inventory CASCADE;
TRUNCATE TABLE public.office_bill_payments CASCADE;
TRUNCATE TABLE public.office_assets CASCADE;
TRUNCATE TABLE public.office_maintenance CASCADE;

-- 5. INSERT 3 ACCOUNTS INTO SUPABASE AUTH & PUBLIC USERS (No profile pics: avatar = NULL)
-- Passwords:
-- Super Admin: SuperAdmin123!
-- Admin: Admin123!
-- Staff: Staff123!

CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at
) VALUES 
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'superadmin@mtaghana.org', crypt('SuperAdmin123!', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"name":"Tariq Malik"}', false, NOW(), NOW()),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@mtaghana.org', crypt('Admin123!', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"name":"Usman Khan"}', false, NOW(), NOW()),
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'staff@mtaghana.org', crypt('Staff123!', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"name":"Hamza Ahmed"}', false, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password, raw_user_meta_data = EXCLUDED.raw_user_meta_data;

INSERT INTO public.users (id, name, email, role, status, avatar) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Tariq Malik', 'superadmin@mtaghana.org', 'super_admin', 'Active', NULL),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Usman Khan', 'admin@mtaghana.org', 'admin', 'Active', NULL),
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'Hamza Ahmed', 'staff@mtaghana.org', 'staff', 'Active', NULL)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role, status = EXCLUDED.status;

-- Staff Permissions Matrix
INSERT INTO public.user_permissions (user_id, module_key, can_view, can_add, can_edit, can_delete) VALUES
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'guest_list', true, true, false, false),
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'gh_maintenance', true, true, true, false),
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'gh_inventory', true, true, true, false),
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'office_bills', true, false, false, false),
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'office_assets', true, true, false, false),
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'office_maintenance', true, false, false, false)
ON CONFLICT (user_id, module_key) DO UPDATE SET 
  can_view = EXCLUDED.can_view,
  can_add = EXCLUDED.can_add,
  can_edit = EXCLUDED.can_edit,
  can_delete = EXCLUDED.can_delete;

-- 6. DASHBOARD MODULE SEED DATA

-- Guest List
INSERT INTO public.guest_list (name, check_in, check_out, country, room_allocated, purpose_of_stay) VALUES
('Bilal Chaudhry', '2026-08-01', '2026-08-10', 'Pakistan', 'VIP Suite 101', 'Annual Conference & Inspection Tour'),
('Zeeshan Ali', '2026-08-03', '2026-08-07', 'Pakistan', 'Room 204', 'Technical Media Broadcast Setup'),
('Farhan Akhtar', '2026-08-04', '2026-08-08', 'Pakistan', 'Room 105', 'Regional Executive Audit Meeting'),
('Zubair Hassan', '2026-07-28', '2026-08-05', 'Pakistan', 'Room 202', 'Regional MTA Africa Delegation'),
('Faisal Saeed', '2026-08-02', '2026-08-12', 'Pakistan', 'VIP Suite 102', 'Documentation & Media Production'),
('Ahsan Raza', '2026-08-05', '2026-08-15', 'Pakistan', 'VIP Suite 103', 'Medical Outreach Consultation'),
('Danish Iqbal', '2026-08-06', '2026-08-09', 'Pakistan', 'Room 201', 'Broadcasting Engineering Review');

-- Guest House Maintenance
INSERT INTO public.guest_house_maintenance (reported_on, issue, status, updates, location, name_of_worker, cost) VALUES
('2026-08-02', 'Air Conditioner leaking water in VIP Suite 101', 'In Progress', 'Technician replaced drain line gasket.', 'VIP Suite 101', 'Kamran Shah (HVAC Tech)', 450.00),
('2026-08-01', 'Water heater thermostat fault in Room 204', 'Resolved', 'Replaced 2000W heating element.', 'Room 204', 'Adnan Siddiqui (Plumber)', 320.00),
('2026-08-03', 'Master bathroom door lock latch stuck', 'Open', NULL, 'Room 105', 'Unassigned', 0.00),
('2026-07-29', 'Ceiling fan speed regulator replacement', 'Resolved', 'Replaced with 5-speed heavy-duty regulator.', 'Linen Closet / Reception', 'Waqas Butt', 180.00),
('2026-08-04', 'VIP Lounge Smart TV HDMI port loose connection', 'Open', NULL, 'VIP Main Lounge', 'Unassigned', 0.00);

-- Guest House Inventory
INSERT INTO public.guest_house_inventory (item, qty, condition, location, notes) VALUES
('Egyptian Cotton Bedding Sets', 24, 'Good', 'Linen Store Room', 'Purchased Jan 2026'),
('Orthopedic King Mattresses', 12, 'Good', 'VIP Suites (101-106)', 'High durability institutional grade'),
('Daikin 2.0 HP Inverter AC Units', 18, 'Fair', 'Guest Rooms Block A & B', 'Serviced quarterly'),
('Phillips HD LED Televisions (55 inch)', 8, 'Good', 'VIP Suites & Main Lounge', 'Connected to MTA Satellite'),
('Bath Towels Set (White Extra Large)', 40, 'Fair', 'Laundry Storage Closet', '8 sets flagged for replacement'),
('Electric Kettles (Stainless Steel)', 14, 'Good', 'All Guest Suites', 'Checked during check-in protocol');

-- Office Bill Payments
INSERT INTO public.office_bill_payments (date, company, cheque_no, payee, amount) VALUES
('2026-08-01', 'Electricity Company of Ghana (ECG)', 'CHK-2026-0891', 'ECG Regional Office Accra', 3450.00),
('2026-08-02', 'Ghana Water Company Limited', 'CHK-2026-0892', 'GWCL Metered Service Division', 1280.00),
('2026-07-31', 'MTN Ghana Fibre Broadband', 'CHK-2026-0893', 'MTN Enterprise Business Unit', 2150.00),
('2026-07-25', 'State Insurance Corporation (SIC)', 'CHK-2026-0894', 'SIC Fixed Property Insurance', 4800.00),
('2026-07-20', 'Perkins Generator Diesel Supply (GOIL)', 'CHK-2026-0895', 'GOIL Ghana Bulk Supply', 5600.00);

-- Office Assets
INSERT INTO public.office_assets (barcode, description, status, location) VALUES
('MTA-AST-90214', 'Dell Latitude 5540 i7 16GB RAM Studio Laptop', 'In Use', 'Master Control Room'),
('MTA-AST-90215', 'Sony HXR-NX80 4K Ultra HD Broadcast Camera', 'In Use', 'Studio A - Main Set'),
('MTA-AST-90216', 'HP Color LaserJet Enterprise Printer X57745', 'In Use', 'Administration Office'),
('MTA-AST-90217', 'Cisco Catalyst 9300 48-Port Managed Switch', 'In Use', 'Server Room Rack 01'),
('MTA-AST-90218', 'Apple Mac Studio M2 Max Video Editing Suite', 'In Use', 'Post-Production Room 02'),
('MTA-AST-90219', 'Yamaha TF5 32-Channel Digital Mixing Console', 'In Storage', 'Equipment Reserve Vault'),
('MTA-AST-90220', 'APC Smart-UPS RT 10,000VA 230V Online Battery', 'In Use', 'Main Generator & Power Room');

-- Office Maintenance
INSERT INTO public.office_maintenance (reported_on, issue, status, updates, location, name_of_worker, cost) VALUES
('2026-08-01', 'Perkins 150kVA Standby Generator monthly servicing & oil change', 'In Progress', 'Engine oil drained, new filters installed.', 'Generator House', 'Mantrac Engineers', 1850.00),
('2026-07-30', 'Studio B Acoustic Panel wall mounting & soundproofing repair', 'Resolved', 'Re-anchored 6 soundproof panels.', 'Studio B', 'Rehan Mahmood (Acoustic Spec)', 650.00),
('2026-08-03', 'Server Room Dedicated Precision AC Unit high temperature alarm', 'Open', 'Contractor scheduled for Freon gas pressure check.', 'Server Room', 'Unassigned', 0.00),
('2026-07-28', 'UPS Battery Bank Cell 04 voltage calibration', 'Resolved', 'Calibrated battery management system.', 'Power Room', 'APC Tech', 920.00);

-- Activity Logs
INSERT INTO public.activity_logs (timestamp, user_id, user_name, user_avatar, action, module_name, record_affected, details) VALUES
(NOW() - INTERVAL '15 minutes', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Tariq Malik', NULL, 'Created', 'Guest List', 'Bilal Chaudhry', '{"checkIn": "2026-08-01", "country": "Pakistan"}'),
(NOW() - INTERVAL '45 minutes', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Usman Khan', NULL, 'Edited', 'Guest House Maintenance', 'Air Conditioner leaking water in VIP Suite 101', '{"status": "In Progress"}');
