-- FORM/24 — Stage 3 Supabase Auth policies
-- Run after the Stage 2 foundation migration.
-- This enables authenticated profile access without adding uploads or dashboard management.

alter table public.profiles enable row level security;
alter table public.works enable row level security;
alter table public.work_contributors enable row level security;

drop policy if exists "Members can read their own profile" on public.profiles;
create policy "Members can read their own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "Members can read works they own or contribute to" on public.works;
create policy "Members can read works they own or contribute to"
on public.works
for select
to authenticated
using (
  owner_id = auth.uid()
  or exists (
    select 1
    from public.work_contributors
    where work_contributors.work_id = works.id
      and work_contributors.profile_id = auth.uid()
  )
);

drop policy if exists "Members can read their contributor rows" on public.work_contributors;
create policy "Members can read their contributor rows"
on public.work_contributors
for select
to authenticated
using (profile_id = auth.uid());
