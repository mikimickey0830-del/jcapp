-- Development grants for Supabase API keys.
-- Run this once if the app shows permission errors while reading or saving app data.

grant usage on schema public to anon, authenticated;
grant select on all tables in schema public to anon, authenticated;
grant insert, update on public.members to anon, authenticated;
grant insert on public.fiscal_years to anon, authenticated;
grant insert, update on public.committees to anon, authenticated;
grant insert on public.positions to anon, authenticated;
grant insert, update on public.annual_member_assignments to anon, authenticated;
alter default privileges in schema public grant select on tables to anon, authenticated;

alter table public.committees add column if not exists description text;
alter table public.committees add column if not exists vice_president_member_id uuid references public.members(id) on delete set null;
alter table public.committees add column if not exists chair_member_id uuid references public.members(id) on delete set null;
alter table public.committees add column if not exists vice_chair_member_id uuid references public.members(id) on delete set null;
alter table public.committees add column if not exists deleted_at timestamptz;
alter table public.annual_member_assignments add column if not exists is_active boolean not null default true;

drop policy if exists "dev_insert_members" on public.members;
drop policy if exists "dev_update_members" on public.members;
drop policy if exists "dev_insert_fiscal_years" on public.fiscal_years;
drop policy if exists "dev_insert_committees" on public.committees;
drop policy if exists "dev_update_committees" on public.committees;
drop policy if exists "dev_insert_positions" on public.positions;
drop policy if exists "dev_insert_annual_member_assignments" on public.annual_member_assignments;
drop policy if exists "dev_update_annual_member_assignments" on public.annual_member_assignments;

create policy "dev_insert_members" on public.members for insert with check (true);
create policy "dev_update_members" on public.members for update using (true) with check (true);
create policy "dev_insert_fiscal_years" on public.fiscal_years for insert with check (true);
create policy "dev_insert_committees" on public.committees for insert with check (true);
create policy "dev_update_committees" on public.committees for update using (true) with check (true);
create policy "dev_insert_positions" on public.positions for insert with check (true);
create policy "dev_insert_annual_member_assignments" on public.annual_member_assignments for insert with check (true);
create policy "dev_update_annual_member_assignments" on public.annual_member_assignments for update using (true) with check (true);
