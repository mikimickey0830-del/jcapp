-- First-login auto-link for an existing member record.
-- This function intentionally exposes no member data: it links only when the
-- authenticated email maps to exactly one currently unlinked member.
create or replace function public.link_current_member_by_email()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_member_id uuid;
  matching_members integer;
  signed_in_email text;
begin
  signed_in_email := lower(trim(coalesce(auth.jwt() ->> 'email', '')));
  if signed_in_email = '' then
    return null;
  end if;

  select count(*), (array_agg(id))[1]
    into matching_members, target_member_id
  from public.members
  where lower(email) = signed_in_email
    and auth_user_id is null;

  if matching_members <> 1 then
    return null;
  end if;

  update public.members
  set auth_user_id = auth.uid(),
      invitation_status = 'active',
      activated_at = coalesce(activated_at, now()),
      updated_at = now()
  where id = target_member_id
    and auth_user_id is null;

  return target_member_id;
end;
$$;

revoke all on function public.link_current_member_by_email() from public;
grant execute on function public.link_current_member_by_email() to authenticated;
