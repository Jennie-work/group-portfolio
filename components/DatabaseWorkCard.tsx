'use client';

import Link from 'next/link';
import { useLanguage } from './LanguageProvider';
import { getLocalizedWorkDescription, getLocalizedWorkTitle } from '@/lib/dashboard-types';
import type { PublicWork } from '@/lib/public-data';
import { getPublicCoverUrl } from '@/lib/work-storage';
import type { TranslationKey } from '@/lib/i18n';

const workTypeLabels = {
  link: 'work.type.link',
  pdf: 'work.type.pdf',
  ppt: 'work.type.ppt',
} satisfies Record<PublicWork['type'], TranslationKey>;

export function DatabaseWorkCard({ work }: { work: PublicWork }) {
  const { language, t } = useLanguage();
  const title = getLocalizedWorkTitle(work, language);
  const description = getLocalizedWorkDescription(work, language);
  const category = (language === 'zh' ? work.categoryZh : work.categoryEn) || work.category;
  const coverUrl = getPublicCoverUrl(work.coverUrl);
  const people = getWorkPeople(work);

  return (
    <Link href={`/works/${work.id}`} className="group block">
      {coverUrl ? (
        <div role="img" aria-label={t('publicWork.coverAlt', { title })} className="relative aspect-[4/3] bg-cover bg-center transition-opacity group-hover:opacity-90" style={{ backgroundImage: `url(${coverUrl})` }}>
          <span className="absolute left-3 top-3 bg-[#f5f4f0] px-2 py-1 text-[11px] uppercase tracking-wider">{t(workTypeLabels[work.type])}</span>
        </div>
      ) : (
        <div className="relative flex aspect-[4/3] items-center justify-center bg-white/50 text-xs uppercase tracking-widest text-neutral-400">
          <span>{t('dashboard.noCover')}</span>
          <span className="absolute left-3 top-3 bg-[#f5f4f0] px-2 py-1 text-[11px] text-black">{t(workTypeLabels[work.type])}</span>
        </div>
      )}
      <div className="flex items-start justify-between gap-4 py-4">
        <div>
          <h3 className="display break-anywhere text-2xl font-semibold">{title}</h3>
          <p className="mt-1 text-xs uppercase tracking-wider text-neutral-500">{category}</p>
          <p className="break-anywhere mt-2 max-w-md text-sm text-neutral-500">{description}</p>
          {people.length > 0 && <p className="break-anywhere mt-3 text-xs uppercase tracking-wider text-neutral-500">{t('work.by', { names: people.join(', ') })}</p>}
        </div>
        <span className="shrink-0 pt-1 text-sm text-neutral-500">{work.year}</span>
      </div>
    </Link>
  );
}

function getWorkPeople(work: PublicWork) {
  const names = [work.owner?.name, ...work.contributors.map((contributor) => contributor.profile.name)].filter((name): name is string => Boolean(name));
  return Array.from(new Set(names));
}
