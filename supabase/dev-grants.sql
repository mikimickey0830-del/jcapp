-- Development grants for Supabase API keys.
-- Run this once if the app shows permission errors while reading or saving app data.

grant usage on schema public to anon, authenticated;
grant select on all tables in schema public to anon, authenticated;
grant insert, update on public.members to anon, authenticated;
grant insert on public.fiscal_years to anon, authenticated;
grant insert on public.committees to anon, authenticated;
grant insert on public.positions to anon, authenticated;
grant insert on public.annual_member_assignments to anon, authenticated;
alter default privileges in schema public grant select on tables to anon, authenticated;

drop policy if exists "dev_insert_members" on public.members;
drop policy if exists "dev_update_members" on public.members;
drop policy if exists "dev_insert_fiscal_years" on public.fiscal_years;
drop policy if exists "dev_insert_committees" on public.committees;
drop policy if exists "dev_insert_positions" on public.positions;
drop policy if exists "dev_insert_annual_member_assignments" on public.annual_member_assignments;

create policy "dev_insert_members" on public.members for insert with check (true);
create policy "dev_update_members" on public.members for update using (true) with check (true);
create policy "dev_insert_fiscal_years" on public.fiscal_years for insert with check (true);
create policy "dev_insert_committees" on public.committees for insert with check (true);
create policy "dev_insert_positions" on public.positions for insert with check (true);
create policy "dev_insert_annual_member_assignments" on public.annual_member_assignments for insert with check (true);
