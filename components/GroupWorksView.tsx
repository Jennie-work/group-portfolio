'use client';

import { DatabaseWorkCard } from './DatabaseWorkCard';
import { useLanguage } from './LanguageProvider';
import type { PublicWork } from '@/lib/public-data';

export function GroupWorksView({ works }: { works: PublicWork[] }) {
  const { t } = useLanguage();

  return (
    <main className="mx-auto max-w-[1400px] px-5 pb-24 pt-40 md:px-10">
      <p className="text-xs uppercase tracking-widest text-neutral-500">{t('groupWorks.eyebrow', { count: works.length })}</p>
      <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
        <h1 className="display mt-6 text-6xl font-semibold leading-[.9] md:text-9xl">{t('groupWorks.title1')}<br /><span className="ml-[12vw]">{t('groupWorks.title2')}</span></h1>
        <p className="max-w-sm text-lg leading-relaxed text-neutral-600">{t('groupWorks.intro')}</p>
      </div>

      {works.length > 0 ? (
        <div className="mt-24 space-y-20">
          {works.map((work, index) => (
            <div key={work.id} className="grid gap-6 md:grid-cols-[80px_1fr]">
              <span className="text-sm text-neutral-400">{String(index + 1).padStart(2, '0')}</span>
              <DatabaseWorkCard work={work} />
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-24 border border-black/10 px-5 py-10 text-neutral-500">{t('groupWorks.empty')}</p>
      )}
    </main>
  );
}
