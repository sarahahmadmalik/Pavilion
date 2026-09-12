-- ============================================================================
-- MTA Ghana Operations Dashboard - Complete Supabase Database Seed File
-- Includes Schema, RLS, 3 Accounts & Full Dashboard Seed Data
-- Updated: Removed office_assets. Added vehicles_maintenance.
--          Added serial_number, cost to guest_house_inventory.
--          Added notes to office_bill_payments.
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

-- Updated: serial_number and cost columns added
CREATE TABLE IF NOT EXISTS public.guest_house_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item VARCHAR(255) NOT NULL,
    qty INTEGER NOT NULL DEFAULT 1,
    condition inventory_condition NOT NULL DEFAULT 'Good',
    location VARCHAR(100) NOT NULL,
    serial_number VARCHAR(100),
    cost NUMERIC(12, 2) DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Updated: notes column added
CREATE TABLE IF NOT EXISTS public.office_bill_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    company VARCHAR(255) NOT NULL,
    cheque_no VARCHAR(100) NOT NULL,
    payee VARCHAR(255) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- NEW: Vehicles Maintenance table (replaces office_assets)
CREATE TABLE IF NOT EXISTS public.vehicles_maintenance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reported_on DATE NOT NULL DEFAULT CURRENT_DATE,
    vehicle_name VARCHAR(255) NOT NULL,
    issue TEXT NOT NULL,
    status maintenance_status NOT NULL DEFAULT 'Open',
    updates TEXT,
    name_of_worker VARCHAR(255),
    cost NUMERIC(12, 2) DEFAULT 0.00,
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
ALTER TABLE public.vehicles_maintenance ENABLE ROW LEVEL SECURITY;
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

DROP POLICY IF EXISTS "Allow authenticated read/write on vehicles_maintenance" ON public.vehicles_maintenance;
CREATE POLICY "Allow authenticated read/write on vehicles_maintenance" ON public.vehicles_maintenance FOR ALL USING (true);

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
TRUNCATE TABLE public.vehicles_maintenance CASCADE;
TRUNCATE TABLE public.office_maintenance CASCADE;

-- 5. INSERT 3 ACCOUNTS INTO SUPABASE AUTH & PUBLIC USERS (No profile pics: avatar = NULL)
-- Passwords:
-- Super Admin: MTA#Ghana2026!SuperSec
-- Admin: MTA#Ghana2026!AdminSec
-- Staff: MTA#Ghana2026!StaffSec

CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at
) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'superadmin@mtaghana.org', crypt('MTA#Ghana2026!SuperSec', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"name":"Sara Ahmad Malik"}', false, NOW(), NOW()),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@mtaghana.org', crypt('MTA#Ghana2026!AdminSec', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"name":"Usman Khan"}', false, NOW(), NOW()),
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'staff@mtaghana.org', crypt('MTA#Ghana2026!StaffSec', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"name":"Hamza Ahmed"}', false, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET encrypted_password = EXCLUDED.encrypted_password, raw_user_meta_data = EXCLUDED.raw_user_meta_data;

INSERT INTO public.users (id, name, email, role, status, avatar) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Sara Ahmad Malik', 'superadmin@mtaghana.org', 'super_admin', 'Active', NULL),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Usman Khan', 'admin@mtaghana.org', 'admin', 'Active', NULL),
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'Hamza Ahmed', 'staff@mtaghana.org', 'staff', 'Active', NULL)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role, status = EXCLUDED.status;

