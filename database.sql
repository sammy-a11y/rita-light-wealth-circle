-- ============================================
-- RITA LIGHT WEALTH CIRCLE™
-- Complete Database Setup Script
-- Run this entire file in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- DROP EXISTING TABLES (clean setup)
-- ============================================
drop table if exists public.blacklist cascade;
drop table if exists public.notifications cascade;
drop table if exists public.payments cascade;
drop table if exists public.slots cascade;
drop table if exists public.group_requests cascade;
drop table if exists public.groups cascade;
drop table if exists public.users cascade;

-- ============================================
-- CREATE TABLES
-- ============================================

-- USERS
create table public.users (
  id                uuid primary key,
  full_name         text not null,
  email             text unique not null,
  phone             text unique not null,
  nin               text,
  face_video_url    text,
  birth_year        integer,
  gender            text,
  address           text,
  state             text,
  city              text,
  employment_status text,
  occupation        text,
  income_range      text,
  latitude          double precision,
  longitude         double precision,
  location_updated_at timestamp with time zone,
  is_verified       boolean default true,
  is_admin          boolean default false,
  is_blacklisted    boolean default false,
  blacklist_reason  text,
  created_at        timestamp with time zone default now()
);

-- GROUPS
create table public.groups (
  id              uuid default uuid_generate_v4() primary key,
  name            text not null,
  description     text,
  amount_per_slot numeric not null,
  payout_amount   numeric not null,
  admin_cut       numeric default 0,
  frequency       text not null check (frequency in ('daily','weekly','monthly')),
  max_slots       integer not null,
  status          text default 'open' check (status in ('open','filling','active','completed')),
  bank_name       text,
  account_name    text,
  account_number  text,
  starts_at       timestamp with time zone,
  created_by      uuid references public.users(id),
  created_at      timestamp with time zone default now()
);

-- SLOTS
create table public.slots (
  id            uuid default uuid_generate_v4() primary key,
  group_id      uuid references public.groups(id) on delete cascade,
  slot_number   integer not null,
  user_id       uuid references public.users(id),
  is_admin_slot boolean default false,
  packing_date  timestamp with time zone,
  status        text default 'unpaid' check (status in ('unpaid','paid','packing')),
  created_at    timestamp with time zone default now(),
  unique(group_id, slot_number)
);

-- GROUP REQUESTS
create table public.group_requests (
  id           uuid default uuid_generate_v4() primary key,
  user_id      uuid references public.users(id) on delete cascade,
  group_id     uuid references public.groups(id) on delete cascade,
  slots_wanted integer not null default 1,
  status       text default 'pending' check (status in ('pending','approved','declined')),
  reviewed_by  uuid references public.users(id),
  reviewed_at  timestamp with time zone,
  created_at   timestamp with time zone default now(),
  unique(user_id, group_id)
);

-- PAYMENTS
create table public.payments (
  id              uuid default uuid_generate_v4() primary key,
  user_id         uuid references public.users(id),
  group_id        uuid references public.groups(id) on delete set null,
  slot_id         uuid references public.slots(id),
  amount          numeric not null,
  sender_name     text,
  transaction_ref text,
  payment_date    date,
  receipt_url     text,
  status          text default 'pending' check (status in ('pending','approved','rejected')),
  penalty_fee     numeric default 0,
  approved_by     uuid references public.users(id),
  approved_at     timestamp with time zone,
  created_at      timestamp with time zone default now()
);

-- NOTIFICATIONS
create table public.notifications (
  id         uuid default uuid_generate_v4() primary key,
  user_id    uuid references public.users(id),
  group_id   uuid references public.groups(id) on delete set null,
  title      text not null,
  message    text not null,
  type       text default 'info' check (type in ('info','payment','warning','penalty','success')),
  is_read    boolean default false,
  created_at timestamp with time zone default now()
);

-- BLACKLIST
create table public.blacklist (
  id              uuid default uuid_generate_v4() primary key,
  user_id         uuid references public.users(id),
  reason          text not null,
  blacklisted_by  uuid references public.users(id),
  created_at      timestamp with time zone default now()
);

-- ============================================
-- TRIGGER — Auto create ALL slots when group created
-- ============================================
create or replace function reserve_admin_slots()
returns trigger as $$
declare
  i integer;
begin
  for i in 1..NEW.max_slots loop
    insert into public.slots (group_id, slot_number, is_admin_slot, status)
    values (
      NEW.id,
      i,
      case when i <= 2 then true else false end,
      case when i <= 2 then 'paid' else 'unpaid' end
    );
  end loop;
  return NEW;
end;
$$ language plpgsql;

create trigger on_group_created
after insert on public.groups
for each row execute procedure reserve_admin_slots();

-- ============================================
-- STORAGE BUCKETS
-- ============================================
insert into storage.buckets (id, name, public)
values ('verifications', 'verifications', true)
on conflict (id) do nothing;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Disable RLS (simpler approach for single-tenant app)
alter table public.users          disable row level security;
alter table public.groups         disable row level security;
alter table public.slots          disable row level security;
alter table public.payments       disable row level security;
alter table public.group_requests disable row level security;
alter table public.notifications  disable row level security;
alter table public.blacklist      disable row level security;

-- Storage policy
create policy "Public storage access"
  on storage.objects for all
  using (bucket_id = 'verifications')
  with check (bucket_id = 'verifications');

-- ============================================
-- DONE!
-- Now create your admin account:
-- 1. Go to Supabase > Authentication > Users > Add User
-- 2. Copy the User UID
-- 3. Run the insert below with real values
-- ============================================

-- INSERT ADMIN USER (update with real values)
-- insert into public.users (
--   id, full_name, email, phone,
--   is_admin, is_verified, is_blacklisted
-- ) values (
--   'YOUR-ADMIN-UID-HERE',
--   'Admin Name',
--   'admin@yourdomain.com',
--   '+234800000000',
--   true, true, false
-- );
