import { notFound } from 'next/navigation';
import { PublicWorkDetailView } from '@/components/PublicWorkDetailView';
import { mapWorkRow } from '@/lib/dashboard-types';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import {
  mapPublicProfile,
  publicProfileSelect,
  publicWorkSelect,
  type PublicProfileRow,
  type PublicWork,
  type PublicWorkRow,
  type WorkContributorRow,
} from '@/lib/public-data';

export const dynamic = 'force-dynamic';

export default async function PublicWorkPage({ params }: { params: Promise<{ id: string }> }) {
  if (!isSupabaseConfigured()) notFound();

  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: row } = await supabase
    .from('works')
    .select(publicWorkSelect)
    .eq('id', id)
    .eq('published', true)
    .maybeSingle<PublicWorkRow>();

  if (!row) notFound();

  const { data: contributorRows } = await supabase
    .from('work_contributors')
    .select('work_id, profile_id, role')
    .eq('work_id', row.id)
    .returns<WorkContributorRow[]>();

  const profileIds = Array.from(new Set([row.owner_id, ...(contributorRows ?? []).map((contributor) => contributor.profile_id)]));
  const { data: profileRows } = await supabase
    .from('public_profiles')
    .select(publicProfileSelect)
    .in('id', profileIds)
    .returns<PublicProfileRow[]>();
  const profiles = (profileRows ?? []).map(mapPublicProfile);
  const profilesById = new Map(profiles.map((profile) => [profile.id, profile]));

  const work: PublicWork = {
    ...mapWorkRow(row),
    owner: profilesById.get(row.owner_id) ?? null,
    contributors: (contributorRows ?? [])
      .map((contributor) => ({ profile: profilesById.get(contributor.profile_id), role: contributor.role }))
      .filter((contributor): contributor is PublicWork['contributors'][number] => Boolean(contributor.profile)),
  };

  return <PublicWorkDetailView work={work} />;
}
