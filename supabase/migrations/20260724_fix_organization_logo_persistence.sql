create or replace function public.set_organization_logo(p_logo_url text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_organization_id uuid;
begin
  select organization_id into current_organization_id
  from public.profiles
  where id = auth.uid() and is_active = true;

  if current_organization_id is null then
    raise exception 'No active organization was found for this user';
  end if;

  update public.organizations
  set logo_url = p_logo_url
  where id = current_organization_id;

  if not found then
    raise exception 'Organization was not found';
  end if;
end;
$$;

revoke all on function public.set_organization_logo(text) from public;
grant execute on function public.set_organization_logo(text) to authenticated;

notify pgrst, 'reload schema';
