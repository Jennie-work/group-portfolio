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
  file: 'work.type.file',
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
    <main className="mx-auto max-w-[1440px] px-5 pb-28 pt-28 md:px-10 md:pt-36">
      <Link href={backHref} className="jelly-button inline-flex items-center gap-2 px-4 py-2 text-sm text-ink">
        <ArrowLeft aria-hidden="true" size={16} /> {backLabel}
      </Link>

      <div className="mt-10">
        {coverUrl ? (
          <div className="polaroid-frame p-3"><div role="img" aria-label={t('publicWork.coverAlt', { title })} className="aspect-[2/1] bg-cover bg-center" style={{ backgroundImage: `url(${coverUrl})` }} /></div>
        ) : (
          <div className="y2k-cover-placeholder flex aspect-[2/1] items-center justify-center rounded-[1.8rem] text-xs uppercase tracking-widest text-denim">{t('dashboard.noCover')}</div>
        )}

        <div className="mt-12 grid gap-12 md:grid-cols-[1.4fr_1fr]">
          <div>
            <p className="mono-label text-denim">{category} / {t(workTypeLabels[work.type])} / {work.year}</p>
            <h1 className="display break-anywhere mt-5 text-6xl font-semibold leading-[.84] tracking-[-.06em] text-ink md:text-9xl">{title}</h1>
            <p className="break-anywhere mt-9 max-w-2xl text-xl leading-relaxed text-ink/70">{description}</p>
          </div>

          <aside className="soft-card rounded-[1.8rem] p-6 md:p-8">
            <p className="mono-label mb-5 text-denim">{work.isGroupWork ? t('publicWork.contributors') : t('publicWork.owner')}</p>
            <div className="mb-10 grid gap-4">
              {work.owner ? (
                <Link href={`/members/${work.owner.slug}`} className="flex items-start justify-between border-b border-denim/15 pb-3 transition hover:text-denim">
                  <span className="min-w-0 break-anywhere font-medium">{work.owner.name}</span>
                  <span className="text-right text-xs text-neutral-500">{ownerContributor?.role ? `${t('publicWork.owner')} · ${ownerContributor.role}` : t('publicWork.owner')}</span>
                </Link>
              ) : (
                <p className="text-sm text-neutral-500">{t('publicWork.missingOwner')}</p>
              )}
              {work.isGroupWork && otherContributors.map((contributor) => (
                <Link key={contributor.profile.id} href={`/members/${contributor.profile.slug}`} className="flex items-start justify-between border-b border-denim/15 pb-3 transition hover:text-denim">
                  <span className="min-w-0 break-anywhere font-medium">{contributor.profile.name}</span>
                  <span className="text-right text-xs text-neutral-500">{contributor.role || t('publicWork.contributor')}</span>
                </Link>
              ))}
              {work.isGroupWork && otherContributors.length === 0 && <p className="text-sm text-neutral-500">{t('publicWork.noContributors')}</p>}
            </div>
            <div className="flex flex-col gap-3">
              {work.type === 'link' && externalUrl && (
                <a href={externalUrl} target="_blank" rel="noopener noreferrer" className="jelly-button inline-flex items-center justify-between bg-ink px-5 py-3 text-sm text-white">
                  {t('publicWork.openProject')} <ExternalLink aria-hidden="true" size={16} />
                </a>
              )}

              {work.type === 'pdf' && work.fileUrl && (
                <>
                  <a href={`${fileRoute}?kind=file`} target="_blank" rel="noopener noreferrer" className="jelly-button inline-flex items-center justify-between bg-ink px-5 py-3 text-sm text-white">
                    {t('publicWork.viewPdf')} <ExternalLink aria-hidden="true" size={16} />
                  </a>
                  <a href={`${fileRoute}?kind=file&download=1`} className="jelly-button inline-flex items-center justify-between px-5 py-3 text-sm">
                    {t('publicWork.downloadPdf')} <Download aria-hidden="true" size={16} />
                  </a>
                </>
              )}

              {work.type === 'ppt' && work.previewUrl && (
                <a href={`${fileRoute}?kind=preview`} target="_blank" rel="noopener noreferrer" className="jelly-button inline-flex items-center justify-between bg-ink px-5 py-3 text-sm text-white">
                  {t('publicWork.viewPresentation')} <ExternalLink aria-hidden="true" size={16} />
                </a>
              )}

              {work.type === 'ppt' && work.fileUrl && (
                <a href={`${fileRoute}?kind=file&download=1`} className="jelly-button inline-flex items-center justify-between px-5 py-3 text-sm">
                  {t('publicWork.downloadPresentation')} <Download aria-hidden="true" size={16} />
                </a>
              )}

              {work.type === 'file' && work.fileUrl && (
                <>
                  <a href={`${fileRoute}?kind=file`} target="_blank" rel="noopener noreferrer" className="jelly-button inline-flex items-center justify-between bg-ink px-5 py-3 text-sm text-white">
                    {t('publicWork.openFile')} <ExternalLink aria-hidden="true" size={16} />
                  </a>
                  <a href={`${fileRoute}?kind=file&download=1`} className="jelly-button inline-flex items-center justify-between px-5 py-3 text-sm">
                    {t('publicWork.downloadFile')} <Download aria-hidden="true" size={16} />
                  </a>
                </>
              )}

              {((work.type === 'link' && !externalUrl) || (work.type === 'file' && !work.fileUrl) || (work.type === 'pdf' && !work.fileUrl) || (work.type === 'ppt' && !work.fileUrl && !work.previewUrl)) && (
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
