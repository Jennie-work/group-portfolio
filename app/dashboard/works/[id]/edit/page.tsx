import { redirect } from 'next/navigation';
import { DashboardNotice } from '@/components/DashboardNotice';
import { WorkForm } from '@/components/WorkForm';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { mapWorkRow, type WorkRow } from '@/lib/dashboard-types';
import { mapPublicProfile, publicProfileSelect, type PublicProfileRow, type WorkContributorRow } from '@/lib/public-data';

export const dynamic = 'force-dynamic';

type EditWorkPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditWorkPage({ params }: EditWorkPageProps) {
  if (!isSupabaseConfigured()) redirect('/login?reason=missing-config');

  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: workRow } = await supabase
    .from('works')
    .select('id, slug, title, title_zh, title_en, description, description_zh, description_en, category, category_zh, category_en, type, year, cover_url, file_url, preview_url, external_url, is_group_work, published')
    .eq('id', id)
    .eq('owner_id', user.id)
    .maybeSingle<WorkRow>();

  if (!workRow) return <DashboardNotice />;

  const [{ data: memberRows }, { data: contributorRows }] = await Promise.all([
    supabase.from('public_profiles').select(publicProfileSelect).order('name').returns<PublicProfileRow[]>(),
    supabase.from('work_contributors').select('work_id, profile_id, role').eq('work_id', id).returns<WorkContributorRow[]>(),
  ]);

  return <WorkForm
    mode="edit"
    ownerId={user.id}
    work={mapWorkRow(workRow)}
    memberOptions={(memberRows ?? []).map(mapPublicProfile)}
    initialContributors={(contributorRows ?? []).map((contributor) => ({ profileId: contributor.profile_id, role: contributor.role }))}
  />;
}
