import { HomeView } from '@/components/HomeView';
import { mapWorkRow } from '@/lib/dashboard-types';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  attachWorkPeople,
  mapPublicProfile,
  publicProfileSelect,
  publicWorkSelect,
  type PublicProfileRow,
  type PublicWorkRow,
  type WorkContributorRow,
} from '@/lib/public-data';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  if (!isSupabaseConfigured()) return <HomeView members={[]} works={[]} />;

  const supabase = await createSupabaseServerClient();
  const [{ data: memberRows }, { data: workRows }] = await Promise.all([
    supabase.from('public_profiles').select(publicProfileSelect).order('name').limit(4).returns<PublicProfileRow[]>(),
    supabase.from('works').select(publicWorkSelect).eq('published', true).eq('is_group_work', true).order('created_at', { ascending: false }).limit(2).returns<PublicWorkRow[]>(),
  ]);

  const rows = workRows ?? [];
  const workIds = rows.map((row) => row.id);
  const { data: contributorRows } = workIds.length > 0
    ? await supabase.from('work_contributors').select('work_id, profile_id, role').in('work_id', workIds).returns<WorkContributorRow[]>()
    : { data: [] as WorkContributorRow[] };

  const peopleIds = Array.from(new Set([
    ...rows.map((row) => row.owner_id),
    ...(contributorRows ?? []).map((row) => row.profile_id),
  ]));
  const { data: peopleRows } = peopleIds.length > 0
    ? await supabase.from('public_profiles').select(publicProfileSelect).in('id', peopleIds).returns<PublicProfileRow[]>()
    : { data: [] as PublicProfileRow[] };

  const ownerIds = Object.fromEntries(rows.map((row) => [row.id, row.owner_id]));
  const works = attachWorkPeople(rows.map(mapWorkRow), (peopleRows ?? []).map(mapPublicProfile), contributorRows ?? [], ownerIds);

  return <HomeView members={(memberRows ?? []).map(mapPublicProfile)} works={works} />;
}
