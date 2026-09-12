-- ============================================================================
-- MTA Ghana Operations Dashboard - Supabase Database Schema (PostgreSQL)
-- ============================================================================

-- 1. ENUMS
CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'staff');
CREATE TYPE maintenance_status AS ENUM ('Open', 'In Progress', 'Resolved');
CREATE TYPE inventory_condition AS ENUM ('Good', 'Fair', 'Damaged');
CREATE TYPE asset_status AS ENUM ('In Use', 'In Storage', 'Retired');
CREATE TYPE log_action AS ENUM ('Created', 'Edited', 'Deleted');

-- 2. USERS & ACCESS MANAGEMENT
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role user_role NOT NULL DEFAULT 'staff',
    status VARCHAR(20) NOT NULL DEFAULT 'Active',
    avatar VARCHAR(255),
    last_login TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Granular module permissions for staff
CREATE TABLE IF NOT EXISTS public.user_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    module_key VARCHAR(50) NOT NULL, -- e.g. 'guest_list', 'office_assets'
    can_view BOOLEAN DEFAULT FALSE,
    can_add BOOLEAN DEFAULT FALSE,
    can_edit BOOLEAN DEFAULT FALSE,
    can_delete BOOLEAN DEFAULT FALSE,
    UNIQUE(user_id, module_key)
);

-- 3. GUEST HOUSE MODULES
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
    serial_number VARCHAR(100),
    cost NUMERIC(12, 2) DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. OFFICE MODULES
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

-- 5. SYSTEM AUDIT ACTIVITY LOG
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES public.users(id),
    user_name VARCHAR(255) NOT NULL,
    user_avatar VARCHAR(255),
    action log_action NOT NULL,
    module_name VARCHAR(100) NOT NULL,
    record_affected VARCHAR(255) NOT NULL,
    details JSONB, -- Stores old_value -> new_value diff
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS POLICIES (Row-level security enabled)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_house_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_house_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.office_bill_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.office_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
