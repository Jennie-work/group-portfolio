'use client';

import { useLanguage } from './LanguageProvider';
import { LoginForm } from './LoginForm';
import type { TranslationKey } from '@/lib/i18n';

type LoginViewProps = {
  isConfigured: boolean;
  initialErrorKey?: TranslationKey;
};

export function LoginView({ isConfigured, initialErrorKey }: LoginViewProps) {
  const { t } = useLanguage();

  return (
    <main className="min-h-screen pt-20">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-[720px] flex-col justify-center px-5 py-16 md:px-10">
        <div className="polaroid-frame rounded-[2rem] p-7 md:p-10">
        <p className="mono-label text-denim">{t('auth.loginEyebrow')}</p>
        <h1 className="display mt-5 text-6xl font-semibold leading-[.84] tracking-[-.06em] text-ink md:text-8xl">{t('auth.loginTitle')}</h1>
        <p className="mt-6 max-w-lg text-base leading-relaxed text-ink/70">{t('auth.loginIntro')}</p>
        <LoginForm isConfigured={isConfigured} initialErrorKey={initialErrorKey} />
        </div>
      </section>
    </main>
  );
}
