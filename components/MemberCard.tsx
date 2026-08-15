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
    <Link href={`/members/${member.slug}`} className="group block">
      {avatarUrl ? (
        <div role="img" aria-label={t('members.avatarAlt', { name: member.name, role })} className="aspect-[3/4] overflow-hidden bg-cover bg-center grayscale transition duration-700 group-hover:scale-[1.01] group-hover:grayscale-0" style={{ backgroundImage: `url(${avatarUrl})` }} />
      ) : (
        <div role="img" aria-label={t('members.avatarAlt', { name: member.name, role })} className="flex aspect-[3/4] items-center justify-center bg-neutral-200 text-5xl font-semibold text-neutral-500">
          {member.name.slice(0, 1).toUpperCase()}
        </div>
      )}
      <div className="pt-3">
        <h3 className="display text-xl font-semibold">{member.name}</h3>
        <p className="mt-1 text-xs uppercase tracking-wider text-neutral-500">{role || t('members.roleFallback')}</p>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-neutral-600">{bio || t('members.bioFallback')}</p>
      </div>
    </Link>
  );
}
