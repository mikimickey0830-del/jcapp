-- Run this once before linking Supabase Auth users to members.
alter table public.members add column if not exists auth_user_id uuid;
create unique index if not exists idx_members_auth_user_id
  on public.members(auth_user_id) where auth_user_id is not null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'members_auth_user_id_fkey') then
    alter table public.members add constraint members_auth_user_id_fkey
      foreign key (auth_user_id) references auth.users(id) on delete set null;
  end if;
end $$;
