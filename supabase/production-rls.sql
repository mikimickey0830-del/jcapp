-- Production RLS. Apply after all production users have auth_user_id links.
-- This table records IDs created by the development-only test-data utility.
-- Keeping its creation here makes this RLS script safe when applied to older projects.
create table if not exists public.development_test_data_runs (
  id uuid primary key default gen_random_uuid(),
  lom_id uuid not null references public.loms(id) on delete cascade,
  created_by_member_id uuid not null references public.members(id) on delete restrict,
  record_ids jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists idx_development_test_data_runs_lom_active
  on public.development_test_data_runs(lom_id, deleted_at);
alter table public.development_test_data_runs enable row level security;

create or replace function public.current_member_id()
returns uuid language sql stable security definer set search_path = public
as $$ select id from public.members where auth_user_id = auth.uid() limit 1 $$;

create or replace function public.current_lom_id()
returns uuid language sql stable security definer set search_path = public
as $$ select lom_id from public.members where auth_user_id = auth.uid() limit 1 $$;

create or replace function public.can_manage_lom(target_lom_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.annual_member_assignments a
    join public.fiscal_years y on y.id = a.fiscal_year_id
    where a.member_id = public.current_member_id()
      and a.lom_id = target_lom_id and a.is_active = true
      and a.role in ('admin', 'president', 'secretary')
      and (y.is_current = true or y.status = 'current')
  )
$$;

revoke all on function public.current_member_id() from public;
revoke all on function public.current_lom_id() from public;
revoke all on function public.can_manage_lom(uuid) from public;
grant execute on function public.current_member_id() to authenticated;
grant execute on function public.current_lom_id() to authenticated;
grant execute on function public.can_manage_lom(uuid) to authenticated;

-- The initial email-based link is implemented in a security-definer function.
-- See auth-auto-link-migration.sql when this policy file was already applied.
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

-- Invite status and activation use scoped security-definer functions. Their
-- full definitions are also available in auth-invitation-rls-migration.sql.
create or replace function public.record_member_invitation(p_member_id uuid, p_action text)
returns boolean language plpgsql security definer set search_path = public
as $$
declare target_lom_id uuid; now_at timestamptz := now();
begin
  if p_action not in ('invited', 'resent', 'failed') then return false; end if;
  select lom_id into target_lom_id from public.members where id = p_member_id;
  if target_lom_id is null or not public.can_manage_lom(target_lom_id) then return false; end if;
  if p_action in ('invited', 'resent') then
    update public.members set invitation_status = 'invited',
      invited_at = case when invitation_status = 'invited' then invited_at else now_at end,
      invitation_last_sent_at = now_at, updated_at = now_at
    where id = p_member_id and auth_user_id is null;
  else
    update public.members set invitation_status = 'failed', updated_at = now_at
    where id = p_member_id and auth_user_id is null;
  end if;
  if not found then return false; end if;
  insert into public.auth_invitation_audit_logs (member_id, actor_auth_user_id, action, metadata)
  values (p_member_id, auth.uid(), p_action, jsonb_build_object('source', 'jc-app'));
  return true;
end;
$$;

create or replace function public.activate_current_member_invitation()
returns uuid language plpgsql security definer set search_path = public
as $$
declare
  target_member_id uuid; metadata_member_id uuid; metadata_lom_id uuid;
  signed_in_email text; was_active boolean;
begin
  signed_in_email := lower(trim(coalesce(auth.jwt() ->> 'email', '')));
  if signed_in_email = '' then return null; end if;
  begin
    metadata_member_id := (auth.jwt() -> 'user_metadata' ->> 'member_id')::uuid;
    metadata_lom_id := (auth.jwt() -> 'user_metadata' ->> 'lom_id')::uuid;
  exception when invalid_text_representation then return null;
  end;
  select id, invitation_status = 'active' into target_member_id, was_active
  from public.members
  where id = metadata_member_id and lom_id = metadata_lom_id
    and lower(email) = signed_in_email
    and (auth_user_id is null or auth_user_id = auth.uid())
    and invitation_status in ('invited', 'active');
  if target_member_id is null then return null; end if;
  update public.members set auth_user_id = auth.uid(), invitation_status = 'active',
    activated_at = coalesce(activated_at, now()), updated_at = now()
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

-- Initial-password lifecycle. Password values are never written to Postgres;
-- only the one-way "must change" state and an audit event are recorded here.
alter table public.members add column if not exists must_change_password boolean not null default false;
alter table public.auth_invitation_audit_logs drop constraint if exists auth_invitation_audit_logs_action_check;
alter table public.auth_invitation_audit_logs add constraint auth_invitation_audit_logs_action_check
  check (action in ('invited', 'resent', 'activated', 'failed', 'account_issued', 'initial_password_reissued', 'initial_password_changed'));

create or replace function public.complete_initial_password_change()
returns boolean language plpgsql security definer set search_path = public
as $$
declare target_member_id uuid;
begin
  if auth.uid() is null then return false; end if;
  update public.members set must_change_password = false, updated_at = now()
  where auth_user_id = auth.uid() and must_change_password = true
  returning id into target_member_id;
  if target_member_id is null then return false; end if;
  insert into public.auth_invitation_audit_logs (member_id, actor_auth_user_id, action, metadata)
  values (target_member_id, auth.uid(), 'initial_password_changed', jsonb_build_object('source', 'jc-app'));
  return true;
end;
$$;

create or replace function public.link_issued_member_account(p_member_id uuid, p_auth_user_id uuid, p_action text)
returns boolean language plpgsql security definer set search_path = public
as $$
declare target_lom_id uuid;
begin
  if auth.uid() is null or p_action not in ('account_issued', 'initial_password_reissued') then return false; end if;
  select lom_id into target_lom_id from public.members where id = p_member_id;
  if target_lom_id is null or not public.can_manage_lom(target_lom_id) then return false; end if;
  if p_action = 'account_issued' then
    update public.members set auth_user_id = p_auth_user_id, invitation_status = 'active',
      activated_at = coalesce(activated_at, now()), must_change_password = true, updated_at = now()
    where id = p_member_id and auth_user_id is null;
  else
    update public.members set must_change_password = true, updated_at = now()
    where id = p_member_id and auth_user_id = p_auth_user_id;
  end if;
  if not found then return false; end if;
  insert into public.auth_invitation_audit_logs (member_id, actor_auth_user_id, action, metadata)
  values (p_member_id, auth.uid(), p_action, jsonb_build_object('source', 'jc-app'));
  return true;
end;
$$;

create or replace function public.record_account_credential_event(p_member_id uuid, p_action text)
returns boolean language plpgsql security definer set search_path = public
as $$
declare target_lom_id uuid;
begin
  if auth.uid() is null or p_action not in ('account_issued', 'initial_password_reissued') then return false; end if;
  select lom_id into target_lom_id from public.members where id = p_member_id;
  if target_lom_id is null or not public.can_manage_lom(target_lom_id) then return false; end if;
  insert into public.auth_invitation_audit_logs (member_id, actor_auth_user_id, action, metadata)
  values (p_member_id, auth.uid(), p_action, jsonb_build_object('source', 'jc-app'));
  return true;
end;
$$;

revoke all on function public.complete_initial_password_change() from public;
revoke all on function public.link_issued_member_account(uuid, uuid, text) from public;
revoke all on function public.record_account_credential_event(uuid, text) from public;
grant execute on function public.complete_initial_password_change() to authenticated;
grant execute on function public.link_issued_member_account(uuid, uuid, text) to authenticated;
grant execute on function public.record_account_credential_event(uuid, text) to authenticated;

revoke all on all tables in schema public from anon;
grant select on all tables in schema public to authenticated;

drop policy if exists "dev_select_loms" on public.loms;
drop policy if exists "dev_select_fiscal_years" on public.fiscal_years;
drop policy if exists "dev_select_members" on public.members;
drop policy if exists "dev_select_committees" on public.committees;
drop policy if exists "dev_select_positions" on public.positions;
drop policy if exists "dev_select_annual_member_assignments" on public.annual_member_assignments;
drop policy if exists "dev_select_committee_memberships" on public.committee_memberships;
drop policy if exists "dev_select_events" on public.events;
drop policy if exists "dev_select_attendance_responses" on public.attendance_responses;
drop policy if exists "dev_select_documents" on public.documents;
drop policy if exists "dev_select_notifications" on public.notifications;
drop policy if exists "dev_select_announcements" on public.announcements;
drop policy if exists "dev_update_members" on public.members;
drop policy if exists "self_or_manager_update_members" on public.members;
drop policy if exists "self_update_member_profile" on public.members;
drop policy if exists "manager_update_members" on public.members;
drop policy if exists "dev_insert_members" on public.members;
drop policy if exists "dev_insert_fiscal_years" on public.fiscal_years;
drop policy if exists "dev_insert_committees" on public.committees;
drop policy if exists "dev_update_committees" on public.committees;
drop policy if exists "dev_insert_positions" on public.positions;
drop policy if exists "dev_insert_annual_member_assignments" on public.annual_member_assignments;
drop policy if exists "dev_update_annual_member_assignments" on public.annual_member_assignments;
drop policy if exists "dev_insert_committee_memberships" on public.committee_memberships;
drop policy if exists "dev_update_committee_memberships" on public.committee_memberships;
drop policy if exists "dev_insert_events" on public.events;
drop policy if exists "dev_update_events" on public.events;
drop policy if exists "dev_insert_attendance_responses" on public.attendance_responses;
drop policy if exists "dev_update_attendance_responses" on public.attendance_responses;
drop policy if exists "dev_insert_announcements" on public.announcements;
drop policy if exists "dev_update_announcements" on public.announcements;
drop policy if exists "lom_read_loms" on public.loms;
drop policy if exists "lom_read_years" on public.fiscal_years;
drop policy if exists "lom_read_members" on public.members;
drop policy if exists "lom_read_committees" on public.committees;
drop policy if exists "lom_read_positions" on public.positions;
drop policy if exists "lom_read_assignments" on public.annual_member_assignments;
drop policy if exists "lom_read_memberships" on public.committee_memberships;
drop policy if exists "lom_read_events" on public.events;
drop policy if exists "lom_read_documents" on public.documents;
drop policy if exists "lom_read_announcements" on public.announcements;
drop policy if exists "self_or_manager_read_attendance" on public.attendance_responses;
drop policy if exists "self_or_manager_insert_attendance" on public.attendance_responses;
drop policy if exists "self_or_manager_update_attendance" on public.attendance_responses;
drop policy if exists "self_or_manager_read_notifications" on public.notifications;
drop policy if exists "manager_write_years" on public.fiscal_years;
drop policy if exists "manager_write_committees" on public.committees;
drop policy if exists "manager_write_positions" on public.positions;
drop policy if exists "manager_write_assignments" on public.annual_member_assignments;
drop policy if exists "manager_write_memberships" on public.committee_memberships;
drop policy if exists "manager_write_events" on public.events;
drop policy if exists "manager_write_documents" on public.documents;
drop policy if exists "manager_write_notifications" on public.notifications;
drop policy if exists "manager_write_announcements" on public.announcements;
drop policy if exists "dev_select_development_test_data_runs" on public.development_test_data_runs;
drop policy if exists "dev_insert_development_test_data_runs" on public.development_test_data_runs;
drop policy if exists "dev_update_development_test_data_runs" on public.development_test_data_runs;
drop policy if exists "manager_read_development_test_data_runs" on public.development_test_data_runs;
drop policy if exists "manager_write_development_test_data_runs" on public.development_test_data_runs;

create policy "lom_read_loms" on public.loms for select to authenticated using (id = public.current_lom_id());
create policy "lom_read_years" on public.fiscal_years for select to authenticated using (lom_id = public.current_lom_id());
create policy "lom_read_members" on public.members for select to authenticated using (lom_id = public.current_lom_id());
-- Column grants prevent members from changing auth_user_id, lom_id, invitation
-- state, or timestamps. Managers still pass the row-level can_manage_lom check.
revoke update on public.members from authenticated;
grant update (last_name, first_name, last_name_kana, first_name_kana, email, phone, joined_year, status, updated_at)
  on public.members to authenticated;
create policy "self_update_member_profile" on public.members for update to authenticated
  using (id = public.current_member_id())
  with check (id = public.current_member_id() and lom_id = public.current_lom_id() and auth_user_id = auth.uid() and invitation_status = 'active');
create policy "manager_update_members" on public.members for update to authenticated
  using (public.can_manage_lom(lom_id))
  with check (public.can_manage_lom(lom_id));
drop policy if exists "manager_insert_members" on public.members;
create policy "manager_insert_members" on public.members for insert to authenticated
  with check (public.can_manage_lom(lom_id));
create policy "lom_read_committees" on public.committees for select to authenticated using (lom_id = public.current_lom_id());
create policy "lom_read_positions" on public.positions for select to authenticated using (lom_id = public.current_lom_id());
create policy "lom_read_assignments" on public.annual_member_assignments for select to authenticated using (lom_id = public.current_lom_id());
create policy "lom_read_memberships" on public.committee_memberships for select to authenticated using (lom_id = public.current_lom_id());
create policy "lom_read_events" on public.events for select to authenticated using (lom_id = public.current_lom_id());
create policy "lom_read_documents" on public.documents for select to authenticated using (lom_id = public.current_lom_id());
create policy "lom_read_announcements" on public.announcements for select to authenticated using (lom_id = public.current_lom_id());

create policy "self_or_manager_read_attendance" on public.attendance_responses for select to authenticated
  using (member_id = public.current_member_id() or public.can_manage_lom(lom_id));
create policy "self_or_manager_insert_attendance" on public.attendance_responses for insert to authenticated
  with check (member_id = public.current_member_id() or public.can_manage_lom(lom_id));
create policy "self_or_manager_update_attendance" on public.attendance_responses for update to authenticated
  using (member_id = public.current_member_id() or public.can_manage_lom(lom_id))
  with check (member_id = public.current_member_id() or public.can_manage_lom(lom_id));
create policy "self_or_manager_read_notifications" on public.notifications for select to authenticated
  using (member_id = public.current_member_id() or public.can_manage_lom(lom_id));

create policy "manager_write_years" on public.fiscal_years for all to authenticated
  using (public.can_manage_lom(lom_id)) with check (public.can_manage_lom(lom_id));
create policy "manager_write_committees" on public.committees for all to authenticated
  using (public.can_manage_lom(lom_id)) with check (public.can_manage_lom(lom_id));
create policy "manager_write_positions" on public.positions for all to authenticated
  using (public.can_manage_lom(lom_id)) with check (public.can_manage_lom(lom_id));
create policy "manager_write_assignments" on public.annual_member_assignments for all to authenticated
  using (public.can_manage_lom(lom_id)) with check (public.can_manage_lom(lom_id));
create policy "manager_write_memberships" on public.committee_memberships for all to authenticated
  using (public.can_manage_lom(lom_id)) with check (public.can_manage_lom(lom_id));
create policy "manager_write_events" on public.events for all to authenticated
  using (public.can_manage_lom(lom_id)) with check (public.can_manage_lom(lom_id));
create policy "manager_write_documents" on public.documents for all to authenticated
  using (public.can_manage_lom(lom_id)) with check (public.can_manage_lom(lom_id));
create policy "manager_write_notifications" on public.notifications for all to authenticated
  using (public.can_manage_lom(lom_id)) with check (public.can_manage_lom(lom_id));
create policy "manager_write_announcements" on public.announcements for all to authenticated
  using (public.can_manage_lom(lom_id)) with check (public.can_manage_lom(lom_id));
create policy "manager_read_development_test_data_runs" on public.development_test_data_runs for select to authenticated
  using (public.can_manage_lom(lom_id));
create policy "manager_write_development_test_data_runs" on public.development_test_data_runs for all to authenticated
  using (public.can_manage_lom(lom_id)) with check (public.can_manage_lom(lom_id));

grant insert on public.members to authenticated;
grant insert, update on public.fiscal_years, public.committees,
  public.positions, public.annual_member_assignments, public.committee_memberships,
  public.events, public.attendance_responses, public.documents, public.notifications,
  public.announcements, public.development_test_data_runs to authenticated;
