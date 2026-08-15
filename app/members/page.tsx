import { MembersView } from '@/components/MembersView';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { mapPublicProfile, publicProfileSelect, type PublicProfileRow } from '@/lib/public-data';

export const dynamic = 'force-dynamic';

export default async function MembersPage() {
  if (!isSupabaseConfigured()) return <MembersView members={[]} />;

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('public_profiles')
    .select(publicProfileSelect)
    .order('name')
    .returns<PublicProfileRow[]>();

  return <MembersView members={(data ?? []).map(mapPublicProfile)} />;
}
