'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { useLanguage } from './LanguageProvider';

export function HomeView() {
  const { t } = useLanguage();

  return (
    <main className="home-page-background min-h-screen pt-24">
      <section className="mx-auto flex min-h-[calc(100svh-6rem)] max-w-[1400px] items-center px-5 py-14 md:px-10 lg:py-20">
        <div className="reveal home-copy-glow relative z-10 mx-auto w-full max-w-[760px] text-center lg:mx-0 lg:w-[58%] lg:text-left">
          <div className="mb-7 flex flex-wrap justify-center gap-2 lg:justify-start">
            <span className="pixel-tag inline-flex -rotate-2 items-center gap-2 bg-lime px-3 py-2 text-[11px]">✦ GROUP 14</span>
            <span className="pixel-tag inline-flex px-3 py-2 text-[11px]">SUMMER / 2026</span>
            <span className="pixel-tag inline-flex px-3 py-2 text-[11px]">STATUS: CREATING</span>
          </div>

          <p className="mono-label text-[11px] text-denim">{t('home.eyebrow')} · {t('home.location')}</p>
          <h1 className="display mt-5 text-[clamp(4.2rem,9.2vw,9rem)] font-black leading-[.86]">
            {t('home.heroLine1')}
            <br />
            <span className="my-2 inline-block -rotate-1 rounded-full border-2 border-denim bg-white/40 px-[.12em] pb-[.08em] text-denim shadow-[7px_8px_0_rgba(143,201,255,.46)]">
              {t('home.heroLine2')}
            </span>
            {t('home.heroLine3')}
          </h1>
          <p className="mx-auto mt-9 max-w-2xl text-base font-semibold leading-8 text-ink/75 md:text-lg lg:mx-0">{t('home.intro')}</p>
          <p className="mono-label mx-auto mt-3 max-w-xl text-[10px] leading-5 text-denim/70 lg:mx-0">{t('home.aboutBody')}</p>

          <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
            <Link href="/members" className="jelly-button inline-flex min-h-12 items-center gap-2 bg-blush px-5 text-sm font-bold">
              {t('home.meetGroup')} <ArrowUpRight aria-hidden="true" size={16} />
            </Link>
            <Link href="/group-works" className="jelly-button inline-flex min-h-12 items-center gap-2 px-5 text-sm font-bold">
              {t('home.viewGroupWorks')} <ArrowUpRight aria-hidden="true" size={16} />
            </Link>
          </div>
        </div>
      </section>

      <div className="overflow-hidden border-y border-ink/15 bg-white/35 py-3" aria-hidden="true">
        <p className="mono-label whitespace-nowrap text-center text-[10px] text-denim">POLARIS YOUTH ✦ GROUP 14 ✦ CREATE TOGETHER ✦ SUMMER ARCHIVE ✦ POLARIS YOUTH ✦ GROUP 14 ✦ CREATE TOGETHER</p>
      </div>

      <footer className="mx-auto flex max-w-[1400px] flex-col justify-between gap-3 px-5 py-7 text-[10px] text-ink/55 md:flex-row md:px-10">
        <span className="mono-label">{t('footer.tagline')}</span>
        <span className="mono-label">2026 · A SMALL COLLECTION OF SHARED IDEAS</span>
      </footer>
    </main>
  );
}
