-- FORM/24 — Stage 6 public portfolio data and contributor relationships
-- Run after the Stage 5 Storage migration.

-- Optional bilingual profile fields. Existing single-language values are kept
-- as fallbacks so current profiles remain visible immediately.
alter table public.profiles
  add column if not exists role_zh text,
  add column if not exists role_en text,
  add column if not exists bio_zh text,
  add column if not exists bio_en text,
  add column if not exists skills_zh text[],
  add column if not exists skills_en text[];

update public.profiles
set
  role_zh = coalesce(role_zh, role),
  role_en = coalesce(role_en, role),
  bio_zh = coalesce(bio_zh, bio),
  bio_en = coalesce(bio_en, bio),
  skills_zh = coalesce(skills_zh, skills),
  skills_en = coalesce(skills_en, skills)
where role_zh is null
   or role_en is null
   or bio_zh is null
   or bio_en is null
   or skills_zh is null
   or skills_en is null;

-- Public pages use this safe view instead of granting public access to the
-- profiles table, which also contains member email addresses.
drop view if exists public.public_profiles;
create view public.public_profiles
with (security_barrier = true)
as
select
  id,
  slug,
  name,
  role,
  role_zh,
  role_en,
  bio,
  bio_zh,
  bio_en,
  avatar_url,
  skills,
  skills_zh,
  skills_en
from public.profiles;

revoke all on public.public_profiles from public, anon, authenticated;
grant select on public.public_profiles to anon, authenticated;

-- Read contributor membership without creating recursive RLS evaluation
-- between works and work_contributors.
create or replace function public.is_work_contributor(target_work_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.work_contributors
    where work_contributors.work_id = target_work_id
      and work_contributors.profile_id = auth.uid()
  );
$$;

revoke all on function public.is_work_contributor(uuid) from public;
grant execute on function public.is_work_contributor(uuid) to authenticated;

drop policy if exists "Members can read works they own or contribute to" on public.works;
create policy "Members can read works they own or contribute to"
on public.works
for select
to authenticated
using (
  owner_id = auth.uid()
  or public.is_work_contributor(id)
);

drop policy if exists "Members can read their contributor rows" on public.work_contributors;

drop policy if exists "Anyone can read contributors of published works" on public.work_contributors;
create policy "Anyone can read contributors of published works"
on public.work_contributors
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.works
    where works.id = work_contributors.work_id
      and works.published = true
  )
);

drop policy if exists "Members can read contributors for accessible works" on public.work_contributors;
create policy "Members can read contributors for accessible works"
on public.work_contributors
for select
to authenticated
using (
  profile_id = auth.uid()
  or exists (
    select 1
    from public.works
    where works.id = work_contributors.work_id
      and works.owner_id = auth.uid()
  )
);

drop policy if exists "Owners can add work contributors" on public.work_contributors;
create policy "Owners can add work contributors"
on public.work_contributors
for insert
to authenticated
with check (
  exists (
    select 1
    from public.works
    where works.id = work_contributors.work_id
      and works.owner_id = auth.uid()
  )
);

drop policy if exists "Owners can update work contributors" on public.work_contributors;
create policy "Owners can update work contributors"
on public.work_contributors
for update
to authenticated
using (
  exists (
    select 1
    from public.works
    where works.id = work_contributors.work_id
      and works.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.works
    where works.id = work_contributors.work_id
      and works.owner_id = auth.uid()
  )
);

drop policy if exists "Owners can remove work contributors" on public.work_contributors;
create policy "Owners can remove work contributors"
on public.work_contributors
for delete
to authenticated
using (
  exists (
    select 1
    from public.works
    where works.id = work_contributors.work_id
      and works.owner_id = auth.uid()
  )
);

-- Atomically replace all contributor rows for one owner-controlled work.
-- contributor_rows format: [{"profile_id":"uuid", "role":"Editor"}]
create or replace function public.sync_work_contributors(
  target_work_id uuid,
  contributor_rows jsonb default '[]'::jsonb
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if auth.uid() is null or not exists (
    select 1
    from public.works
    where works.id = target_work_id
      and works.owner_id = auth.uid()
  ) then
    raise exception 'Only the work owner can manage contributors' using errcode = '42501';
  end if;

  if jsonb_typeof(coalesce(contributor_rows, '[]'::jsonb)) <> 'array' then
    raise exception 'Contributor payload must be an array' using errcode = '22023';
  end if;

  delete from public.work_contributors
  where work_contributors.work_id = target_work_id;

  insert into public.work_contributors (work_id, profile_id, role)
  select
    target_work_id,
    normalized.profile_id,
    left(coalesce(normalized.role, ''), 160)
  from (
    select distinct on (payload.profile_id)
      payload.profile_id,
      payload.role
    from jsonb_to_recordset(coalesce(contributor_rows, '[]'::jsonb))
      as payload(profile_id uuid, role text)
    -- Use the safe public profile view here. The base profiles table deliberately
    -- allows members to read only their own row, which would otherwise filter
    -- valid selected contributors out of this security-invoker function.
    join public.public_profiles on public_profiles.id = payload.profile_id
    where payload.profile_id <> auth.uid()
    order by payload.profile_id
  ) as normalized;
end;
$$;

revoke all on function public.sync_work_contributors(uuid, jsonb) from public;
grant execute on function public.sync_work_contributors(uuid, jsonb) to authenticated;
