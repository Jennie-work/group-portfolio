import { notFound } from 'next/navigation';
import { MemberDetailView } from '@/components/MemberDetailView';
import { mapWorkRow } from '@/lib/dashboard-types';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  mapPublicProfile,
  publicProfileSelect,
  publicWorkSelect,
  type PublicProfileRow,
  type PublicWork,
  type PublicWorkRow,
} from '@/lib/public-data';

export const dynamic = 'force-dynamic';

export default async function MemberDetail({ params }: { params: Promise<{ id: string }> }) {
  if (!isSupabaseConfigured()) notFound();

  const { id: slug } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: profileRow } = await supabase
    .from('public_profiles')
    .select(publicProfileSelect)
    .eq('slug', slug)
    .maybeSingle<PublicProfileRow>();

  if (!profileRow) notFound();
  const member = mapPublicProfile(profileRow);

  const { data: workRows } = await supabase
    .from('works')
    .select(publicWorkSelect)
    .eq('owner_id', member.id)
    .eq('published', true)
    .eq('is_group_work', false)
    .order('created_at', { ascending: false })
    .returns<PublicWorkRow[]>();

  const works: PublicWork[] = (workRows ?? []).map((row) => ({
    ...mapWorkRow(row),
    owner: member,
    contributors: [],
  }));

  return <MemberDetailView member={member} works={works} />;
}
