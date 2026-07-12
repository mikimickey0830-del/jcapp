-- Announcement CRUD support for an existing JC-App Supabase database.
-- Run this file once in the Supabase SQL Editor before using announcement save/edit/delete.

alter table public.announcements add column if not exists deleted_at timestamptz;

grant insert, update on public.announcements to anon, authenticated;

drop policy if exists "dev_insert_announcements" on public.announcements;
drop policy if exists "dev_update_announcements" on public.announcements;

create policy "dev_insert_announcements" on public.announcements for insert with check (true);
create policy "dev_update_announcements" on public.announcements for update using (true) with check (true);

notify pgrst, 'reload schema';
