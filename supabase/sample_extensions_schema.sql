-- VÉRA Management Suite — Extended Modules Schema
-- Run this after supabase/schema.sql on your NEW isolated Supabase project.

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  department text not null default 'Operations',
  owner text not null,
  priority text not null default 'Medium',
  status text not null default 'Todo',
  progress integer not null default 0,
  due_date date,
  budget numeric(12, 2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.vendors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  contact text,
  phone text,
  status text not null default 'Active',
  sla_score integer not null default 95,
  annual_spend numeric(12, 2) not null default 0,
  renewal_date date,
  created_at timestamptz not null default now()
);

create table if not exists public.staff_directory (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null,
  department text not null,
  location text,
  status text not null default 'On Duty',
  email text unique,
  phone text,
  utilization integer not null default 85,
  created_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null default 'SOP',
  owner text not null,
  size text default '1.0 MB',
  status text not null default 'Approved',
  summary text,
  updated_at date not null default current_date,
  created_at timestamptz not null default now()
);

create table if not exists public.room_occupancy (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  wing text not null default 'Main Wing',
  capacity integer not null default 2,
  status text not null default 'Available',
  guest text,
  check_out text default 'Ready Now',
  housekeeping text not null default 'Inspected',
  amenities text,
  created_at timestamptz not null default now()
);

create table if not exists public.community_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null default 'Community Meeting',
  date date not null default current_date,
  time text not null default '18:00',
  location text not null,
  attendees integer not null default 1,
  pinned boolean not null default false,
  description text,
  created_at timestamptz not null default now()
);

-- Enable Row Level Security on all new tables
alter table public.projects enable row level security;
alter table public.vendors enable row level security;
alter table public.staff_directory enable row level security;
alter table public.documents enable row level security;
alter table public.room_occupancy enable row level security;
alter table public.community_events enable row level security;

-- Role-aware RLS policies:
-- All authenticated users can read; admins/super_admins can delete; authenticated users can insert/update.
create or replace function public.is_admin_or_super()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role in ('admin', 'super_admin')
  );
$$;

create policy "Authenticated read projects" on public.projects for select to authenticated using (auth.uid() is not null);
create policy "Authenticated insert projects" on public.projects for insert to authenticated with check (auth.uid() is not null);
create policy "Authenticated update projects" on public.projects for update to authenticated using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "Admin delete projects" on public.projects for delete to authenticated using (public.is_admin_or_super());

create policy "Authenticated read vendors" on public.vendors for select to authenticated using (auth.uid() is not null);
create policy "Authenticated insert vendors" on public.vendors for insert to authenticated with check (auth.uid() is not null);
create policy "Authenticated update vendors" on public.vendors for update to authenticated using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "Admin delete vendors" on public.vendors for delete to authenticated using (public.is_admin_or_super());

create policy "Authenticated read staff_directory" on public.staff_directory for select to authenticated using (auth.uid() is not null);
create policy "Admin insert staff_directory" on public.staff_directory for insert to authenticated with check (public.is_admin_or_super());
create policy "Admin update staff_directory" on public.staff_directory for update to authenticated using (public.is_admin_or_super()) with check (public.is_admin_or_super());
create policy "Admin delete staff_directory" on public.staff_directory for delete to authenticated using (public.is_admin_or_super());

create policy "Authenticated read documents" on public.documents for select to authenticated using (auth.uid() is not null);
create policy "Authenticated insert documents" on public.documents for insert to authenticated with check (auth.uid() is not null);
create policy "Authenticated update documents" on public.documents for update to authenticated using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "Admin delete documents" on public.documents for delete to authenticated using (public.is_admin_or_super());

create policy "Authenticated read room_occupancy" on public.room_occupancy for select to authenticated using (auth.uid() is not null);
create policy "Authenticated insert room_occupancy" on public.room_occupancy for insert to authenticated with check (auth.uid() is not null);
create policy "Authenticated update room_occupancy" on public.room_occupancy for update to authenticated using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "Admin delete room_occupancy" on public.room_occupancy for delete to authenticated using (public.is_admin_or_super());

create policy "Authenticated read community_events" on public.community_events for select to authenticated using (auth.uid() is not null);
create policy "Authenticated insert community_events" on public.community_events for insert to authenticated with check (auth.uid() is not null);
create policy "Authenticated update community_events" on public.community_events for update to authenticated using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "Admin delete community_events" on public.community_events for delete to authenticated using (public.is_admin_or_super());