-- Staff Permissions Matrix (office_assets removed, vehicles_maintenance added)
INSERT INTO public.user_permissions (user_id, module_key, can_view, can_add, can_edit, can_delete) VALUES
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'guest_list',           true,  true,  false, false),
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'gh_maintenance',       true,  true,  true,  false),
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'gh_inventory',         true,  true,  true,  false),
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'office_bills',         true,  false, false, false),
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'vehicles_maintenance', true,  true,  false, false),
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'office_maintenance',   true,  false, false, false)
ON CONFLICT (user_id, module_key) DO UPDATE SET
  can_view   = EXCLUDED.can_view,
  can_add    = EXCLUDED.can_add,
  can_edit   = EXCLUDED.can_edit,
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
('Danish Iqbal', '2026-08-06', '2026-08-09', 'Pakistan', 'Room 201', 'Broadcasting Engineering Review'),
('Tariq Mehmood', '2026-07-20', '2026-07-30', 'Pakistan', 'Room 103', 'IT Infrastructure Upgrade'),
('Rashid Minhas', '2026-07-22', '2026-08-02', 'Pakistan', 'Room 108', 'Satellite Uplink Maintenance'),
('Shahid Afridi', '2026-07-25', '2026-08-05', 'Pakistan', 'VIP Suite 104', 'Youth & Cultural Program Delegation'),
('Imran Nazir', '2026-07-27', '2026-08-06', 'Pakistan', 'Room 206', 'Audio Engineering Workshop'),
('Kamran Akmal', '2026-08-01', '2026-08-11', 'Pakistan', 'Room 208', 'Security Audit & Safety Assessment'),
('Shoaib Malik', '2026-08-03', '2026-08-14', 'Pakistan', 'VIP Suite 105', 'Humanitarian Relief Planning'),
('Younis Khan', '2026-08-05', '2026-08-16', 'Pakistan', 'VIP Suite 106', 'Regional Administrative Summit'),
('Saeed Anwar', '2026-08-07', '2026-08-18', 'Pakistan', 'Room 102', 'Educational Curriculum Development'),
('Inzamam ul Haq', '2026-08-08', '2026-08-20', 'Pakistan', 'VIP Suite 107', 'Interfaith Harmony Conference'),
('Waqar Younis', '2026-08-09', '2026-08-21', 'Pakistan', 'Room 107', 'Transmission Tower Inspection'),
('Wasim Akram', '2026-08-10', '2026-08-22', 'Pakistan', 'VIP Suite 108', 'Press & Media Relations'),
('Abdul Razzaq', '2026-08-11', '2026-08-24', 'Pakistan', 'Room 209', 'Solar Power Installation Oversight'),
('Azhar Mahmood', '2026-08-12', '2026-08-25', 'Pakistan', 'Room 210', 'Financial Audit & Accounts Review');
('Danish Iqbal', '2026-08-06', '2026-08-09', 'Pakistan', 'Room 201', 'Broadcasting Engineering Review'),
('Tariq Mehmood', '2026-07-20', '2026-07-30', 'Pakistan', 'Room 103', 'IT Infrastructure Upgrade'),
('Rashid Minhas', '2026-07-22', '2026-08-02', 'Pakistan', 'Room 108', 'Satellite Uplink Maintenance'),
('Shahid Afridi', '2026-07-25', '2026-08-05', 'Pakistan', 'VIP Suite 104', 'Youth & Cultural Program Delegation'),
('Imran Nazir', '2026-07-27', '2026-08-06', 'Pakistan', 'Room 206', 'Audio Engineering Workshop'),
('Kamran Akmal', '2026-08-01', '2026-08-11', 'Pakistan', 'Room 208', 'Security Audit & Safety Assessment'),
('Shoaib Malik', '2026-08-03', '2026-08-14', 'Pakistan', 'VIP Suite 105', 'Humanitarian Relief Planning'),
('Younis Khan', '2026-08-05', '2026-08-16', 'Pakistan', 'VIP Suite 106', 'Regional Administrative Summit'),
('Saeed Anwar', '2026-08-07', '2026-08-18', 'Pakistan', 'Room 102', 'Educational Curriculum Development'),
('Inzamam ul Haq', '2026-08-08', '2026-08-20', 'Pakistan', 'VIP Suite 107', 'Interfaith Harmony Conference'),
('Waqar Younis', '2026-08-09', '2026-08-21', 'Pakistan', 'Room 107', 'Transmission Tower Inspection'),
('Wasim Akram', '2026-08-10', '2026-08-22', 'Pakistan', 'VIP Suite 108', 'Press & Media Relations'),
('Abdul Razzaq', '2026-08-11', '2026-08-24', 'Pakistan', 'Room 209', 'Solar Power Installation Oversight'),
('Azhar Mahmood', '2026-08-12', '2026-08-25', 'Pakistan', 'Room 210', 'Financial Audit & Accounts Review');

