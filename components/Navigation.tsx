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
    if (href === '/group-works') return pathname.startsWith('/group-works') || pathname.startsWith('/works');
    return pathname.startsWith(href);
  }

  function navLinkClass(href: string) {
    return `transition-opacity hover:opacity-50 ${isCurrent(href) ? 'font-semibold underline underline-offset-4' : ''}`;
  }

  return (
    <header className="fixed top-0 z-50 w-full border-b border-black/10 bg-[#f5f4f0]/90 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-[1400px] items-center justify-between px-5 md:px-10">
        <Link href="/" onClick={() => setOpen(false)} className="display text-xl font-bold tracking-tight" aria-label="FORM 24 home">
          FORM<span className="text-neutral-400">/</span>24
        </Link>
        <nav aria-label={t('nav.primaryLabel')} className="hidden items-center gap-8 text-sm font-medium md:flex">
          {links.map((link) => <Link key={link.href} href={link.href} aria-current={isCurrent(link.href) ? 'page' : undefined} className={navLinkClass(link.href)}>{t(link.label)}</Link>)}
          <Link href={memberLink.href} aria-current={isCurrent(memberLink.href) ? 'page' : undefined} className={`rounded-sm border border-black px-3 py-2 transition-colors hover:bg-black hover:text-white ${isCurrent(memberLink.href) ? 'bg-black text-white' : ''}`}>
            {t(memberLink.label)}
          </Link>
          <LanguageSwitcher className="border-l border-black/10 pl-6" />
        </nav>
        <button
          type="button"
          ref={menuButtonRef}
          onClick={() => setOpen((current) => !current)}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-sm p-2 md:hidden"
          aria-label={open ? t('nav.closeMenu') : t('nav.openMenu')}
          aria-expanded={open}
          aria-controls="mobile-navigation"
        >
          {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
      </div>
      {open && (
        <nav id="mobile-navigation" aria-label={t('nav.mobileLabel')} className="flex flex-col gap-5 border-t border-black/10 px-5 py-6 text-lg md:hidden">
          {links.map((link, index) => <Link onClick={() => setOpen(false)} ref={index === 0 ? firstLinkRef : undefined} key={link.href} href={link.href} aria-current={isCurrent(link.href) ? 'page' : undefined} className={isCurrent(link.href) ? 'font-semibold underline underline-offset-4' : undefined}>{t(link.label)}</Link>)}
          <Link href={memberLink.href} onClick={() => setOpen(false)} aria-current={isCurrent(memberLink.href) ? 'page' : undefined} className={isCurrent(memberLink.href) ? 'font-semibold underline underline-offset-4' : undefined}>{t(memberLink.label)}</Link>
          <LanguageSwitcher className="border-t border-black/10 pt-5" />
        </nav>
      )}
    </header>
  );
}
