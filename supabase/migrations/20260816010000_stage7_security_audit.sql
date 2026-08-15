-- FORM/24 — Stage 7 final security and authorization hardening
-- Run after the Stage 6 public-data/contributor migration.

-- Persist only safe external-link schemes. The application still performs
-- stricter URL parsing before writes and before rendering public links.
create or replace function public.is_safe_http_url(value text)
returns boolean
language sql
immutable
security invoker
set search_path = ''
as $$
  select value is not null
    and value ~* '^https?://[^[:space:][:cntrl:]]+$';
$$;

revoke all on function public.is_safe_http_url(text) from public;
grant execute on function public.is_safe_http_url(text) to anon, authenticated;

alter table public.works
  drop constraint if exists works_external_url_security_check,
  drop constraint if exists works_public_text_length_check;

alter table public.works
  add constraint works_external_url_security_check check (
    (
      type = 'link'
      and public.is_safe_http_url(external_url)
      and file_url is null
      and preview_url is null
    )
    or (
      type in ('pdf', 'ppt')
      and external_url is null
    )
  ),
  add constraint works_public_text_length_check check (
    char_length(title) between 1 and 200
    and char_length(slug) between 1 and 240
    and char_length(description) <= 5000
    and char_length(category) <= 120
    and (title_zh is null or char_length(title_zh) <= 200)
    and (title_en is null or char_length(title_en) <= 200)
    and (description_zh is null or char_length(description_zh) <= 5000)
    and (description_en is null or char_length(description_en) <= 5000)
    and (category_zh is null or char_length(category_zh) <= 120)
    and (category_en is null or char_length(category_en) <= 120)
  );

alter table public.work_contributors
  drop constraint if exists work_contributors_role_length_check;

alter table public.work_contributors
  add constraint work_contributors_role_length_check
  check (char_length(role) <= 160);

-- Make the base profile table explicitly unavailable to anonymous API calls.
-- Authenticated members retain their own-row RLS access; public pages use the
-- email-free public_profiles view.
revoke select on public.profiles from anon;
grant select on public.profiles to authenticated;

-- Storage writes must match one exact canonical path, a compatible work type,
-- and an allowed MIME type. Bucket limits enforce 10 MB for covers and 100 MB
-- for work files; the dashboard applies the stricter 50 MB PDF/preview limit.
-- Storage does not expose the final object size to INSERT RLS reliably, so the
-- helper must not reject an otherwise-valid upload when metadata.size is null.
-- The helper is
-- SECURITY DEFINER only so it can verify the owning work without broadening
-- table access; every successful branch still requires auth.uid() ownership.
create or replace function public.is_valid_owned_storage_upload(
  target_bucket text,
  target_name text,
  target_metadata jsonb
)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  target_work_id uuid;
  target_work_type text;
  target_filename text := storage.filename(target_name);
  target_mime text := lower(coalesce(target_metadata->>'mimetype', ''));
begin
  if current_user_id is null
    or coalesce(array_length(storage.foldername(target_name), 1), 0) <> 2
    or (storage.foldername(target_name))[1] <> current_user_id::text
  then
    return false;
  end if;

  begin
    target_work_id := (storage.foldername(target_name))[2]::uuid;
  exception when others then
    return false;
  end;

  select works.type
  into target_work_type
  from public.works
  where works.id = target_work_id
    and works.owner_id = current_user_id;

  if not found then
    return false;
  end if;

  if target_bucket = 'covers' then
    return target_name = current_user_id::text || '/' || target_work_id::text || '/' || target_filename
      and (
        (target_filename in ('cover.jpg', 'cover.jpeg') and target_mime = 'image/jpeg')
        or (target_filename = 'cover.png' and target_mime = 'image/png')
        or (target_filename = 'cover.webp' and target_mime = 'image/webp')
      );
  end if;

  if target_bucket <> 'works' then
    return false;
  end if;

  return target_name = current_user_id::text || '/' || target_work_id::text || '/' || target_filename
    and (
      (
        target_work_type = 'pdf'
        and target_filename = 'document.pdf'
        and target_mime = 'application/pdf'
      )
      or (
        target_work_type = 'ppt'
        and target_filename = 'presentation.ppt'
        and target_mime = 'application/vnd.ms-powerpoint'
      )
      or (
        target_work_type = 'ppt'
        and target_filename = 'presentation.pptx'
        and target_mime = 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      )
      or (
        target_work_type = 'ppt'
        and target_filename = 'preview.pdf'
        and target_mime = 'application/pdf'
      )
    );
end;
$$;

revoke all on function public.is_valid_owned_storage_upload(text, text, jsonb) from public;
grant execute on function public.is_valid_owned_storage_upload(text, text, jsonb) to authenticated;

