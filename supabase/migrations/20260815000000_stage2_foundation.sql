-- FORM/24 — Stage 2 Supabase foundation
-- Run this migration with the Supabase CLI, or paste it into the Supabase SQL Editor.
-- RLS policies, Auth hooks, uploads, and application UI are intentionally deferred.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text not null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  role text not null default '',
  bio text not null default '',
  avatar_url text,
  skills text[] not null default '{}',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.works (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text not null default '',
  year smallint not null check (year between 1900 and 2100),
  category text not null default '',
  type text not null check (type in ('link', 'pdf', 'ppt')),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  -- These fields store Storage object paths in Stage 2; signed/public URLs are generated later.
  cover_url text,
  file_url text,
  preview_url text,
  external_url text,
  is_group_work boolean not null default false,
  published boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.work_contributors (
  id uuid primary key default gen_random_uuid(),
  work_id uuid not null references public.works(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  unique (work_id, profile_id)
);

create index if not exists works_owner_id_idx on public.works(owner_id);
create index if not exists works_public_listing_idx on public.works(published, is_group_work, created_at desc);
create index if not exists work_contributors_profile_id_idx on public.work_contributors(profile_id);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

drop trigger if exists works_set_updated_at on public.works;
create trigger works_set_updated_at
before update on public.works
for each row execute procedure public.set_updated_at();

-- Storage bucket design
-- works/{user-id}/{work-id}/original.pdf
-- works/{user-id}/{work-id}/presentation.pptx
-- works/{user-id}/{work-id}/preview.pdf
-- covers/{user-id}/{work-id}/cover.jpg
-- avatars/{user-id}/avatar.jpg
-- Bucket policies are deliberately deferred to the later RLS/security stage.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'works',
    'works',
    false,
    26214400,
    array[
      'application/pdf',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ]
  ),
  (
    'covers',
    'covers',
    true,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'avatars',
    'avatars',
    true,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp']
  )
on conflict (id) do update set
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Stage 9: enable row-level security and add table/storage policies.
