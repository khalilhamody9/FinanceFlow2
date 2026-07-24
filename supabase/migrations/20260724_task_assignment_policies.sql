create or replace function public.current_user_organization_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select organization_id
  from public.profiles
  where id = auth.uid() and is_active = true
  limit 1;
$$;

create or replace function public.current_user_is_manager()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (
      select upper(role::text) in ('ADMIN', 'MANAGER')
      from public.profiles
      where id = auth.uid() and is_active = true
      limit 1
    ),
    false
  );
$$;

create or replace function public.is_active_member_of_current_organization(profile_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = profile_id
      and is_active = true
      and organization_id = public.current_user_organization_id()
  );
$$;

revoke all on function public.current_user_organization_id() from public;
revoke all on function public.current_user_is_manager() from public;
revoke all on function public.is_active_member_of_current_organization(uuid) from public;
grant execute on function public.current_user_organization_id() to authenticated;
grant execute on function public.current_user_is_manager() to authenticated;
grant execute on function public.is_active_member_of_current_organization(uuid) to authenticated;

alter table public.tasks enable row level security;

drop policy if exists "Members can view relevant tasks" on public.tasks;
create policy "Members can view relevant tasks"
on public.tasks for select to authenticated
using (
  organization_id = public.current_user_organization_id()
  and (
    public.current_user_is_manager()
    or assigned_to = auth.uid()
  )
);

drop policy if exists "Members can create permitted tasks" on public.tasks;
create policy "Members can create permitted tasks"
on public.tasks for insert to authenticated
with check (
  organization_id = public.current_user_organization_id()
  and public.is_active_member_of_current_organization(assigned_to)
  and (
    public.current_user_is_manager()
    or assigned_to = auth.uid()
  )
);

drop policy if exists "Members can update relevant tasks" on public.tasks;
create policy "Members can update relevant tasks"
on public.tasks for update to authenticated
using (
  organization_id = public.current_user_organization_id()
  and (public.current_user_is_manager() or assigned_to = auth.uid())
)
with check (
  organization_id = public.current_user_organization_id()
  and (public.current_user_is_manager() or assigned_to = auth.uid())
);

drop policy if exists "Managers can delete organization tasks" on public.tasks;
create policy "Managers can delete organization tasks"
on public.tasks for delete to authenticated
using (
  organization_id = public.current_user_organization_id()
  and public.current_user_is_manager()
);

grant select, insert, update, delete on public.tasks to authenticated;
