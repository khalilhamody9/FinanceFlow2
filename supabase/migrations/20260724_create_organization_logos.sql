insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'organization-logos',
  'organization-logos',
  true,
  2097152,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Organization members can upload their logo" on storage.objects;
create policy "Organization members can upload their logo"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'organization-logos'
  and (storage.foldername(name))[1] = (
    select organization_id::text from public.profiles where id = auth.uid() and is_active = true
  )
);

drop policy if exists "Organization members can update their logo" on storage.objects;
create policy "Organization members can update their logo"
on storage.objects for update to authenticated
using (רוצה
  bucket_id = 'organization-logos'
  and (storage.foldername(name))[1] = (
    select organization_id::text from public.profiles where id = auth.uid() and is_active = true
  )
)
with check (
  bucket_id = 'organization-logos'
  and (storage.foldername(name))[1] = (
    select organization_id::text from public.profiles where id = auth.uid() and is_active = true
  )
);

drop policy if exists "Organization logos are publicly readable" on storage.objects;
create policy "Organization logos are publicly readable"
on storage.objects for select to public
using (bucket_id = 'organization-logos');

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
end;
$$;

revoke all on function public.set_organization_logo(text) from public;
grant execute on function public.set_organization_logo(text) to authenticated;
