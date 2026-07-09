-- Development read grants for Supabase API keys.
-- Run this once if the app shows: permission denied for table members.

grant usage on schema public to anon, authenticated;
grant select on all tables in schema public to anon, authenticated;
alter default privileges in schema public grant select on tables to anon, authenticated;
