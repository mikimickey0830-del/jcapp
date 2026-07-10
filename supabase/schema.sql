-- JC-App Supabase schema
-- Run this file in the Supabase SQL editor before seed.sql.

create extension if not exists "pgcrypto";

create table if not exists public.loms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  prefecture text,
  city text,
  created_at timestamptz not null default now()
);

create table if not exists public.fiscal_years (
  id uuid primary key default gen_random_uuid(),
  lom_id uuid not null references public.loms(id) on delete cascade,
  year integer not null,
  name text not null,
  starts_on date not null,
  ends_on date not null,
  status text not null default 'planned' check (status in ('planned', 'current', 'closed')),
  is_current boolean not null default false,
  copied_from_year_id uuid references public.fiscal_years(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (lom_id, year)
);

create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  lom_id uuid not null references public.loms(id) on delete cascade,
  auth_user_id uuid unique,
  last_name text not null,
  first_name text not null,
  last_name_kana text not null,
  first_name_kana text not null,
  email text not null,
  phone text,
  joined_year integer not null,
  status text not null default 'active' check (status in ('active', 'inactive', 'graduated')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (lom_id, email)
);

create table if not exists public.committees (
  id uuid primary key default gen_random_uuid(),
  lom_id uuid not null references public.loms(id) on delete cascade,
  fiscal_year_id uuid not null references public.fiscal_years(id) on delete cascade,
  name text not null,
  description text,
  vice_president_member_id uuid references public.members(id) on delete set null,
  chair_member_id uuid references public.members(id) on delete set null,
  vice_chair_member_id uuid references public.members(id) on delete set null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (fiscal_year_id, name)
);

alter table public.committees add column if not exists description text;
alter table public.committees add column if not exists vice_president_member_id uuid references public.members(id) on delete set null;
alter table public.committees add column if not exists chair_member_id uuid references public.members(id) on delete set null;
alter table public.committees add column if not exists vice_chair_member_id uuid references public.members(id) on delete set null;
alter table public.committees add column if not exists deleted_at timestamptz;

create table if not exists public.positions (
  id uuid primary key default gen_random_uuid(),
  lom_id uuid not null references public.loms(id) on delete cascade,
  fiscal_year_id uuid not null references public.fiscal_years(id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (fiscal_year_id, name)
);

create table if not exists public.annual_member_assignments (
  id uuid primary key default gen_random_uuid(),
  lom_id uuid not null references public.loms(id) on delete cascade,
  fiscal_year_id uuid not null references public.fiscal_years(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  committee_id uuid references public.committees(id) on delete set null,
  position_id uuid references public.positions(id) on delete set null,
  role text not null default 'member' check (role in ('member', 'vice_chair', 'chair', 'secretary', 'president', 'admin')),
  is_board_member boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (fiscal_year_id, member_id)
);

alter table public.annual_member_assignments add column if not exists is_active boolean not null default true;

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  lom_id uuid not null references public.loms(id) on delete cascade,
  fiscal_year_id uuid not null references public.fiscal_years(id) on delete cascade,
  title text not null,
  event_type text not null check (event_type in ('regular_meeting', 'board_meeting', 'committee', 'project', 'block', 'jci_japan', 'other')),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  venue text,
  address text,
  target_audience text,
  description text,
  requires_attendance boolean not null default false,
  attendance_deadline timestamptz,
  created_by uuid references public.members(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.attendance_responses (
  id uuid primary key default gen_random_uuid(),
  lom_id uuid not null references public.loms(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  status text not null default 'unanswered' check (status in ('attending', 'absent', 'late', 'unanswered')),
  comment text,
  responded_at timestamptz,
  reply_deadline timestamptz,
  is_overdue boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, member_id)
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  lom_id uuid not null references public.loms(id) on delete cascade,
  fiscal_year_id uuid not null references public.fiscal_years(id) on delete cascade,
  event_id uuid references public.events(id) on delete set null,
  title text not null,
  file_name text not null,
  file_type text not null check (file_type in ('pdf', 'word', 'excel', 'powerpoint', 'image', 'other')),
  category text not null check (category in ('agenda', 'minutes', 'bylaws', 'project', 'meeting', 'other')),
  storage_path text not null,
  visibility text not null default 'all' check (visibility in ('all', 'board', 'admins')),
  uploaded_by uuid references public.members(id) on delete set null,
  uploaded_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  lom_id uuid not null references public.loms(id) on delete cascade,
  fiscal_year_id uuid references public.fiscal_years(id) on delete cascade,
  member_id uuid references public.members(id) on delete cascade,
  title text not null,
  body text not null,
  notification_type text not null check (notification_type in ('attendance_deadline', 'event_today', 'document_added', 'announcement', 'system')),
  related_href text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  lom_id uuid not null references public.loms(id) on delete cascade,
  fiscal_year_id uuid not null references public.fiscal_years(id) on delete cascade,
  title text not null,
  body text not null,
  announcement_type text not null check (announcement_type in ('general', 'regular_meeting', 'board_meeting', 'committee', 'deadline', 'document_added', 'other')),
  target_lom text not null,
  target_committee_id uuid references public.committees(id) on delete set null,
  visibility text not null default 'members' check (visibility in ('all', 'members', 'board', 'committee', 'admins')),
  importance text not null default 'normal' check (importance in ('normal', 'important', 'urgent')),
  publish_start_at timestamptz not null,
  publish_end_at timestamptz,
  author_member_id uuid references public.members(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_fiscal_years_lom_year on public.fiscal_years(lom_id, year);
create index if not exists idx_members_lom_status on public.members(lom_id, status);
create index if not exists idx_assignments_year_member on public.annual_member_assignments(fiscal_year_id, member_id);
create index if not exists idx_events_year_starts_at on public.events(fiscal_year_id, starts_at);
create index if not exists idx_attendance_event_status on public.attendance_responses(event_id, status);
create index if not exists idx_documents_year_uploaded_at on public.documents(fiscal_year_id, uploaded_at desc);
create index if not exists idx_notifications_member_created_at on public.notifications(member_id, created_at desc);
create index if not exists idx_announcements_year_publish on public.announcements(fiscal_year_id, publish_start_at desc);

alter table public.loms enable row level security;
alter table public.fiscal_years enable row level security;
alter table public.members enable row level security;
alter table public.committees enable row level security;
alter table public.positions enable row level security;
alter table public.annual_member_assignments enable row level security;
alter table public.events enable row level security;
alter table public.attendance_responses enable row level security;
alter table public.documents enable row level security;
alter table public.notifications enable row level security;
alter table public.announcements enable row level security;

grant usage on schema public to anon, authenticated;
grant select on all tables in schema public to anon, authenticated;
grant insert, update on public.members to anon, authenticated;
grant insert on public.fiscal_years to anon, authenticated;
grant insert, update on public.committees to anon, authenticated;
grant insert on public.positions to anon, authenticated;
grant insert, update on public.annual_member_assignments to anon, authenticated;
alter default privileges in schema public grant select on tables to anon, authenticated;

-- Development-only read policies.
-- TODO: Before production, replace these with LOM-scoped policies based on auth.uid()
-- and annual_member_assignments.role.
drop policy if exists "dev_select_loms" on public.loms;
drop policy if exists "dev_select_fiscal_years" on public.fiscal_years;
drop policy if exists "dev_select_members" on public.members;
drop policy if exists "dev_select_committees" on public.committees;
drop policy if exists "dev_select_positions" on public.positions;
drop policy if exists "dev_select_annual_member_assignments" on public.annual_member_assignments;
drop policy if exists "dev_select_events" on public.events;
drop policy if exists "dev_select_attendance_responses" on public.attendance_responses;
drop policy if exists "dev_select_documents" on public.documents;
drop policy if exists "dev_select_notifications" on public.notifications;
drop policy if exists "dev_select_announcements" on public.announcements;
drop policy if exists "dev_insert_members" on public.members;
drop policy if exists "dev_update_members" on public.members;
drop policy if exists "dev_insert_fiscal_years" on public.fiscal_years;
drop policy if exists "dev_insert_committees" on public.committees;
drop policy if exists "dev_update_committees" on public.committees;
drop policy if exists "dev_insert_positions" on public.positions;
drop policy if exists "dev_insert_annual_member_assignments" on public.annual_member_assignments;
drop policy if exists "dev_update_annual_member_assignments" on public.annual_member_assignments;

create policy "dev_select_loms" on public.loms for select using (true);
create policy "dev_select_fiscal_years" on public.fiscal_years for select using (true);
create policy "dev_select_members" on public.members for select using (true);
create policy "dev_select_committees" on public.committees for select using (true);
create policy "dev_select_positions" on public.positions for select using (true);
create policy "dev_select_annual_member_assignments" on public.annual_member_assignments for select using (true);
create policy "dev_select_events" on public.events for select using (true);
create policy "dev_select_attendance_responses" on public.attendance_responses for select using (true);
create policy "dev_select_documents" on public.documents for select using (true);
create policy "dev_select_notifications" on public.notifications for select using (true);
create policy "dev_select_announcements" on public.announcements for select using (true);
create policy "dev_insert_members" on public.members for insert with check (true);
create policy "dev_update_members" on public.members for update using (true) with check (true);
create policy "dev_insert_fiscal_years" on public.fiscal_years for insert with check (true);
create policy "dev_insert_committees" on public.committees for insert with check (true);
create policy "dev_update_committees" on public.committees for update using (true) with check (true);
create policy "dev_insert_positions" on public.positions for insert with check (true);
create policy "dev_insert_annual_member_assignments" on public.annual_member_assignments for insert with check (true);
create policy "dev_update_annual_member_assignments" on public.annual_member_assignments for update using (true) with check (true);
