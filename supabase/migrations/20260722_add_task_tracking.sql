create table if not exists public.task_history (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete set null,
  task_title text not null,
  action text not null check (action in ('created', 'completed', 'reopened', 'updated', 'deleted')),
  details text,
  performed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists tasks_due_date_idx on public.tasks (organization_id, due_date);
create index if not exists task_history_org_created_idx on public.task_history (organization_id, created_at desc);

alter table public.task_history enable row level security;
drop policy if exists "organization members manage task history" on public.task_history;
create policy "organization members manage task history" on public.task_history
  for all to authenticated
  using (organization_id in (select organization_id from public.profiles where id = auth.uid() and is_active = true))
  with check (organization_id in (select organization_id from public.profiles where id = auth.uid() and is_active = true));

grant select, insert, update, delete on public.task_history to authenticated;