-- Guest House Maintenance
INSERT INTO public.guest_house_maintenance (reported_on, issue, status, updates, location, name_of_worker, cost) VALUES
('2026-08-02', 'Air Conditioner leaking water in VIP Suite 101', 'In Progress', 'Technician replaced drain line gasket.', 'VIP Suite 101', 'Kamran Shah (HVAC Tech)', 450.00),
('2026-08-01', 'Water heater thermostat fault in Room 204', 'Resolved', 'Replaced 2000W heating element.', 'Room 204', 'Adnan Siddiqui (Plumber)', 320.00),
('2026-08-03', 'Master bathroom door lock latch stuck', 'Open', NULL, 'Room 105', 'Unassigned', 0.00),
('2026-07-29', 'Ceiling fan speed regulator replacement', 'Resolved', 'Replaced with 5-speed heavy-duty regulator.', 'Linen Closet / Reception', 'Waqas Butt', 180.00),
('2026-08-04', 'VIP Lounge Smart TV HDMI port loose connection', 'Open', NULL, 'VIP Main Lounge', 'Unassigned', 0.00),
('2026-08-05', 'Air condition leakage', 'In Progress', 'Draining condensate tray and re-sealing pipe', 'VIP Suite 103', 'Kamran Shah', 250.00),
('2026-07-20', 'Balcony sliding door glass sealing gap', 'Resolved', 'Applied weather-resistant silicone seal', 'Room 202', 'Tariq Aluminum Works', 150.00),
('2026-07-22', 'Shower head low pressure / mineral blockage', 'Resolved', 'Descaled and cleared nozzle jets', 'Room 103', 'Adnan Siddiqui', 90.00),
('2026-07-25', 'Bedside reading lamp socket wiring trip', 'Resolved', 'Rewired lamp switch and replaced MCB fuse', 'VIP Suite 104', 'Nabeel Electricals', 120.00),
('2026-07-27', 'Guest house dining table chair leg wobble', 'Resolved', 'Tightened wood joints and epoxy re-fill', 'Dining Hall', 'Farooq Carpentry', 80.00),
('2026-07-28', 'Refrigerant gas recharge for Kitchen Fridge', 'Resolved', 'Recharged R134a refrigerant', 'Kitchen', 'Kamran Shah', 350.00),
('2026-07-30', 'Exhaust fan noise in Room 206 restroom', 'Resolved', 'Oiled bearings and aligned fan blades', 'Room 206', 'Waqas Butt', 100.00),
('2026-08-06', 'Corridor emergency lighting battery backup fail', 'Open', 'Replacement 12V 7Ah lead acid batteries ordered', 'Block A Hallway', 'Unassigned', 0.00),
('2026-08-07', 'Curtain rail bracket dislodged', 'Open', NULL, 'Room 208', 'Unassigned', 0.00),
('2026-08-08', 'Water pump pressure switch auto-start fault', 'In Progress', 'Inspecting pressure tank diaphragm', 'Pumphouse Yard', 'Adnan Siddiqui', 500.00),
('2026-08-09', 'Keycard door sensor battery low indicator', 'Resolved', 'Replaced 4x AA Lithium batteries', 'VIP Suite 105', 'IT Lock Team', 40.00),
('2026-08-10', 'Window flyscreen netting tear', 'Open', NULL, 'Room 209', 'Unassigned', 0.00),
('2026-08-10', 'Intercom telephone line static noise', 'In Progress', 'Checking RJ11 cable connection', 'Reception Desk', 'IT Comms Team', 60.00);

