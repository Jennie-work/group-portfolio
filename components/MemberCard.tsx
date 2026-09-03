'use client';

import Link from 'next/link';
import { useLanguage } from './LanguageProvider';
import { getLocalizedProfileBio, getLocalizedProfileRole, type PublicProfile } from '@/lib/public-data';
import { getPublicAvatarUrl } from '@/lib/work-storage';

export function MemberCard({ member }: { member: PublicProfile }) {
  const { language, t } = useLanguage();
  const role = getLocalizedProfileRole(member, language);
  const bio = getLocalizedProfileBio(member, language);
  const avatarUrl = getPublicAvatarUrl(member.avatarUrl);

  return (
    <Link href={`/members/${member.slug}`} className="member-polaroid group polaroid-frame block p-3 pb-6 transition duration-300 focus-visible:rotate-0">
      {avatarUrl ? (
        <div role="img" aria-label={t('members.avatarAlt', { name: member.name, role })} className="aspect-[4/4.5] overflow-hidden border border-ink/10 bg-cover bg-center transition duration-500 group-hover:scale-[1.015]" style={{ backgroundImage: `url(${avatarUrl})` }} />
      ) : (
        <div role="img" aria-label={t('members.avatarAlt', { name: member.name, role })} className="y2k-cover-placeholder flex aspect-[4/4.5] items-center justify-center text-5xl font-semibold text-denim">
          {member.name.slice(0, 1).toUpperCase()}
        </div>
      )}
      <div className="pt-5">
        <p className="mono-label text-denim">ROLE / {role || t('members.roleFallback')}</p>
        <h3 className="display mt-2 text-2xl font-semibold tracking-[-.04em] text-ink">{member.name}</h3>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink/65">{bio || t('members.bioFallback')}</p>
      </div>
    </Link>
  );
}
