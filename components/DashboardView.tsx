'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Edit3, ExternalLink, LogOut, Plus, Trash2 } from 'lucide-react';
import { useLanguage } from './LanguageProvider';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { getLocalizedWorkTitle, type DashboardProfile, type DashboardWork } from '@/lib/dashboard-types';
import type { TranslationKey } from '@/lib/i18n';
import { getPublicCoverUrl, isOwnedWorkPath } from '@/lib/work-storage';

const workTypeLabels = {
  link: 'work.type.link',
  file: 'work.type.file',
  pdf: 'work.type.pdf',
  ppt: 'work.type.ppt',
} satisfies Record<DashboardWork['type'], TranslationKey>;

type DashboardViewProps = {
  profile: DashboardProfile;
  works: DashboardWork[];
  worksError: boolean;
  saved: boolean;
};

export function DashboardView({ profile, works, worksError, saved }: DashboardViewProps) {
  const { language, t } = useLanguage();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const name = profile.name || t('dashboard.profileFallback');

  async function handleLogout() {
    setLoggingOut(true);
    setLogoutError('');
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      setLogoutError(t('dashboard.logoutError'));
      setLoggingOut(false);
      return;
    }

    router.replace('/login');
    router.refresh();
  }

  async function handleDelete(work: DashboardWork) {
    if (!window.confirm(t('dashboard.deleteConfirm'))) return;

    setDeletingId(work.id);
    setDeleteError('');

    const supabase = createSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.replace('/login');
      router.refresh();
      return;
    }

    const coverPaths = isOwnedWorkPath(work.coverUrl, user.id, work.id) ? [work.coverUrl as string] : [];
    const workPaths = [work.fileUrl, work.previewUrl]
      .filter((path): path is string => isOwnedWorkPath(path, user.id, work.id));

    const [{ error: coverDeleteError }, { error: workDeleteError }] = await Promise.all([
      coverPaths.length > 0 ? supabase.storage.from('covers').remove(coverPaths) : Promise.resolve({ error: null }),
      workPaths.length > 0 ? supabase.storage.from('works').remove(workPaths) : Promise.resolve({ error: null }),
    ]);

    if (coverDeleteError || workDeleteError) {
      setDeleteError(t('dashboard.fileDeleteError'));
      setDeletingId(null);
      return;
    }

    const { error } = await supabase.from('works').delete().eq('id', work.id).eq('owner_id', user.id);

    if (error) {
      setDeleteError(t('dashboard.deleteError'));
      setDeletingId(null);
      return;
    }

    setDeletingId(null);
    router.refresh();
  }

  return (
    <main className="min-h-screen pt-20">
      <section className="mx-auto max-w-[1280px] px-5 py-16 md:px-10 md:py-24">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mono-label text-denim">{t('dashboard.eyebrow')}</p>
            <h1 className="display mt-5 text-6xl font-semibold leading-[.84] tracking-[-.06em] text-ink md:text-8xl">{t('dashboard.title')}</h1>
          </div>
          <Link
            href="/dashboard/works/new"
            className="jelly-button inline-flex h-11 items-center justify-center gap-2 bg-ink px-4 text-sm font-medium text-white transition-opacity hover:opacity-80"
          >
            <Plus aria-hidden="true" size={16} />
            {t('dashboard.addWork')}
          </Link>
        </div>
        <div className="glass-panel mt-12 rounded-[1.8rem] p-6 md:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-5">
              {profile.avatarUrl ? (
                <div
                  role="img"
                  aria-label={t('dashboard.avatarAlt', { name })}
                  className="h-20 w-20 rounded-2xl border border-white bg-cover bg-center shadow-[4px_5px_0_rgb(37_95_168_/_18%)]"
                  style={{ backgroundImage: `url(${profile.avatarUrl})` }}
                />
              ) : (
                <div aria-hidden="true" className="flex h-20 w-20 items-center justify-center rounded-2xl bg-ink text-2xl font-semibold text-white shadow-[4px_5px_0_rgb(37_95_168_/_18%)]">
                  {name.slice(0, 1).toUpperCase()}
                </div>
              )}
              <div>
                <p className="display text-3xl font-semibold tracking-[-.04em] text-ink">{t('dashboard.welcome', { name })}</p>
                <p className="break-anywhere mt-2 text-sm text-ink/60">{t('dashboard.emailLabel')}: {profile.email}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="jelly-button inline-flex h-11 items-center justify-center gap-2 px-4 text-sm font-medium text-ink disabled:cursor-not-allowed disabled:opacity-50"
            >
              <LogOut aria-hidden="true" size={16} />
              {loggingOut ? t('dashboard.loggingOut') : t('dashboard.logout')}
            </button>
          </div>
          {logoutError && <p role="alert" className="mt-4 text-sm text-red-700">{logoutError}</p>}
        </div>
        <section className="mt-16">
          <div className="mb-8 flex flex-col gap-3 border-b border-denim/20 pb-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mono-label text-denim">{t('dashboard.worksLabel')}</p>
              <h2 className="display mt-3 text-4xl font-semibold tracking-[-.05em] text-ink md:text-6xl">{t('dashboard.myWorks')}</h2>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-ink/60">{t('dashboard.placeholder')}</p>
          </div>

          {worksError && <p role="alert" className="text-sm text-red-700">{t('dashboard.loadError')}</p>}
          {saved && <p role="status" className="mb-5 border border-green-800/20 bg-green-50 px-4 py-3 text-sm text-green-900">{t('dashboard.saved')}</p>}
          {deleteError && <p role="alert" className="mb-5 text-sm text-red-700">{deleteError}</p>}

          {!worksError && works.length === 0 && (
            <div className="soft-card rounded-[1.8rem] px-5 py-10 md:px-8">
              <h3 className="text-2xl font-semibold">{t('dashboard.emptyTitle')}</h3>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-neutral-500">{t('dashboard.emptyBody')}</p>
            </div>
          )}

          <div className="grid gap-5">
            {works.map((work) => {
              const title = getLocalizedWorkTitle(work, language) || t('dashboard.untitled');
              const coverUrl = getPublicCoverUrl(work.coverUrl, work.updatedAt);
              return (
                <article key={work.id} className="soft-card grid gap-5 rounded-[1.6rem] p-4 md:grid-cols-[160px_1fr_auto] md:items-center">
                  {coverUrl ? (
                    <div
                      role="img"
                      aria-label={title}
                      className="aspect-[4/3] rounded-2xl bg-cover bg-center"
                      style={{ backgroundImage: `url(${coverUrl})` }}
                    />
                  ) : (
                    <div className="y2k-cover-placeholder flex aspect-[4/3] items-center justify-center rounded-2xl text-xs uppercase tracking-widest text-denim">{t('dashboard.noCover')}</div>
                  )}
                  <div>
                    <div className="mb-3 flex flex-wrap gap-2 text-xs uppercase tracking-widest text-neutral-500">
                      <span>{t(workTypeLabels[work.type])}</span>
                      <span>/</span>
                      <span>{work.year}</span>
                      <span>/</span>
                      <span>{work.isGroupWork ? t('dashboard.group') : t('dashboard.personal')}</span>
                      <span>/</span>
                      <span>{work.published ? t('dashboard.published') : t('dashboard.draft')}</span>
                    </div>
                    <h3 className="display break-anywhere text-3xl font-semibold tracking-[-.04em] text-ink">{title}</h3>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {work.published && (
                      <Link
                        href={`/works/${work.id}`}
                        className="jelly-button inline-flex h-11 items-center justify-center gap-2 px-3 text-sm font-medium text-ink"
                      >
                        <ExternalLink aria-hidden="true" size={15} />
                        {t('dashboard.view')}
                      </Link>
                    )}
                    <Link
                      href={`/dashboard/works/${work.id}/edit`}
                      className="jelly-button inline-flex h-11 items-center justify-center gap-2 px-3 text-sm font-medium text-ink"
                    >
                      <Edit3 aria-hidden="true" size={15} />
                      {t('dashboard.edit')}
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(work)}
                      disabled={deletingId === work.id}
                      className="jelly-button inline-flex h-11 items-center justify-center gap-2 px-3 text-sm font-medium text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Trash2 aria-hidden="true" size={15} />
                      {deletingId === work.id ? t('dashboard.deleting') : t('dashboard.delete')}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </section>
    </main>
  );
}
