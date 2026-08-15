-- FORM/24 — Stage 4 work management
-- Adds bilingual work metadata and owner-only write policies.
-- File upload and Storage policies remain deferred.

alter table public.works
  add column if not exists title_zh text,
  add column if not exists title_en text,
  add column if not exists description_zh text,
  add column if not exists description_en text,
  add column if not exists category_zh text,
  add column if not exists category_en text;

update public.works
set
  title_zh = coalesce(title_zh, title),
  title_en = coalesce(title_en, title),
  description_zh = coalesce(description_zh, description),
  description_en = coalesce(description_en, description),
  category_zh = coalesce(category_zh, category),
  category_en = coalesce(category_en, category)
where title_zh is null
   or title_en is null
   or description_zh is null
   or description_en is null
   or category_zh is null
   or category_en is null;

drop policy if exists "Members can create their own works" on public.works;
create policy "Members can create their own works"
on public.works
for insert
to authenticated
with check (owner_id = auth.uid());

drop policy if exists "Members can update their own works" on public.works;
create policy "Members can update their own works"
on public.works
for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "Members can delete their own works" on public.works;
create policy "Members can delete their own works"
on public.works
for delete
to authenticated
using (owner_id = auth.uid());
