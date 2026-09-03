'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight, Disc3, Headphones, Sparkles } from 'lucide-react';
import { useLanguage } from './LanguageProvider';

export function HomeView() {
  const { t } = useLanguage();

  return (
    <main className="pt-24">
      <section className="mx-auto grid min-h-[calc(100svh-6rem)] max-w-[1400px] items-center gap-10 px-5 py-14 md:px-10 lg:grid-cols-[minmax(0,1.28fr)_minmax(300px,.72fr)] lg:gap-20 lg:py-20">
        <div className="reveal relative z-10 text-center lg:text-left">
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

        <aside className="relative mx-auto min-h-[390px] w-full max-w-[430px] lg:min-h-[500px]" aria-label={t('home.collageLabel')}>
          <p className="mono-label absolute right-2 top-3 z-20 text-right text-[10px] leading-5 text-denim">ONLINE ARCHIVE<br />NO. 02 / 14</p>
          <div className="polaroid-frame float-soft absolute right-8 top-14 w-[76%] rotate-[5deg] p-3 pb-6 md:right-10 md:top-16 md:p-4 md:pb-7">
            <div className="relative aspect-[4/3] overflow-hidden border border-ink/20">
              <Image src="/assets/group-work-cover-y2k.png" alt="Blue Y2K collage with headphones, a compact disc, and stars" fill sizes="(max-width: 768px) 320px, 380px" className="object-cover" priority />
              <strong className="pixel-tag absolute left-1/2 top-4 -translate-x-1/2 whitespace-nowrap bg-white/85 px-3 py-2 text-xs md:text-sm">OUR SUMMER.zip</strong>
            </div>
            <p className="mt-4 text-sm font-black">{t('home.collageCaption')}</p>
            <p className="mono-label mt-1 text-[9px] text-denim">BCQNS2_GROUP14 / 2026</p>
          </div>

          <span className="soft-card float-soft absolute left-1 top-1 grid h-24 w-24 -rotate-12 place-items-center rounded-full bg-white/70 text-denim md:h-28 md:w-28" aria-hidden="true">
            <Disc3 size={54} strokeWidth={1.35} />
          </span>
          <span className="soft-card float-soft absolute bottom-8 right-0 grid h-20 w-24 rotate-[8deg] place-items-center rounded-3xl bg-blush" aria-hidden="true">
            <Headphones size={44} strokeWidth={1.5} />
          </span>
          <span className="soft-card absolute bottom-16 left-1 grid h-16 w-20 -rotate-[8deg] place-items-center bg-lime" aria-hidden="true">
            <Sparkles size={34} strokeWidth={1.6} />
          </span>
          <span className="twinkle absolute left-[38%] top-[18%] text-3xl text-white drop-shadow-[0_0_12px_rgba(37,95,168,.45)]" aria-hidden="true">✧</span>
        </aside>
      </section>

      <div className="overflow-hidden border-y border-ink/15 bg-white/35 py-3" aria-hidden="true">
        <p className="mono-label whitespace-nowrap text-center text-[10px] text-denim">BEICHEN YOUTH ✦ GROUP 14 ✦ CREATE TOGETHER ✦ SUMMER ARCHIVE ✦ BEICHEN YOUTH ✦ GROUP 14 ✦ CREATE TOGETHER</p>
      </div>

      <footer className="mx-auto flex max-w-[1400px] flex-col justify-between gap-3 px-5 py-7 text-[10px] text-ink/55 md:flex-row md:px-10">
        <span className="mono-label">{t('footer.tagline')}</span>
        <span className="mono-label">2026 · A SMALL COLLECTION OF SHARED IDEAS</span>
      </footer>
    </main>
  );
}
