import { redirect } from 'next/navigation';
import { WorkForm } from '@/components/WorkForm';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { mapPublicProfile, publicProfileSelect, type PublicProfileRow } from '@/lib/public-data';

export const dynamic = 'force-dynamic';

export default async function NewWorkPage() {
  if (!isSupabaseConfigured()) redirect('/login?reason=missing-config');

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: memberRows } = await supabase
    .from('public_profiles')
    .select(publicProfileSelect)
    .order('name')
    .returns<PublicProfileRow[]>();

  return <WorkForm mode="create" ownerId={user.id} memberOptions={(memberRows ?? []).map(mapPublicProfile)} />;
}
