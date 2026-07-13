-- JC-App member invitation and automatic Auth linking.
-- Run this once in the Supabase SQL Editor after auth-schema-migration.sql.

alter table public.members
  add column if not exists invitation_status text not null default 'not_invited',
  add column if not exists invited_at timestamptz,
  add column if not exists activated_at timestamptz,
  add column if not exists invitation_last_sent_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'members_invitation_status_check'
  ) then
    alter table public.members add constraint members_invitation_status_check
      check (invitation_status in ('not_invited', 'invited', 'active', 'failed'));
  end if;
end $$;

update public.members
set invitation_status = 'active',
    activated_at = coalesce(activated_at, updated_at)
where auth_user_id is not null
  and invitation_status <> 'active';

create index if not exists idx_members_invitation_status
  on public.members(lom_id, invitation_status);

-- Service-role-only audit trail. RLS remains enabled; the browser receives no access policy.
create table if not exists public.auth_invitation_audit_logs (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references public.members(id) on delete set null,
  actor_auth_user_id uuid references auth.users(id) on delete set null,
  action text not null check (action in ('invited', 'resent', 'activated', 'failed')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_auth_invitation_audit_member_created
  on public.auth_invitation_audit_logs(member_id, created_at desc);

alter table public.auth_invitation_audit_logs enable row level security;