-- Storage's upload endpoint inserts an object and then returns its metadata.
-- The return step is evaluated as SELECT, before owner_id is guaranteed to be
-- useful to an RLS policy. Authorize that narrow operation from the canonical
-- path and the owning work instead; object listing remains disallowed.
create or replace function public.is_owned_canonical_storage_object(
  target_bucket text,
  target_name text
)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  target_work_id uuid;
  target_work_type text;
  target_filename text := storage.filename(target_name);
begin
  if current_user_id is null
    or coalesce(array_length(storage.foldername(target_name), 1), 0) <> 2
    or (storage.foldername(target_name))[1] <> current_user_id::text
  then
    return false;
  end if;

  begin
    target_work_id := (storage.foldername(target_name))[2]::uuid;
  exception when others then
    return false;
  end;

  select works.type
  into target_work_type
  from public.works
  where works.id = target_work_id
    and works.owner_id = current_user_id;

  if not found then
    return false;
  end if;

  if target_bucket = 'covers' then
    return target_filename in ('cover.jpg', 'cover.jpeg', 'cover.png', 'cover.webp');
  end if;

  if target_bucket <> 'works' then
    return false;
  end if;

  return (target_work_type = 'pdf' and target_filename = 'document.pdf')
    or (
      target_work_type = 'ppt'
      and target_filename in ('presentation.ppt', 'presentation.pptx', 'preview.pdf')
    );
end;
$$;

revoke all on function public.is_owned_canonical_storage_object(text, text) from public;
grant execute on function public.is_owned_canonical_storage_object(text, text) to authenticated;

-- This helper returns only a boolean and prevents public Storage policies from
-- needing broad direct table permissions.
create or replace function public.is_published_work_file(target_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.works
    where works.published = true
      and (works.file_url = target_name or works.preview_url = target_name)
  );
$$;

revoke all on function public.is_published_work_file(text) from public;
grant execute on function public.is_published_work_file(text) to anon, authenticated;

-- Covers are intentionally public for display, but every mutation must be an
-- owned canonical cover object with validated metadata.
drop policy if exists "Members can read their own cover objects" on storage.objects;
create policy "Members can read their own cover objects"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'covers'
  and storage.allow_any_operation(array[
    'object.upload',
    'object.upload_update',
    'object.get_authenticated',
    'object.get_authenticated_info',
    'object.head_authenticated_info',
    'object.delete',
    'object.delete_many'
  ])
  and public.is_owned_canonical_storage_object(bucket_id, name)
);

drop policy if exists "Members can upload their own covers" on storage.objects;
create policy "Members can upload their own covers"
on storage.objects
for insert
to authenticated
with check (public.is_valid_owned_storage_upload(bucket_id, name, metadata));

drop policy if exists "Members can replace their own covers" on storage.objects;
create policy "Members can replace their own covers"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'covers'
  and owner_id = auth.uid()::text
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (public.is_valid_owned_storage_upload(bucket_id, name, metadata));

drop policy if exists "Members can delete their own covers" on storage.objects;
create policy "Members can delete their own covers"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'covers'
  and owner_id = auth.uid()::text
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Owners may use their own private files. Anonymous/authenticated visitors may
-- only perform the single-object signing operation for a path referenced by a
-- published work. Listing and direct authenticated downloads remain denied.
drop policy if exists "Owners and visitors can read allowed work files" on storage.objects;
drop policy if exists "Owners can access their own work files" on storage.objects;
create policy "Owners can access their own work files"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'works'
  and storage.allow_any_operation(array[
    'object.upload',
    'object.upload_update',
    'object.get_authenticated',
    'object.get_authenticated_info',
    'object.head_authenticated_info',
    'object.sign',
    'object.delete',
    'object.delete_many'
  ])
  and public.is_owned_canonical_storage_object(bucket_id, name)
);

drop policy if exists "Visitors can sign published work files" on storage.objects;
create policy "Visitors can sign published work files"
on storage.objects
for select
to anon, authenticated
using (
  bucket_id = 'works'
  and storage.allow_only_operation('object.sign')
  and public.is_published_work_file(name)
);

drop policy if exists "Members can upload their own work files" on storage.objects;
create policy "Members can upload their own work files"
on storage.objects
for insert
to authenticated
with check (public.is_valid_owned_storage_upload(bucket_id, name, metadata));

drop policy if exists "Members can replace their own work files" on storage.objects;
create policy "Members can replace their own work files"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'works'
  and owner_id = auth.uid()::text
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (public.is_valid_owned_storage_upload(bucket_id, name, metadata));

drop policy if exists "Members can delete their own work files" on storage.objects;
create policy "Members can delete their own work files"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'works'
  and owner_id = auth.uid()::text
  and (storage.foldername(name))[1] = auth.uid()::text
);
