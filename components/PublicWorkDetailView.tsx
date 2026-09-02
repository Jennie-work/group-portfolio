'use client';

import Link from 'next/link';
import { ArrowLeft, Download, ExternalLink } from 'lucide-react';
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

export function PublicWorkDetailView({ work }: { work: PublicWork }) {
  const { language, t } = useLanguage();
  const title = getLocalizedWorkTitle(work, language);
  const description = getLocalizedWorkDescription(work, language);
  const category = (language === 'zh' ? work.categoryZh : work.categoryEn) || work.category;
  const coverUrl = getPublicCoverUrl(work.coverUrl);
  const fileRoute = `/api/works/${work.id}/file`;
  const externalUrl = getSafeExternalUrl(work.externalUrl);
  const ownerContributor = work.owner ? work.contributors.find((contributor) => contributor.profile.id === work.owner?.id) : undefined;
  const otherContributors = work.contributors.filter((contributor) => contributor.profile.id !== work.owner?.id);
  const backHref = work.isGroupWork ? '/group-works' : work.owner ? `/members/${work.owner.slug}` : '/members';
  const backLabel = work.isGroupWork ? t('publicWork.back') : t('publicWork.backToMember');

  return (
    <main className="mx-auto max-w-[1400px] px-5 pb-24 pt-32 md:px-10 md:pt-40">
      <Link href={backHref} className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-black">
        <ArrowLeft aria-hidden="true" size={16} /> {backLabel}
      </Link>

      <div className="mt-10">
        {coverUrl ? (
          <div role="img" aria-label={t('publicWork.coverAlt', { title })} className="aspect-[2/1] bg-cover bg-center" style={{ backgroundImage: `url(${coverUrl})` }} />
        ) : (
          <div className="flex aspect-[2/1] items-center justify-center bg-white/50 text-xs uppercase tracking-widest text-neutral-400">{t('dashboard.noCover')}</div>
        )}

        <div className="mt-12 grid gap-12 md:grid-cols-[1.4fr_1fr]">
          <div>
            <p className="text-xs uppercase tracking-widest text-neutral-500">{category} / {t(workTypeLabels[work.type])} / {work.year}</p>
            <h1 className="display break-anywhere mt-5 text-6xl font-semibold leading-[.9] md:text-9xl">{title}</h1>
            <p className="break-anywhere mt-10 max-w-2xl text-xl leading-relaxed text-neutral-600">{description}</p>
          </div>

          <aside className="border-t border-black/10 pt-6 md:border-l md:border-t-0 md:pl-10">
            <p className="mb-5 text-xs uppercase tracking-widest text-neutral-500">{work.isGroupWork ? t('publicWork.contributors') : t('publicWork.owner')}</p>
            <div className="mb-10 grid gap-4">
              {work.owner ? (
                <Link href={`/members/${work.owner.slug}`} className="flex items-start justify-between border-b border-black/10 pb-3">
                  <span className="min-w-0 break-anywhere font-medium">{work.owner.name}</span>
                  <span className="text-right text-xs text-neutral-500">{ownerContributor?.role ? `${t('publicWork.owner')} · ${ownerContributor.role}` : t('publicWork.owner')}</span>
                </Link>
              ) : (
                <p className="text-sm text-neutral-500">{t('publicWork.missingOwner')}</p>
              )}
              {work.isGroupWork && otherContributors.map((contributor) => (
                <Link key={contributor.profile.id} href={`/members/${contributor.profile.slug}`} className="flex items-start justify-between border-b border-black/10 pb-3">
                  <span className="min-w-0 break-anywhere font-medium">{contributor.profile.name}</span>
                  <span className="text-right text-xs text-neutral-500">{contributor.role || t('publicWork.contributor')}</span>
                </Link>
              ))}
              {work.isGroupWork && otherContributors.length === 0 && <p className="text-sm text-neutral-500">{t('publicWork.noContributors')}</p>}
            </div>
            <div className="flex flex-col gap-3">
              {work.type === 'link' && externalUrl && (
                <a href={externalUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-between bg-ink px-5 py-3 text-sm text-white">
                  {t('publicWork.openProject')} <ExternalLink aria-hidden="true" size={16} />
                </a>
              )}

              {work.type === 'pdf' && work.fileUrl && (
                <>
                  <a href={`${fileRoute}?kind=file`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-between bg-ink px-5 py-3 text-sm text-white">
                    {t('publicWork.viewPdf')} <ExternalLink aria-hidden="true" size={16} />
                  </a>
                  <a href={`${fileRoute}?kind=file&download=1`} className="inline-flex items-center justify-between border border-black px-5 py-3 text-sm">
                    {t('publicWork.downloadPdf')} <Download aria-hidden="true" size={16} />
                  </a>
                </>
              )}

              {work.type === 'ppt' && work.previewUrl && (
                <a href={`${fileRoute}?kind=preview`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-between bg-ink px-5 py-3 text-sm text-white">
                  {t('publicWork.viewPresentation')} <ExternalLink aria-hidden="true" size={16} />
                </a>
              )}

              {work.type === 'ppt' && work.fileUrl && (
                <a href={`${fileRoute}?kind=file&download=1`} className="inline-flex items-center justify-between border border-black px-5 py-3 text-sm">
                  {t('publicWork.downloadPresentation')} <Download aria-hidden="true" size={16} />
                </a>
              )}

              {((work.type === 'link' && !externalUrl) || (work.type === 'pdf' && !work.fileUrl) || (work.type === 'ppt' && !work.fileUrl && !work.previewUrl)) && (
                <p className="text-sm leading-relaxed text-neutral-500">{t('publicWork.noFile')}</p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function getSafeExternalUrl(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}
