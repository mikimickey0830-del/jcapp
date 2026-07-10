-- Development grants for Supabase API keys.
-- Run this once if the app shows permission errors while reading or saving app data.

grant usage on schema public to anon, authenticated;
grant select on all tables in schema public to anon, authenticated;
grant insert, update on public.members to anon, authenticated;
grant insert on public.fiscal_years to anon, authenticated;
grant insert, update on public.committees to anon, authenticated;
grant insert on public.positions to anon, authenticated;
grant insert, update on public.annual_member_assignments to anon, authenticated;
grant insert, update on public.committee_memberships to anon, authenticated;
grant insert, update on public.events to anon, authenticated;
grant insert, update on public.attendance_responses to anon, authenticated;
alter default privileges in schema public grant select on tables to anon, authenticated;

alter table public.committees add column if not exists description text;
alter table public.committees add column if not exists vice_president_member_id uuid references public.members(id) on delete set null;
alter table public.committees add column if not exists chair_member_id uuid references public.members(id) on delete set null;
alter table public.committees add column if not exists vice_chair_member_id uuid references public.members(id) on delete set null;
alter table public.committees add column if not exists deleted_at timestamptz;
alter table public.annual_member_assignments add column if not exists is_active boolean not null default true;
alter table public.events add column if not exists google_map_url text;
alter table public.events add column if not exists reminder_at timestamptz;
alter table public.events add column if not exists google_calendar_event_id text;
alter table public.events add column if not exists target_committee_ids uuid[] not null default '{}';
alter table public.events add column if not exists target_position_ids uuid[] not null default '{}';
alter table public.events add column if not exists target_member_ids uuid[] not null default '{}';
alter table public.events add column if not exists operating_committee_id uuid references public.committees(id) on delete set null;
alter table public.events add column if not exists contact_member_id uuid references public.members(id) on delete set null;
alter table public.events add column if not exists bring_items text;
alter table public.events add column if not exists dress_code text;
alter table public.events add column if not exists notes text;
alter table public.events add column if not exists deleted_at timestamptz;

create table if not exists public.committee_memberships (
  id uuid primary key default gen_random_uuid(),
  lom_id uuid not null references public.loms(id) on delete cascade,
  fiscal_year_id uuid not null references public.fiscal_years(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  committee_id uuid not null references public.committees(id) on delete cascade,
  role_in_committee text not null default 'member' check (role_in_committee in ('chair', 'vice_chair', 'member', 'observer', 'advisor')),
  is_primary boolean not null default false,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (fiscal_year_id, member_id, committee_id)
);

insert into public.committee_memberships (
  lom_id, fiscal_year_id, member_id, committee_id, role_in_committee, is_primary, note, created_at, updated_at
)
select
  lom_id,
  fiscal_year_id,
  member_id,
  committee_id,
  case
    when role = 'chair' then 'chair'
    when role = 'vice_chair' then 'vice_chair'
    else 'member'
  end as role_in_committee,
  true as is_primary,
  '' as note,
  created_at,
  updated_at
from public.annual_member_assignments
where committee_id is not null
on conflict (fiscal_year_id, member_id, committee_id) do nothing;

create index if not exists idx_committee_memberships_committee on public.committee_memberships(committee_id, deleted_at);
create index if not exists idx_committee_memberships_member_year on public.committee_memberships(member_id, fiscal_year_id, deleted_at);
alter table public.committee_memberships enable row level security;

drop policy if exists "dev_insert_members" on public.members;
drop policy if exists "dev_update_members" on public.members;
drop policy if exists "dev_insert_fiscal_years" on public.fiscal_years;
drop policy if exists "dev_insert_committees" on public.committees;
drop policy if exists "dev_update_committees" on public.committees;
drop policy if exists "dev_insert_positions" on public.positions;
drop policy if exists "dev_insert_annual_member_assignments" on public.annual_member_assignments;
drop policy if exists "dev_update_annual_member_assignments" on public.annual_member_assignments;
drop policy if exists "dev_select_committee_memberships" on public.committee_memberships;
drop policy if exists "dev_insert_committee_memberships" on public.committee_memberships;
drop policy if exists "dev_update_committee_memberships" on public.committee_memberships;
drop policy if exists "dev_insert_events" on public.events;
drop policy if exists "dev_update_events" on public.events;
drop policy if exists "dev_insert_attendance_responses" on public.attendance_responses;
drop policy if exists "dev_update_attendance_responses" on public.attendance_responses;

create policy "dev_insert_members" on public.members for insert with check (true);
create policy "dev_update_members" on public.members for update using (true) with check (true);
create policy "dev_insert_fiscal_years" on public.fiscal_years for insert with check (true);
create policy "dev_insert_committees" on public.committees for insert with check (true);
create policy "dev_update_committees" on public.committees for update using (true) with check (true);
create policy "dev_insert_positions" on public.positions for insert with check (true);
create policy "dev_insert_annual_member_assignments" on public.annual_member_assignments for insert with check (true);
create policy "dev_update_annual_member_assignments" on public.annual_member_assignments for update using (true) with check (true);
create policy "dev_select_committee_memberships" on public.committee_memberships for select using (true);
create policy "dev_insert_committee_memberships" on public.committee_memberships for insert with check (true);
create policy "dev_update_committee_memberships" on public.committee_memberships for update using (true) with check (true);
create policy "dev_insert_events" on public.events for insert with check (true);
create policy "dev_update_events" on public.events for update using (true) with check (true);
create policy "dev_insert_attendance_responses" on public.attendance_responses for insert with check (true);
create policy "dev_update_attendance_responses" on public.attendance_responses for update using (true) with check (true);

notify pgrst, 'reload schema';
