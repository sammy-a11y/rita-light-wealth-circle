create_table_script
CREATE TABLE IF NOT EXISTS public.blacklist (user_id uuid, blacklisted_by uuid, created_at timestamp with time zone, reason text, id uuid);

CREATE TABLE IF NOT EXISTS public.group_requests (reviewed_at timestamp with time zone, reviewed_by uuid, slots_wanted integer, user_id uuid, id uuid, status text, group_id uuid, created_at timestamp with time zone);

CREATE TABLE IF NOT EXISTS public.groups (created_at timestamp with time zone, admin_cut numeric, status text, frequency text, description text, name text, account_name text, bank_name text, account_number text, id uuid, amount_per_slot numeric, payout_amount numeric, max_slots integer, starts_at timestamp with time zone, created_by uuid);

CREATE TABLE IF NOT EXISTS public.notifications (type text, created_at timestamp with time zone, is_read boolean, group_id uuid, user_id uuid, id uuid, message text, title text);

CREATE TABLE IF NOT EXISTS public.payments (created_at timestamp with time zone, id uuid, user_id uuid, group_id uuid, slot_id uuid, amount numeric, payment_date date, penalty_fee numeric, approved_by uuid, approved_at timestamp with time zone, transaction_ref text, status text, receipt_url text, sender_name text);

CREATE TABLE IF NOT EXISTS public.slots (user_id uuid, packing_date timestamp with time zone, status text, is_admin_slot boolean, slot_number integer, created_at timestamp with time zone, group_id uuid, id uuid);

CREATE TABLE IF NOT EXISTS public.users (occupation text, income_range text, id uuid, full_name text, email text, phone text, nin text, face_video_url text, blacklist_reason text, gender text, birth_year integer, created_at timestamp with time zone, location_updated_at timestamp with time zone, latitude double precision, longitude double precision, is_blacklisted boolean, address text, state text, is_admin boolean, city text, is_verified boolean, employment_status text);