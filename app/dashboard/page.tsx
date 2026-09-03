import { redirect } from 'next/navigation';
import { DashboardView } from '@/components/DashboardView';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { mapWorkRow, type DashboardProfile, type WorkRow } from '@/lib/dashboard-types';

export const dynamic = 'force-dynamic';

type ProfileRow = {
  name: string | null;
  email: string | null;
  avatar_url: string | null;
};

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  if (!isSupabaseConfigured()) redirect('/login?reason=missing-config');

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profileRow } = await supabase
    .from('profiles')
    .select('name, email, avatar_url')
    .eq('id', user.id)
    .maybeSingle<ProfileRow>();

  const profile: DashboardProfile = {
    name: profileRow?.name ?? user.user_metadata.name ?? null,
    email: profileRow?.email ?? user.email ?? null,
    avatarUrl: profileRow?.avatar_url ?? user.user_metadata.avatar_url ?? null,
  };

  const { data: workRows, error: worksError } = await supabase
    .from('works')
    .select('id, slug, title, title_zh, title_en, description, description_zh, description_en, category, category_zh, category_en, type, year, cover_url, file_url, preview_url, external_url, is_group_work, published, updated_at')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })
    .returns<WorkRow[]>();

  const { status } = await searchParams;
  return <DashboardView profile={profile} works={(workRows ?? []).map(mapWorkRow)} worksError={Boolean(worksError)} saved={status === 'saved'} />;
}