-- Guest House Inventory (now includes serial_number and cost)
INSERT INTO public.guest_house_inventory (item, qty, condition, location, serial_number, cost, notes) VALUES
('Egyptian Cotton Bedding Sets', 24, 'Good', 'Linen Store Room', NULL, 1800.00, 'Purchased Jan 2026'),
('Orthopedic King Mattresses', 12, 'Good', 'VIP Suites (101-106)', NULL, 15000.00, 'High durability institutional grade'),
('Daikin 2.0 HP Inverter AC Units', 18, 'Fair', 'Guest Rooms Block A & B', NULL, 54000.00, 'Serviced quarterly'),
('Phillips HD LED Televisions (55 inch)', 8, 'Good', 'VIP Suites & Main Lounge', 'SN-TV55-PH-001', 12000.00, 'Connected to MTA Satellite'),
('Bath Towels Set (White Extra Large)', 40, 'Fair', 'Laundry Storage Closet', NULL, 2400.00, '8 sets flagged for replacement'),
('Electric Kettles (Stainless Steel)', 14, 'Good', 'All Guest Suites', NULL, 1960.00, 'Checked during check-in protocol'),
('Mini Refrigerators (90L Silent)', 12, 'Good', 'VIP Suites', 'SN-RF90-MN-001', 7800.00, 'Energy Star certified'),
('Steam Irons & Ironing Boards', 10, 'Good', 'Laundry Room / On Demand', NULL, 3500.00, 'Heavy duty Tefal irons'),
('Hair Dryers (Ionic 2000W)', 12, 'Good', 'VIP Bathrooms', NULL, 1800.00, 'Wall mounted'),
('Electronic Room Safes', 10, 'Good', 'VIP Suites', 'SN-SF-SEC-001', 5000.00, 'Digital keypad lock'),
('Microwave Ovens (Digital 25L)', 4, 'Good', 'Dining Hall & Staff Pantry', 'SN-MW25-SS-001', 2400.00, 'Samsung Smart Inverter'),
('Teak Dining Chairs with Cushion', 32, 'Good', 'Dining Hall', NULL, 9600.00, 'Polished hardwood finish'),
('Executive Mahogany Study Desks', 14, 'Good', 'Guest Rooms', NULL, 21000.00, 'Built-in cable grommets'),
('Blackout Velvet Window Curtains', 28, 'Good', 'Guest Room Windows', NULL, 8400.00, 'Fire retardant fabric'),
('Porcelain Dinnerware Set (64-piece)', 4, 'Good', 'Kitchen Store', NULL, 3200.00, 'Royal Doulton pattern'),
('Stainless Steel Cutlery Set (120-piece)', 3, 'Good', 'Kitchen Store', NULL, 1800.00, 'High-grade 18/10 steel'),
('Commercial Coffee Espresso Machine', 1, 'Good', 'Reception Lounge Bar', 'SN-CM-DL-PRO1', 4500.00, 'DeLonghi Dual Pump'),
('First Aid Medical Kits (Wall Mounted)', 6, 'Good', 'Reception, Kitchen, Corridor', NULL, 1800.00, 'Fully stocked emergency kit'),
('Fire Extinguishers (CO2 5kg)', 10, 'Good', 'Hallways & Kitchen', NULL, 2500.00, 'Inspected July 2026'),
('Luggage Racks (Folding Metallic)', 16, 'Good', 'All Bedrooms', NULL, 1600.00, 'Heavy duty steel frame');

