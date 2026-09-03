'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useLanguage } from './LanguageProvider';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import type { TranslationKey } from '@/lib/i18n';

const links = [
  { href: '/', label: 'nav.home' },
  { href: '/members', label: 'nav.members' },
  { href: '/group-works', label: 'nav.groupWorks' },
] satisfies { href: string; label: TranslationKey }[];

export function Navigation() {
  const [open, setOpen] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const { t } = useLanguage();
  const memberLink = authenticated
    ? { href: '/dashboard', label: 'nav.dashboard' as const }
    : { href: '/login', label: 'nav.login' as const };

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data }) => setAuthenticated(Boolean(data.user)));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthenticated(Boolean(session?.user));
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!open) return;
    firstLinkRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        requestAnimationFrame(() => menuButtonRef.current?.focus());
      }
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [open]);

  function isCurrent(href: string) {
    if (href === '/') return pathname === '/';
    if (href === '/group-works') return pathname.startsWith('/group-works');
    return pathname.startsWith(href);
  }

  function navLinkClass(href: string) {
    return `rounded-full border px-3 py-2 text-xs font-bold transition-all hover:-translate-y-0.5 hover:border-ink/20 hover:bg-white ${isCurrent(href) ? 'border-ink/20 bg-white shadow-[2px_3px_0_rgba(37,95,168,.14)]' : 'border-transparent'}`;
  }

  return (
    <header className="fixed top-0 z-50 w-full px-3 pt-3 md:px-6 md:pt-4">
      <div className="glass-panel mx-auto flex h-16 max-w-[1400px] items-center justify-between rounded-[20px] px-3 md:px-5">
        <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-3" aria-label="Polaris Youth Group 14 home">
          <span className="pixel-tag grid h-8 w-8 place-items-center bg-lime text-[11px] font-black shadow-[3px_3px_0_#255fa8]">14</span>
          <span className="grid leading-none">
            <strong className="text-xs tracking-[.08em]">POLARIS YOUTH</strong>
            <small className="mono-label mt-1 text-[8px]">GROUP PORTFOLIO</small>
          </span>
        </Link>
        <nav aria-label={t('nav.primaryLabel')} className="hidden items-center gap-1 md:flex">
          {links.map((link) => <Link key={link.href} href={link.href} aria-current={isCurrent(link.href) ? 'page' : undefined} className={navLinkClass(link.href)}>{t(link.label)}</Link>)}
          <Link href={memberLink.href} aria-current={isCurrent(memberLink.href) ? 'page' : undefined} className={`jelly-button ml-1 px-4 py-2 text-xs font-bold ${isCurrent(memberLink.href) ? 'bg-blush' : 'bg-white/60'}`}>
            {t(memberLink.label)}
          </Link>
          <LanguageSwitcher className="ml-2 border-l border-ink/10 pl-3" />
        </nav>
        <button
          type="button"
          ref={menuButtonRef}
          onClick={() => setOpen((current) => !current)}
          className="jelly-button inline-flex min-h-11 min-w-11 items-center justify-center bg-white/60 p-2 md:hidden"
          aria-label={open ? t('nav.closeMenu') : t('nav.openMenu')}
          aria-expanded={open}
          aria-controls="mobile-navigation"
        >
          {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
      </div>
      {open && (
        <nav id="mobile-navigation" aria-label={t('nav.mobileLabel')} className="glass-panel mx-auto mt-2 flex max-w-[1400px] flex-col gap-2 rounded-[20px] p-4 text-base md:hidden">
          {links.map((link, index) => <Link onClick={() => setOpen(false)} ref={index === 0 ? firstLinkRef : undefined} key={link.href} href={link.href} aria-current={isCurrent(link.href) ? 'page' : undefined} className={`rounded-2xl px-4 py-3 font-bold ${isCurrent(link.href) ? 'bg-white shadow-[2px_3px_0_rgba(37,95,168,.14)]' : 'hover:bg-white/60'}`}>{t(link.label)}</Link>)}
          <Link href={memberLink.href} onClick={() => setOpen(false)} aria-current={isCurrent(memberLink.href) ? 'page' : undefined} className={`rounded-2xl px-4 py-3 font-bold ${isCurrent(memberLink.href) ? 'bg-blush' : 'hover:bg-white/60'}`}>{t(memberLink.label)}</Link>
          <LanguageSwitcher className="mt-2 border-t border-ink/10 pt-3" />
        </nav>
      )}
    </header>
  );
}
