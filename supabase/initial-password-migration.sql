-- JC-App initial-password account issuance.
-- Run after auth-schema-migration.sql and auth-invitation-migration.sql.
-- This migration does not remove or overwrite existing member accounts.

alter table public.members
  add column if not exists must_change_password boolean not null default false;

-- Existing audit data remains intact while credential lifecycle events are added.
alter table public.auth_invitation_audit_logs
  drop constraint if exists auth_invitation_audit_logs_action_check;

alter table public.auth_invitation_audit_logs
  add constraint auth_invitation_audit_logs_action_check
  check (action in (
    'invited',
    'resent',
    'activated',
    'failed',
    'account_issued',
    'initial_password_reissued',
    'initial_password_changed'
  ));

-- Only the signed-in member can complete their own initial password change.
create or replace function public.complete_initial_password_change()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  target_member_id uuid;
begin
  if auth.uid() is null then
    return false;
  end if;

  update public.members
  set must_change_password = false,
      updated_at = now()
  where auth_user_id = auth.uid()
    and must_change_password = true
  returning id into target_member_id;

  if target_member_id is null then
    return false;
  end if;

  insert into public.auth_invitation_audit_logs (member_id, actor_auth_user_id, action, metadata)
  values (target_member_id, auth.uid(), 'initial_password_changed', jsonb_build_object('source', 'jc-app'));

  return true;
end;
$$;

-- Management-only protected-field update used after a server-side Auth account is issued.
create or replace function public.link_issued_member_account(
  p_member_id uuid,
  p_auth_user_id uuid,
  p_action text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  target_lom_id uuid;
begin
  if auth.uid() is null or p_action not in ('account_issued', 'initial_password_reissued') then
    return false;
  end if;

  select lom_id into target_lom_id
  from public.members
  where id = p_member_id;

  if target_lom_id is null or not public.can_manage_lom(target_lom_id) then
    return false;
  end if;

  if p_action = 'account_issued' then
    update public.members
    set auth_user_id = p_auth_user_id,
        invitation_status = 'active',
        activated_at = coalesce(activated_at, now()),
        must_change_password = true,
        updated_at = now()
    where id = p_member_id
      and auth_user_id is null;
  else
    update public.members
    set must_change_password = true,
        updated_at = now()
    where id = p_member_id
      and auth_user_id = p_auth_user_id;
  end if;

  if not found then
    return false;
  end if;

  insert into public.auth_invitation_audit_logs (member_id, actor_auth_user_id, action, metadata)
  values (p_member_id, auth.uid(), p_action, jsonb_build_object('source', 'jc-app'));

  return true;
end;
$$;

revoke all on function public.complete_initial_password_change() from public;
revoke all on function public.link_issued_member_account(uuid, uuid, text) from public;
grant execute on function public.complete_initial_password_change() to authenticated;
grant execute on function public.link_issued_member_account(uuid, uuid, text) to authenticated;

create or replace function public.record_account_credential_event(
  p_member_id uuid,
  p_action text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  target_lom_id uuid;
begin
  if auth.uid() is null or p_action not in ('account_issued', 'initial_password_reissued') then
    return false;
  end if;

  select lom_id into target_lom_id from public.members where id = p_member_id;
  if target_lom_id is null or not public.can_manage_lom(target_lom_id) then
    return false;
  end if;

  insert into public.auth_invitation_audit_logs (member_id, actor_auth_user_id, action, metadata)
  values (p_member_id, auth.uid(), p_action, jsonb_build_object('source', 'jc-app'));

  return true;
end;
$$;

revoke all on function public.record_account_credential_event(uuid, text) from public;
grant execute on function public.record_account_credential_event(uuid, text) to authenticated;

-- A manager may create a member in their own LOM. Protected credential fields
-- are written by the security-definer function above, never by a member.
drop policy if exists "manager_insert_members" on public.members;
create policy "manager_insert_members" on public.members
  for insert to authenticated
  with check (public.can_manage_lom(lom_id));