-- Office Bill Payments (now includes notes)
INSERT INTO public.office_bill_payments (date, company, cheque_no, payee, amount, notes) VALUES
('2026-08-01', 'Electricity Company of Ghana (ECG)', 'CHK-2026-0891', 'ECG Regional Office Accra', 3450.00, 'Monthly electricity bill – main building & guest house'),
('2026-08-02', 'Ghana Water Company Limited', 'CHK-2026-0892', 'GWCL Metered Service Division', 1280.00, 'Monthly water utility'),
('2026-07-31', 'MTN Ghana Fibre Broadband', 'CHK-2026-0893', 'MTN Enterprise Business Unit', 2150.00, 'Monthly internet & SIP trunk'),
('2026-07-25', 'State Insurance Corporation (SIC)', 'CHK-2026-0894', 'SIC Fixed Property Insurance', 4800.00, 'Annual property insurance premium'),
('2026-07-20', 'Perkins Generator Diesel Supply (GOIL)', 'CHK-2026-0895', 'GOIL Ghana Bulk Supply', 5600.00, 'Diesel refill for 150kVA standby generator'),
('2026-07-15', 'Vodafone Ghana Landline & SIP Trunk', 'CHK-2026-0896', 'Vodafone Enterprise Comms', 980.00, NULL),
('2026-07-10', 'Accra Metropolitan Assembly (AMA Property Tax)', 'CHK-2026-0897', 'AMA Revenue Collector', 3200.00, 'Q2 2026 property rates'),
('2026-07-05', 'CleanWave Environmental Waste Management', 'CHK-2026-0898', 'CleanWave Ghana Ltd', 650.00, 'Monthly waste collection contract'),
('2026-07-01', 'TotalEnergies Fleet Fuel Cards', 'CHK-2026-0899', 'TotalEnergies Ghana HQ', 4100.00, 'Fleet fuel – monthly top-up'),
('2026-06-28', 'Pest Control Services Ghana', 'CHK-2026-0900', 'Fumigation & Pest Specialist', 750.00, 'Quarterly fumigation & termite treatment'),
('2026-06-25', 'Elevator Maintenance Contract (Otis Ghana)', 'CHK-2026-0901', 'Otis Elevator Company Services', 2400.00, 'Bi-annual preventive maintenance'),
('2026-06-20', 'Security Guard Services (G4S Ghana)', 'CHK-2026-0902', 'G4S Security Solutions', 6800.00, 'Monthly guards contract – 8 posts'),
('2026-06-15', 'Office Stationary & Paper Supplies (Papyrus Ltd)', 'CHK-2026-0903', 'Papyrus Stationers Accra', 1450.00, NULL),
('2026-06-10', 'Air Conditioning Maintenance Contract', 'CHK-2026-0904', 'CoolTech HVAC Solutions', 1900.00, 'Annual HVAC service contract'),
('2026-06-05', 'Janitorial & Cleaning Supplies (Hygiene First)', 'CHK-2026-0905', 'Hygiene First Distributors', 890.00, 'Monthly cleaning consumables'),
('2026-05-30', 'Fire Safety Systems Inspection Fee', 'CHK-2026-0906', 'Ghana National Fire Service', 500.00, 'Annual compliance inspection'),
('2026-05-25', 'Domain & Cloud Hosting Renewal', 'CHK-2026-0907', 'Web4Africa Hosting Division', 1120.00, 'Annual domain & hosting renewal'),
('2026-05-20', 'CCTV Surveillance Cloud Backup License', 'CHK-2026-0908', 'Hikvision Authorized Vendor', 1650.00, 'Annual cloud backup license – 64 cameras');

-- Vehicles Maintenance (new module replacing office_assets)
INSERT INTO public.vehicles_maintenance (reported_on, vehicle_name, issue, status, updates, name_of_worker, cost) VALUES
('2026-08-01', 'Toyota Hilux – GR-1234-24', 'Engine oil change & full service', 'Resolved', 'Synthetic oil 5W-30 replaced, filters changed.', 'AutoTech Garage', 1200.00),
('2026-08-02', 'Toyota Prado – GR-5678-22', 'Front brake pads worn, vibration on braking', 'In Progress', 'New pads sourced, awaiting fitting.', 'MTA Workshop', 850.00),
('2026-08-03', 'Toyota Hiace Bus – GR-9012-21', 'AC system not cooling – refrigerant leak', 'Open', NULL, 'Unassigned', 0.00),
('2026-07-28', 'Mitsubishi L200 – GR-3456-23', 'Right front tyre burst – replacement', 'Resolved', 'New 265/65R17 tyre fitted and wheel balanced.', 'Kwame Tyres Ltd', 650.00),
('2026-07-25', 'Toyota Land Cruiser VX – GR-7890-20', 'Battery weak, failing to start in mornings', 'Resolved', 'New 95Ah DIN battery installed.', 'AutoTech Garage', 450.00),
('2026-07-22', 'Toyota Corolla – GR-2345-24', 'Windscreen crack – passenger side', 'Resolved', 'OEM windscreen replaced, re-sealed.', 'Accra Glass Works', 1800.00),
('2026-08-05', 'Toyota Hilux – GR-1234-24', 'Gearbox oil leak – transmission seal worn', 'Open', NULL, 'Unassigned', 0.00),
('2026-08-07', 'Mitsubishi Pajero – GR-6789-19', 'Suspension – front left shock absorber failed', 'In Progress', 'Part ordered from importer.', 'MTA Workshop', 2200.00),
('2026-07-18', 'Toyota Hiace Bus – GR-9012-21', 'Annual roadworthy inspection & renewal', 'Resolved', 'Passed DVLA roadworthy, sticker renewed.', 'DVLA Accra', 300.00),
('2026-08-09', 'Toyota Prado – GR-5678-22', 'Left side mirror damaged in parking', 'Open', NULL, 'Unassigned', 0.00);

