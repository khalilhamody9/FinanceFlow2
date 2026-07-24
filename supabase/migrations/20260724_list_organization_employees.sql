create or replace function public.get_organization_employees()
returns table (
  id uuid,
  full_name text,
  role text
)
language sql
security definer
set search_path = public
stable
as $$
  select employee.id, employee.full_name, employee.role::text
  from public.profiles as employee
  where employee.organization_id = (
    select requester.organization_id
    from public.profiles as requester
    where requester.id = auth.uid()
      and requester.is_active = true
      and upper(requester.role::text) in ('ADMIN', 'MANAGER')
  )
  and employee.is_active = true
  order by employee.full_name asc nulls last;
$$;

revoke all on function public.get_organization_employees() from public;
grant execute on function public.get_organization_employees() to authenticated;
