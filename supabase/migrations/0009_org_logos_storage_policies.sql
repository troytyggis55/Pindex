-- ============================================================
-- Storage: org-logos bucket
-- Paths are structured as: {org_id}.jpg
-- Write access: the org's admin, or any superadmin.
-- ============================================================
insert into storage.buckets (id, name, public)
  values ('org-logos', 'org-logos', true)
  on conflict (id) do nothing;

create policy "org-logos: public read"
  on storage.objects for select
  using (bucket_id = 'org-logos');

create policy "org-logos: admin upload"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'org-logos'
    and (
      exists (
        select 1 from organizations o
        where o.id::text = split_part(objects.name, '.', 1)
          and o.admin_user_id = auth.uid()
      )
      or exists (select 1 from profiles where id = auth.uid() and role = 'superadmin')
    )
  );

create policy "org-logos: admin update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'org-logos'
    and (
      exists (
        select 1 from organizations o
        where o.id::text = split_part(objects.name, '.', 1)
          and o.admin_user_id = auth.uid()
      )
      or exists (select 1 from profiles where id = auth.uid() and role = 'superadmin')
    )
  )
  with check (
    bucket_id = 'org-logos'
    and (
      exists (
        select 1 from organizations o
        where o.id::text = split_part(objects.name, '.', 1)
          and o.admin_user_id = auth.uid()
      )
      or exists (select 1 from profiles where id = auth.uid() and role = 'superadmin')
    )
  );

create policy "org-logos: admin delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'org-logos'
    and (
      exists (
        select 1 from organizations o
        where o.id::text = split_part(objects.name, '.', 1)
          and o.admin_user_id = auth.uid()
      )
      or exists (select 1 from profiles where id = auth.uid() and role = 'superadmin')
    )
  );
