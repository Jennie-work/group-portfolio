'use client';

import { MemberCard } from './MemberCard';
import { useLanguage } from './LanguageProvider';
import type { PublicProfile } from '@/lib/public-data';

export function MembersView({ members }: { members: PublicProfile[] }) {
  const { t } = useLanguage();
  return <main className="mx-auto max-w-[1400px] px-5 pb-24 pt-40 md:px-10">
    <div className="max-w-4xl">
      <p className="text-xs uppercase tracking-widest text-neutral-500">{t('members.eyebrow', { count: members.length })}</p>
      <h1 className="display mt-6 text-6xl font-semibold leading-[.9] md:text-9xl">{t('members.title1')}<br /><span className="ml-[12vw]">{t('members.title2')}</span></h1>
      <p className="mt-10 max-w-lg text-lg leading-relaxed text-neutral-600">{t('members.intro')}</p>
    </div>
    {members.length > 0 ? (
      <div className="mt-24 grid grid-cols-1 gap-x-4 gap-y-12 sm:grid-cols-2 md:grid-cols-4 md:gap-8">{members.map((member) => <MemberCard key={member.id} member={member} />)}</div>
    ) : (
      <p className="mt-24 border border-black/10 px-5 py-10 text-neutral-500">{t('members.empty')}</p>
    )}
  </main>;
}
