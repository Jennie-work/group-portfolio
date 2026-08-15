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

  return <main className="mx-auto max-w-[1400px] px-5 pb-24 pt-32 md:px-10 md:pt-40">
    <Link href="/members" className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-black"><ArrowLeft aria-hidden="true" size={16} /> {t('member.back')}</Link>
    <section className="mt-10 grid gap-12 md:grid-cols-[1fr_1.3fr] md:gap-20">
      {avatarUrl ? (
        <div role="img" aria-label={t('members.avatarAlt', { name: member.name, role })} className="aspect-[3/4] max-w-md bg-cover bg-center" style={{ backgroundImage: `url(${avatarUrl})` }} />
      ) : (
        <div role="img" aria-label={t('members.avatarAlt', { name: member.name, role })} className="flex aspect-[3/4] max-w-md items-center justify-center bg-neutral-200 text-7xl font-semibold text-neutral-500">{member.name.slice(0, 1).toUpperCase()}</div>
      )}
      <div className="flex flex-col justify-end">
        <p className="text-xs uppercase tracking-widest text-neutral-500">{role || t('members.roleFallback')}</p>
        <h1 className="display break-anywhere mt-5 text-6xl font-semibold leading-[.88] md:text-9xl">{member.name}</h1>
        <p className="break-anywhere mt-10 max-w-xl text-xl leading-relaxed text-neutral-600">{bio || t('members.bioFallback')}</p>
        {skills.length > 0 && <div className="mt-12 flex flex-wrap gap-2">{skills.map((skill) => <span key={skill} className="rounded-full border border-black/20 px-4 py-2 text-xs uppercase tracking-wider">{skill}</span>)}</div>}
      </div>
    </section>
    <section className="mt-32 border-t border-line pt-10">
      <div className="mb-10 flex items-baseline justify-between"><h2 className="display text-4xl font-semibold md:text-6xl">{t('member.selectedWork')}</h2><span className="text-sm text-neutral-500">{t('member.projectCount', { count: works.length })}</span></div>
      {works.length > 0 ? (
        <div className="grid gap-12 md:grid-cols-2">{works.map((work) => <DatabaseWorkCard key={work.id} work={work} />)}</div>
      ) : (
        <p className="border border-black/10 px-5 py-8 text-sm text-neutral-500">{t('member.noPublishedWorks')}</p>
      )}
    </section>
  </main>;
}
