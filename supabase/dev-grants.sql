-- Development grants for Supabase API keys.
-- Run this once if the app shows permission errors while reading or saving members.

grant usage on schema public to anon, authenticated;
grant select on all tables in schema public to anon, authenticated;
grant insert, update on public.members to anon, authenticated;
alter default privileges in schema public grant select on tables to anon, authenticated;

drop policy if exists "dev_insert_members" on public.members;
drop policy if exists "dev_update_members" on public.members;

create policy "dev_insert_members" on public.members for insert with check (true);
create policy "dev_update_members" on public.members for update using (true) with check (true);
