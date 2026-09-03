'use client';

import { MemberCard } from './MemberCard';
import { useLanguage } from './LanguageProvider';
import type { PublicProfile } from '@/lib/public-data';

export function MembersView({ members }: { members: PublicProfile[] }) {
  const { t } = useLanguage();
  return <main className="mx-auto max-w-[1440px] px-5 pb-28 pt-28 md:px-10 md:pt-36">
    <div className="grid gap-10 md:grid-cols-[1.3fr_.7fr] md:items-end">
      <div>
        <p className="mono-label text-denim">{t('members.eyebrow', { count: members.length })}</p>
        <h1 className="display mt-5 text-6xl font-semibold leading-[.84] tracking-[-.06em] text-ink md:text-9xl">{t('members.title1')}<br /><span className="text-denim">{t('members.title2')}</span></h1>
      </div>
      <p className="glass-panel max-w-md rounded-[1.8rem] p-5 text-base leading-relaxed text-ink/70 md:mb-2">{t('members.intro')}</p>
    </div>
    {members.length > 0 ? (
      <div className="mt-16 grid grid-cols-1 gap-x-7 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{members.map((member) => <MemberCard key={member.id} member={member} />)}</div>
    ) : (
      <p className="soft-card mt-16 rounded-[1.8rem] px-6 py-12 text-ink/60">{t('members.empty')}</p>
    )}
  </main>;
}
