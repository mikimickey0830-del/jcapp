-- Production RLS. Apply after all production users have auth_user_id links.
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

grant insert, update on public.members, public.fiscal_years, public.committees,
  public.positions, public.annual_member_assignments, public.committee_memberships,
  public.events, public.attendance_responses, public.documents, public.notifications,
  public.announcements to authenticated;
