import { redirect } from 'next/navigation';
import { LoginView } from '@/components/LoginView';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import type { TranslationKey } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

type LoginPageProps = {
  searchParams: Promise<{ reason?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const configured = isSupabaseConfigured();
  const { reason } = await searchParams;

  if (configured) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) redirect('/dashboard');
  }

  const initialErrorKey: TranslationKey | undefined = reason === 'missing-config' ? 'auth.missingConfig' : undefined;

  return <LoginView isConfigured={configured} initialErrorKey={initialErrorKey} />;
}
