'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from './LanguageProvider';

export function DashboardNotice() {
  const { t } = useLanguage();

  return (
    <main className="min-h-screen pt-20">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-[760px] flex-col justify-center px-5 py-16 md:px-10">
        <p className="text-xs uppercase tracking-widest text-neutral-500">{t('workForm.editEyebrow')}</p>
        <h1 className="display mt-5 text-5xl font-semibold leading-none md:text-7xl">{t('workForm.unauthorizedTitle')}</h1>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-neutral-600">{t('workForm.unauthorizedBody')}</p>
        <Link href="/dashboard" className="mt-10 inline-flex w-fit items-center gap-2 border-b border-black pb-2 text-sm font-medium">
          <ArrowLeft aria-hidden="true" size={16} />
          {t('workForm.back')}
        </Link>
      </section>
    </main>
  );
}
