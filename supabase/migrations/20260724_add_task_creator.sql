alter table public.tasks
add column if not exists created_by uuid;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'tasks_created_by_fkey'
  ) then
    alter table public.tasks
      add constraint tasks_created_by_fkey
      foreign key (created_by) references public.profiles(id) on delete set null;
  end if;
end $$;

update public.tasks as task
set created_by = coalesce(
  (
    select history.performed_by
    from public.task_history as history
    where history.task_id = task.id and history.action = 'created'
    order by history.created_at asc
    limit 1
  ),
  task.assigned_to
)
where task.created_by is null;

create index if not exists tasks_created_by_idx on public.tasks(created_by);

drop policy if exists "Members can create permitted tasks" on public.tasks;
create policy "Members can create permitted tasks"
on public.tasks for insert to authenticated
with check (
  organization_id = public.current_user_organization_id()
  and created_by = auth.uid()
  and public.is_active_member_of_current_organization(assigned_to)
  and (
    public.current_user_is_manager()
    or assigned_to = auth.uid()
  )
);
