'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { DatabaseWorkCard } from './DatabaseWorkCard';
import { useLanguage } from './LanguageProvider';
import {
  getLocalizedProfileBio,
  getLocalizedProfileRole,
  getLocalizedProfileSkills,
  type PublicProfile,
  type PublicWork,
} from '@/lib/public-data';
import { getPublicAvatarUrl } from '@/lib/work-storage';

export function MemberDetailView({ member, works }: { member: PublicProfile; works: PublicWork[] }) {
  const { language, t } = useLanguage();
  const role = getLocalizedProfileRole(member, language);
  const bio = getLocalizedProfileBio(member, language);
  const skills = getLocalizedProfileSkills(member, language);
  const avatarUrl = getPublicAvatarUrl(member.avatarUrl);

  return <main className="mx-auto max-w-[1440px] px-5 pb-28 pt-28 md:px-10 md:pt-36">
    <Link href="/members" className="jelly-button inline-flex items-center gap-2 px-4 py-2 text-sm text-ink"><ArrowLeft aria-hidden="true" size={16} /> {t('member.back')}</Link>
    <section className="mt-10 grid gap-12 md:grid-cols-[.9fr_1.25fr] md:gap-20">
      {avatarUrl ? (
        <div className="polaroid-frame max-w-md p-3"><div role="img" aria-label={t('members.avatarAlt', { name: member.name, role })} className="aspect-[4/4.6] bg-cover bg-center" style={{ backgroundImage: `url(${avatarUrl})` }} /></div>
      ) : (
        <div role="img" aria-label={t('members.avatarAlt', { name: member.name, role })} className="y2k-cover-placeholder flex aspect-[4/4.6] max-w-md items-center justify-center rounded-[1.8rem] text-7xl font-semibold text-denim">{member.name.slice(0, 1).toUpperCase()}</div>
      )}
      <div className="flex flex-col justify-end">
        <p className="mono-label text-denim">ROLE / {role || t('members.roleFallback')}</p>
        <h1 className="display break-anywhere mt-5 text-6xl font-semibold leading-[.84] tracking-[-.06em] text-ink md:text-9xl">{member.name}</h1>
        <p className="break-anywhere mt-9 max-w-xl text-xl leading-relaxed text-ink/70">{bio || t('members.bioFallback')}</p>
        {skills.length > 0 && <div className="mt-10"><p className="mono-label mb-3 text-denim">SKILLS</p><div className="flex flex-wrap gap-2">{skills.map((skill) => <span key={skill} className="pixel-tag px-3 py-1.5">{skill}</span>)}</div></div>}
      </div>
    </section>
    <section className="mt-24 border-t border-denim/20 pt-10">
      <div className="mb-10 flex items-baseline justify-between gap-4"><div><p className="mono-label text-denim">WORKS</p><h2 className="display mt-3 text-4xl font-semibold tracking-[-.05em] text-ink md:text-6xl">{t('member.selectedWork')}</h2></div><span className="pixel-tag shrink-0 px-3 py-1.5">{t('member.projectCount', { count: works.length })}</span></div>
      {works.length > 0 ? (
        <div className="grid gap-12 md:grid-cols-2">{works.map((work, index) => <DatabaseWorkCard key={work.id} work={work} index={index} />)}</div>
      ) : (
        <p className="soft-card rounded-[1.8rem] px-6 py-10 text-sm text-ink/60">{t('member.noPublishedWorks')}</p>
      )}
    </section>
  </main>;
}
