'use client';

import Link from 'next/link';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { MemberCard } from './MemberCard';
import { DatabaseWorkCard } from './DatabaseWorkCard';
import { useLanguage } from './LanguageProvider';
import type { PublicProfile, PublicWork } from '@/lib/public-data';

export function HomeView({ members, works }: { members: PublicProfile[]; works: PublicWork[] }) {
  const { t } = useLanguage();
  return <main className="grain pt-20">
    <section className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-[1400px] flex-col justify-between px-5 py-12 md:px-10 md:py-16">
      <div className="flex items-start justify-between">
        <p className="max-w-[190px] text-xs uppercase leading-relaxed tracking-widest text-neutral-500">{t('home.eyebrow')}<br />{t('home.location')}</p>
        <span className="hidden text-xs uppercase tracking-widest text-neutral-500 md:block">{t('home.scrollExplore')}</span>
      </div>
      <div className="reveal">
        <h1 className="display max-w-5xl text-[clamp(4.5rem,13vw,12rem)] font-bold leading-[.78]">{t('home.heroLine1')}<br /><span className="ml-[12vw]">{t('home.heroLine2')}</span></h1>
        <div className="mt-12 flex max-w-xl items-start gap-4 text-base leading-relaxed text-neutral-600 md:ml-[24vw]"><span aria-hidden="true" className="mt-2 h-2 w-2 shrink-0 rounded-full bg-black" />{t('home.intro')}</div>
      </div>
      <div className="flex items-end justify-between"><ArrowDownRight aria-hidden="true" size={42} strokeWidth={1} /><p className="text-right text-xs uppercase tracking-widest text-neutral-500">{t('home.scrollDown')}<br />{t('home.scrollFor')}</p></div>
    </section>

    <section className="mx-auto max-w-[1400px] px-5 py-24 md:px-10 md:py-36">
      <div className="grid gap-10 md:grid-cols-[1fr_2fr]">
        <p className="text-xs uppercase tracking-widest text-neutral-500">{t('home.aboutLabel')}</p>
        <div><h2 className="display max-w-4xl text-4xl font-semibold leading-tight md:text-7xl">{t('home.aboutTitle1')}<br />{t('home.aboutTitle2')}</h2><p className="mt-10 max-w-2xl text-lg leading-relaxed text-neutral-600">{t('home.aboutBody')}</p><Link href="/members" className="mt-10 inline-flex items-center gap-3 border-b border-black pb-2 text-sm font-medium">{t('home.meetGroup')} <ArrowUpRight aria-hidden="true" size={16} /></Link></div>
      </div>
    </section>

    <section className="border-y border-line">
      <div className="mx-auto max-w-[1400px] px-5 py-20 md:px-10 md:py-28">
        <div className="mb-10 flex items-end justify-between"><div><p className="text-xs uppercase tracking-widest text-neutral-500">{t('home.peopleLabel')}</p><h2 className="display mt-4 text-5xl font-semibold md:text-7xl">{t('home.peopleTitle')}</h2></div><Link href="/members" className="hidden text-sm underline md:block">{t('home.viewMembers')}</Link></div>
        {members.length > 0 ? <div className="grid grid-cols-1 gap-x-4 gap-y-10 sm:grid-cols-2 md:grid-cols-4 md:gap-6">{members.map((member) => <MemberCard key={member.id} member={member} />)}</div> : <p className="border border-black/10 px-5 py-8 text-neutral-500">{t('members.empty')}</p>}
        <Link href="/members" className="mt-10 inline-block text-sm underline md:hidden">{t('home.viewMembers')}</Link>
      </div>
    </section>

    <section className="mx-auto max-w-[1400px] px-5 py-24 md:px-10 md:py-36">
      <div className="mb-10 flex items-end justify-between"><div><p className="text-xs uppercase tracking-widest text-neutral-500">{t('home.workLabel')}</p><h2 className="display mt-4 text-5xl font-semibold md:text-7xl">{t('home.workTitle')}</h2></div><Link href="/group-works" className="hidden text-sm underline md:block">{t('home.viewGroupWorks')}</Link></div>
      {works.length > 0 ? <div className="grid gap-12 md:grid-cols-2">{works.map((work) => <DatabaseWorkCard key={work.id} work={work} />)}</div> : <p className="border border-black/10 px-5 py-8 text-neutral-500">{t('groupWorks.empty')}</p>}
      <Link href="/group-works" className="mt-10 inline-block text-sm underline md:hidden">{t('home.viewGroupWorks')}</Link>
    </section>

    <footer className="bg-ink px-5 py-16 text-white md:px-10 md:py-24">
      <div className="mx-auto flex max-w-[1400px] flex-col justify-between gap-16 md:flex-row">
        <div><div className="display text-3xl font-bold">FORM/24</div><p className="mt-4 max-w-xs text-sm leading-relaxed text-neutral-400">{t('footer.tagline')}</p></div>
        <div className="flex gap-12 text-sm"><div><p className="mb-4 text-xs uppercase tracking-widest text-neutral-500">{t('footer.explore')}</p><Link className="block py-1 hover:text-lime" href="/members">{t('nav.members')}</Link><Link className="block py-1 hover:text-lime" href="/group-works">{t('nav.groupWorks')}</Link></div><div><p className="mb-4 text-xs uppercase tracking-widest text-neutral-500">{t('footer.sayHello')}</p><a className="block py-1 hover:text-lime" href="mailto:hello@form24.studio">hello@form24.studio</a><p className="py-1 text-neutral-400">{t('footer.location')}</p></div></div>
      </div>
    </footer>
  </main>;
}
