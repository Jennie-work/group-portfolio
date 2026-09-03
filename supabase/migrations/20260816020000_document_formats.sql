-- FORM/24 — Generic document uploads
-- Run this after 20260816010000_stage7_security_audit.sql.
-- Existing PDF/PPT rows are retained and migrated to the new `file` type.
-- Legacy presentation-preview paths are cleared because the new generic file
-- model has one original file per work; their original PPT/PPTX files remain.

alter table public.works
  drop constraint if exists works_type_check,
  drop constraint if exists works_file_contract_check,
  drop constraint if exists works_external_url_security_check;

update public.works
set type = 'file', preview_url = null
where type in ('pdf', 'ppt');

alter table public.works
  add constraint works_type_check check (type in ('link', 'file')),
  add constraint works_external_url_security_check check (
    (type = 'link' and public.is_safe_http_url(external_url) and file_url is null and preview_url is null)
    or (type = 'file' and external_url is null and preview_url is null)
  );

update storage.buckets
set
  file_size_limit = 104857600,
  allowed_mime_types = array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
where id = 'works';

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
  then return false;
  end if;

  begin
    target_work_id := (storage.foldername(target_name))[2]::uuid;
  exception when others then return false;
  end;

  select works.type into target_work_type
  from public.works
  where works.id = target_work_id and works.owner_id = current_user_id;

  if not found then return false;
  end if;

  if target_bucket = 'covers' then
    return target_name = current_user_id::text || '/' || target_work_id::text || '/' || target_filename
      and ((target_filename in ('cover.jpg', 'cover.jpeg') and target_mime = 'image/jpeg')
        or (target_filename = 'cover.png' and target_mime = 'image/png')
        or (target_filename = 'cover.webp' and target_mime = 'image/webp'));
  end if;

  if target_bucket <> 'works' or target_work_type <> 'file' then return false;
  end if;

  return target_name = current_user_id::text || '/' || target_work_id::text || '/' || target_filename
    and (
      (target_filename = 'document.pdf' and target_mime = 'application/pdf')
      or (target_filename = 'document.doc' and target_mime = 'application/msword')
      or (target_filename = 'document.docx' and target_mime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
      or (target_filename = 'document.xls' and target_mime = 'application/vnd.ms-excel')
      or (target_filename = 'document.xlsx' and target_mime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      or (target_filename = 'document.csv' and target_mime = 'text/csv')
      or (target_filename = 'document.ppt' and target_mime = 'application/vnd.ms-powerpoint')
      or (target_filename = 'document.pptx' and target_mime = 'application/vnd.openxmlformats-officedocument.presentationml.presentation')
      or (target_filename in ('document.jpg', 'document.jpeg') and target_mime = 'image/jpeg')
      or (target_filename = 'document.png' and target_mime = 'image/png')
      or (target_filename = 'document.webp' and target_mime = 'image/webp')
    );
end;
$$;

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
  then return false;
  end if;

  begin
    target_work_id := (storage.foldername(target_name))[2]::uuid;
  exception when others then return false;
  end;

  select works.type into target_work_type
  from public.works
  where works.id = target_work_id and works.owner_id = current_user_id;

  if not found then return false;
  end if;

  if target_bucket = 'covers' then
    return target_filename in ('cover.jpg', 'cover.jpeg', 'cover.png', 'cover.webp');
  end if;

  return target_bucket = 'works'
    and target_work_type = 'file'
    and target_filename in (
      'document.pdf', 'document.doc', 'document.docx', 'document.xls', 'document.xlsx',
      'document.csv', 'document.ppt', 'document.pptx', 'document.jpg', 'document.jpeg',
      'document.png', 'document.webp'
    );
end;
$$;
