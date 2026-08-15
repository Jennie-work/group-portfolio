import { GroupWorksView } from '@/components/GroupWorksView';
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

export default async function GroupWorksPage() {
  if (!isSupabaseConfigured()) return <GroupWorksView works={[]} />;

  const supabase = await createSupabaseServerClient();
  const { data: workRows } = await supabase
    .from('works')
    .select(publicWorkSelect)
    .eq('published', true)
    .eq('is_group_work', true)
    .order('created_at', { ascending: false })
    .returns<PublicWorkRow[]>();

  const rows = workRows ?? [];
  const workIds = rows.map((row) => row.id);
  const { data: contributorRows } = workIds.length > 0
    ? await supabase.from('work_contributors').select('work_id, profile_id, role').in('work_id', workIds).returns<WorkContributorRow[]>()
    : { data: [] as WorkContributorRow[] };

  const profileIds = Array.from(new Set([
    ...rows.map((row) => row.owner_id),
    ...(contributorRows ?? []).map((row) => row.profile_id),
  ]));
  const { data: profileRows } = profileIds.length > 0
    ? await supabase.from('public_profiles').select(publicProfileSelect).in('id', profileIds).returns<PublicProfileRow[]>()
    : { data: [] as PublicProfileRow[] };

  const ownerIds = Object.fromEntries(rows.map((row) => [row.id, row.owner_id]));
  const works = attachWorkPeople(rows.map(mapWorkRow), (profileRows ?? []).map(mapPublicProfile), contributorRows ?? [], ownerIds);

  return <GroupWorksView works={works} />;
}
