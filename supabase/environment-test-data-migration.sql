-- Development test-data tracking.
-- Apply after schema.sql and production-rls.sql. This migration is safe to rerun.

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

drop policy if exists "manager_read_development_test_data_runs" on public.development_test_data_runs;
drop policy if exists "manager_write_development_test_data_runs" on public.development_test_data_runs;

create policy "manager_read_development_test_data_runs" on public.development_test_data_runs for select to authenticated
  using (public.can_manage_lom(lom_id));
create policy "manager_write_development_test_data_runs" on public.development_test_data_runs for all to authenticated
  using (public.can_manage_lom(lom_id)) with check (public.can_manage_lom(lom_id));

grant select, insert, update on public.development_test_data_runs to authenticated;