-- Office Maintenance
INSERT INTO public.office_maintenance (reported_on, issue, status, updates, location, name_of_worker, cost) VALUES
('2026-08-01', 'Perkins 150kVA Standby Generator monthly servicing & oil change', 'In Progress', 'Engine oil drained, new filters installed.', 'Generator House', 'Mantrac Engineers', 1850.00),
('2026-07-30', 'Studio B Acoustic Panel wall mounting & soundproofing repair', 'Resolved', 'Re-anchored 6 soundproof panels.', 'Studio B', 'Rehan Mahmood (Acoustic Spec)', 650.00),
('2026-08-03', 'Server Room Dedicated Precision AC Unit high temperature alarm', 'Open', 'Contractor scheduled for Freon gas pressure check.', 'Server Room', 'Unassigned', 0.00),
('2026-07-28', 'UPS Battery Bank Cell 04 voltage calibration', 'Resolved', 'Calibrated battery management system.', 'Power Room', 'APC Tech', 920.00),
('2026-07-22', 'Reception LED Video Wall panel 3 flicker fault', 'Resolved', 'Replaced flat ribbon interconnect cable', 'Reception Entrance', 'Digital Signage Tech', 350.00),
('2026-07-24', 'Executive Boardroom HDMI Pass-through table box loose connection', 'Resolved', 'Re-soldered HDMI transmitter port', 'Boardroom', 'AV Maintenance', 180.00),
('2026-07-26', 'Roof gutter drainage overflow during heavy rainfall', 'Resolved', 'Cleared leaves and debris blockage', 'Main Building Roof', 'Facilities Crew', 200.00),
('2026-07-27', 'Automatic sliding glass entry door motor noise', 'Resolved', 'Replaced drive belt and greased tracks', 'Main Entrance', 'Dorma Glass Tech', 420.00),
('2026-08-02', 'Water dispenser chiller cooling compressor fail', 'Open', 'Quotations requested for compressor replacement', 'Staff Cafeteria', 'Unassigned', 0.00),
('2026-08-04', 'Fire Alarm Control Panel Zone 2 sensor false trip', 'In Progress', 'Testing optical smoke detector sensitivity', '1st Floor East Wing', 'Safety First Ltd', 300.00),
('2026-08-05', 'Studio A motorized teleprompter rig counterbalance fix', 'Resolved', 'Tightened tension springs and balanced weights', 'Studio A', 'Broadcast Support Tech', 150.00),
('2026-08-06', 'Accounts office paper shredder motor jam', 'Resolved', 'Cleared metal staple jam and lubricated gears', 'Accounts Office', 'IT Support', 50.00),
('2026-08-07', 'Substation automatic transfer switch (ATS) relay check', 'In Progress', 'Simulating main grid power failure sequence', 'Electrical Substation', 'ECG Certified Engineer', 800.00),
('2026-08-08', 'Post-Production Room 01 split AC unit remote sensor un-responsive', 'Open', null, 'Post-Production Room 01', 'Unassigned', 0.00),
('2026-08-09', 'Restroom automatic touchless faucet sensor failure', 'In Progress', 'Replacing solenoid valve kit', 'Ground Floor Restroom', 'Adnan Siddiqui', 220.00),
('2026-08-10', 'Server Room biometrics access control reader reset', 'Resolved', 'Updated firmware and recalibrated fingerprint scanner', 'Server Room Door', 'IT Security Team', 100.00),
('2026-08-10', 'Parking lot solar LED floodlight lamp failure', 'Open', null, 'Staff Parking Area', 'Unassigned', 0.00),
('2026-08-10', 'Conference Room motorized projection screen limit switch fault', 'Open', null, 'Conference Room', 'Unassigned', 0.00);

-- Activity Logs
INSERT INTO public.activity_logs (timestamp, user_id, user_name, user_avatar, action, module_name, record_affected, details) VALUES
(NOW() - INTERVAL '15 minutes', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Usman Khan', NULL, 'Created', 'Guest List', 'Bilal Chaudhry', '{"checkIn": "2026-08-01", "country": "Pakistan"}'),
(NOW() - INTERVAL '45 minutes', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'Hamza Ahmed', NULL, 'Edited', 'Guest House Maintenance', 'Air Conditioner leaking water in VIP Suite 101', '{"status": "In Progress"}');
