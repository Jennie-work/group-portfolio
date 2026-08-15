-- FORM/24 — Stage 5 Supabase Storage uploads
-- Run after the Stage 4 work-management migration.
-- Files are stored under {auth-user-id}/{work-id}/ inside each bucket.

-- Stage 5 limits: covers 10 MB; documents/presentations up to 100 MB.
update storage.buckets
set
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'covers';

update storage.buckets
set
  public = false,
  file_size_limit = 104857600,
  allowed_mime_types = array[
    'application/pdf',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ]
where id = 'works';

-- Published work metadata is public. Owners retain access to drafts through
-- the Stage 3 policy.
drop policy if exists "Anyone can read published works" on public.works;
create policy "Anyone can read published works"
on public.works
for select
to anon, authenticated
using (published = true);

-- Keep database object paths inside the owning member/work folder even when a
-- caller writes directly through the API instead of using the dashboard UI.
drop policy if exists "Members can create their own works" on public.works;
create policy "Members can create their own works"
on public.works
for insert
to authenticated
with check (
  owner_id = auth.uid()
  and (cover_url is null or cover_url like owner_id::text || '/' || id::text || '/cover.%')
  and (
    (type = 'link' and file_url is null and preview_url is null)
    or (type = 'pdf' and (file_url is null or file_url = owner_id::text || '/' || id::text || '/document.pdf') and preview_url is null)
    or (
      type = 'ppt'
      and (file_url is null or file_url in (
        owner_id::text || '/' || id::text || '/presentation.ppt',
        owner_id::text || '/' || id::text || '/presentation.pptx'
      ))
      and (preview_url is null or preview_url = owner_id::text || '/' || id::text || '/preview.pdf')
    )
  )
);

drop policy if exists "Members can update their own works" on public.works;
create policy "Members can update their own works"
on public.works
for update
to authenticated
using (owner_id = auth.uid())
with check (
  owner_id = auth.uid()
  and (cover_url is null or cover_url like owner_id::text || '/' || id::text || '/cover.%')
  and (
    (type = 'link' and file_url is null and preview_url is null)
    or (type = 'pdf' and (file_url is null or file_url = owner_id::text || '/' || id::text || '/document.pdf') and preview_url is null)
    or (
      type = 'ppt'
      and (file_url is null or file_url in (
        owner_id::text || '/' || id::text || '/presentation.ppt',
        owner_id::text || '/' || id::text || '/presentation.pptx'
      ))
      and (preview_url is null or preview_url = owner_id::text || '/' || id::text || '/preview.pdf')
    )
  )
);

-- Cover uploads. The bucket is public for reads, while all mutations are
-- restricted to the signed-in member's own top-level folder and a work they own.
drop policy if exists "Members can read their own cover objects" on storage.objects;
create policy "Members can read their own cover objects"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'covers'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Members can upload their own covers" on storage.objects;
create policy "Members can upload their own covers"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'covers'
  and (storage.foldername(name))[1] = auth.uid()::text
  and exists (
    select 1
    from public.works
    where works.id::text = (storage.foldername(name))[2]
      and works.owner_id = auth.uid()
  )
);

drop policy if exists "Members can replace their own covers" on storage.objects;
create policy "Members can replace their own covers"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'covers'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'covers'
  and (storage.foldername(name))[1] = auth.uid()::text
  and exists (
    select 1
    from public.works
    where works.id::text = (storage.foldername(name))[2]
      and works.owner_id = auth.uid()
  )
);

drop policy if exists "Members can delete their own covers" on storage.objects;
create policy "Members can delete their own covers"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'covers'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Private work documents. Public visitors can read only object paths attached
-- to published works; the application converts those reads into short-lived
-- signed URLs. Owners can always read files in their own folder.
drop policy if exists "Owners and visitors can read allowed work files" on storage.objects;
create policy "Owners and visitors can read allowed work files"
on storage.objects
for select
to anon, authenticated
using (
  bucket_id = 'works'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or exists (
      select 1
      from public.works
      where works.published = true
        and (works.file_url = name or works.preview_url = name)
    )
  )
);

drop policy if exists "Members can upload their own work files" on storage.objects;
create policy "Members can upload their own work files"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'works'
  and (storage.foldername(name))[1] = auth.uid()::text
  and exists (
    select 1
    from public.works
    where works.id::text = (storage.foldername(name))[2]
      and works.owner_id = auth.uid()
  )
);

drop policy if exists "Members can replace their own work files" on storage.objects;
create policy "Members can replace their own work files"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'works'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'works'
  and (storage.foldername(name))[1] = auth.uid()::text
  and exists (
    select 1
    from public.works
    where works.id::text = (storage.foldername(name))[2]
      and works.owner_id = auth.uid()
  )
);

drop policy if exists "Members can delete their own work files" on storage.objects;
create policy "Members can delete their own work files"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'works'
  and (storage.foldername(name))[1] = auth.uid()::text
);
