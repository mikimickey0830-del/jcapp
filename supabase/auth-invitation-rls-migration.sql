-- RLS-safe invitation state changes and activation audit logging.
-- Run this after auth-invitation-migration.sql and production-rls.sql.

create or replace function public.record_member_invitation(
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
  now_at timestamptz := now();
begin
  if p_action not in ('invited', 'resent', 'failed') then
    return false;
  end if;

  select lom_id into target_lom_id
  from public.members
  where id = p_member_id;

  if target_lom_id is null or not public.can_manage_lom(target_lom_id) then
    return false;
  end if;

  if p_action in ('invited', 'resent') then
    update public.members
    set invitation_status = 'invited',
        invited_at = case when invitation_status = 'invited' then invited_at else now_at end,
        invitation_last_sent_at = now_at,
        updated_at = now_at
    where id = p_member_id
      and auth_user_id is null;
  else
    update public.members
    set invitation_status = 'failed',
        updated_at = now_at
    where id = p_member_id
      and auth_user_id is null;
  end if;

  if not found then
    return false;
  end if;

  insert into public.auth_invitation_audit_logs (member_id, actor_auth_user_id, action, metadata)
  values (p_member_id, auth.uid(), p_action, jsonb_build_object('source', 'jc-app'));

  return true;
end;
$$;

create or replace function public.activate_current_member_invitation()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_member_id uuid;
  metadata_member_id uuid;
  metadata_lom_id uuid;
  signed_in_email text;
  was_active boolean;
begin
  signed_in_email := lower(trim(coalesce(auth.jwt() ->> 'email', '')));
  if signed_in_email = '' then
    return null;
  end if;

  begin
    metadata_member_id := (auth.jwt() -> 'user_metadata' ->> 'member_id')::uuid;
    metadata_lom_id := (auth.jwt() -> 'user_metadata' ->> 'lom_id')::uuid;
  exception when invalid_text_representation then
    return null;
  end;

  select id, invitation_status = 'active'
    into target_member_id, was_active
  from public.members
  where id = metadata_member_id
    and lom_id = metadata_lom_id
    and lower(email) = signed_in_email
    and (auth_user_id is null or auth_user_id = auth.uid())
    and invitation_status in ('invited', 'active');

  if target_member_id is null then
    return null;
  end if;

  update public.members
  set auth_user_id = auth.uid(),
      invitation_status = 'active',
      activated_at = coalesce(activated_at, now()),
      updated_at = now()
  where id = target_member_id;

  if not was_active then
    insert into public.auth_invitation_audit_logs (member_id, actor_auth_user_id, action, metadata)
    values (target_member_id, auth.uid(), 'activated', jsonb_build_object('source', 'jc-app'));
  end if;

  return target_member_id;
end;
$$;

revoke all on function public.record_member_invitation(uuid, text) from public;
revoke all on function public.activate_current_member_invitation() from public;
grant execute on function public.record_member_invitation(uuid, text) to authenticated;
grant execute on function public.activate_current_member_invitation() to authenticated;
