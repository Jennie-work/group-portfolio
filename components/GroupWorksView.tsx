'use client';

import { DatabaseWorkCard } from './DatabaseWorkCard';
import { useLanguage } from './LanguageProvider';
import type { PublicWork } from '@/lib/public-data';

export function GroupWorksView({ works }: { works: PublicWork[] }) {
  const { t } = useLanguage();

  return (
    <main className="public-page-background mx-auto max-w-[1440px] px-5 pb-28 pt-28 md:px-10 md:pt-36">
      <p className="mono-label text-denim">{t('groupWorks.eyebrow', { count: works.length })}</p>
      <div className="grid gap-10 md:grid-cols-[1.3fr_.7fr] md:items-end">
        <h1 className="display mt-5 text-6xl font-semibold leading-[.84] tracking-[-.06em] text-ink md:text-9xl">{t('groupWorks.title1')}<br /><span className="text-denim">{t('groupWorks.title2')}</span></h1>
        <p className="glass-panel max-w-md rounded-[1.8rem] p-5 text-base leading-relaxed text-ink/70 md:mb-2">{t('groupWorks.intro')}</p>
      </div>

      {works.length > 0 ? (
        <div className="mt-16 grid gap-x-10 gap-y-14 md:grid-cols-2">{works.map((work, index) => <DatabaseWorkCard key={work.id} work={work} index={index} />)}</div>
      ) : (
        <p className="soft-card mt-16 rounded-[1.8rem] px-6 py-12 text-ink/60">{t('groupWorks.empty')}</p>
      )}
    </main>
  );
}
