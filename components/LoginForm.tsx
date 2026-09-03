'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from './LanguageProvider';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import type { TranslationKey } from '@/lib/i18n';

type LoginFormProps = {
  isConfigured: boolean;
  initialErrorKey?: TranslationKey;
};

export function LoginForm({ isConfigured, initialErrorKey }: LoginFormProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorKey, setErrorKey] = useState<TranslationKey | ''>(initialErrorKey ?? '');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isConfigured) {
      setErrorKey('auth.missingConfig');
      return;
    }

    setLoading(true);
    setErrorKey('');

    const supabase = createSupabaseBrowserClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setErrorKey(signInError.status === 400 ? 'auth.invalidCredentials' : 'auth.genericError');
      setLoading(false);
      return;
    }

    router.replace('/dashboard');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-10 grid gap-5" noValidate>
      <div className="grid gap-2">
        <label htmlFor="email" className="text-sm font-medium">{t('auth.email')}</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="h-12 border border-ink/15 px-4 text-base outline-none transition-colors focus:border-ink"
        />
      </div>
      <div className="grid gap-2">
        <label htmlFor="password" className="text-sm font-medium">{t('auth.password')}</label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="h-12 border border-ink/15 px-4 text-base outline-none transition-colors focus:border-ink"
        />
      </div>
      {errorKey && <p role="alert" className="text-sm leading-relaxed text-red-700">{t(errorKey)}</p>}
      <button
        type="submit"
        disabled={loading || !isConfigured}
        className="jelly-button inline-flex h-12 items-center justify-center gap-3 bg-ink px-5 text-sm font-medium text-white transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-45"
      >
        {loading ? t('auth.submitting') : t('auth.submit')}
        <ArrowRight aria-hidden="true" size={16} />
      </button>
    </form>
  );
}
