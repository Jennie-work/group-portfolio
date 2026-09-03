'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from './LanguageProvider';

export function DashboardNotice() {
  const { t } = useLanguage();

  return (
    <main className="min-h-screen pt-20">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-[760px] flex-col justify-center px-5 py-16 md:px-10">
        <p className="mono-label text-denim">{t('workForm.editEyebrow')}</p>
        <h1 className="display mt-5 text-5xl font-semibold leading-[.84] tracking-[-.06em] text-ink md:text-7xl">{t('workForm.unauthorizedTitle')}</h1>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-ink/70">{t('workForm.unauthorizedBody')}</p>
        <Link href="/dashboard" className="jelly-button mt-10 inline-flex w-fit items-center gap-2 px-4 py-2 text-sm font-medium text-ink">
          <ArrowLeft aria-hidden="true" size={16} />
          {t('workForm.back')}
        </Link>
      </section>
    </main>
  );
}
