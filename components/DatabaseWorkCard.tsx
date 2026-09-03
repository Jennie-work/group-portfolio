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

export function DatabaseWorkCard({ work, index = 0 }: { work: PublicWork; index?: number }) {
  const { language, t } = useLanguage();
  const title = getLocalizedWorkTitle(work, language);
  const description = getLocalizedWorkDescription(work, language);
  const category = (language === 'zh' ? work.categoryZh : work.categoryEn) || work.category;
  const coverUrl = getPublicCoverUrl(work.coverUrl);
  const people = getWorkPeople(work);

  return (
    <Link href={`/works/${work.id}`} className="album-card group block rounded-[1.8rem] focus-visible:ring-4 focus-visible:ring-lime">
      {coverUrl ? (
        <div role="img" aria-label={t('publicWork.coverAlt', { title })} className="album-cover relative aspect-[4/3] overflow-hidden rounded-[1.55rem] border border-ink/20 bg-cover bg-center shadow-[7px_8px_0_rgb(37_95_168_/_18%)] transition duration-500" style={{ backgroundImage: `url(${coverUrl})` }}>
          <span className="pixel-tag absolute left-3 top-3 bg-white/85 px-2 py-1 text-[11px]">{t(workTypeLabels[work.type])}</span>
          <span className="mono-label absolute bottom-3 right-3 rounded-full bg-ink px-2 py-1 text-white">0{index + 1}</span>
        </div>
      ) : (
        <div className="album-cover y2k-cover-placeholder relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-[1.55rem] border border-ink/20 shadow-[7px_8px_0_rgb(37_95_168_/_18%)] transition duration-500">
          <span className="mono-label text-denim">{t('dashboard.noCover')}</span>
          <span className="pixel-tag absolute left-3 top-3 bg-white/85 px-2 py-1 text-[11px]">{t(workTypeLabels[work.type])}</span>
          <span className="mono-label absolute bottom-3 right-3 rounded-full bg-ink px-2 py-1 text-white">0{index + 1}</span>
        </div>
      )}
      <div className="flex items-start justify-between gap-4 px-1 py-5">
        <div>
          <h3 className="display break-anywhere text-3xl font-semibold tracking-[-.05em] text-ink">{title}</h3>
          <p className="mono-label mt-2 text-denim">{category}</p>
          <p className="break-anywhere mt-3 max-w-md text-sm leading-relaxed text-ink/65">{description}</p>
          {people.length > 0 && <p className="break-anywhere mt-4 text-xs uppercase tracking-wider text-ink/55">{t('work.by', { names: people.join(', ') })}</p>}
        </div>
        <span className="pixel-tag shrink-0 px-2 py-1">{work.year}</span>
      </div>
    </Link>
  );
}

function getWorkPeople(work: PublicWork) {
  const names = [work.owner?.name, ...work.contributors.map((contributor) => contributor.profile.name)].filter((name): name is string => Boolean(name));
  return Array.from(new Set(names));
}
