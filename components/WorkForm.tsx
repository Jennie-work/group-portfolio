'use client';

import Link from 'next/link';
import { FormEvent, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, FileUp, Save } from 'lucide-react';
import { useLanguage } from './LanguageProvider';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import type { DashboardWork, WorkFormValues, WorkType } from '@/lib/dashboard-types';
import type { TranslationKey } from '@/lib/i18n';
import type { ContributorFormValue, PublicProfile } from '@/lib/public-data';
import {
  coverObjectPath,
  documentObjectPath,
  formatFileSize,
  isOwnedWorkPath,
  presentationObjectPath,
  previewObjectPath,
  validateUploadFile,
  type UploadKind,
  type UploadValidationError,
} from '@/lib/work-storage';

type WorkFormProps = {
  mode: 'create' | 'edit';
  ownerId: string;
  work?: DashboardWork;
  memberOptions: PublicProfile[];
  initialContributors?: ContributorFormValue[];
};

type UploadItem = {
  bucket: 'covers' | 'works';
  path: string;
  file: File;
  previousPath: string | null;
};

function makeSlug(text: string) {
  const slug = text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || `work-${Date.now()}`;
}

function initialValues(work?: DashboardWork): WorkFormValues {
  return {
    titleZh: work?.titleZh ?? work?.title ?? '',
    titleEn: work?.titleEn ?? work?.title ?? '',
    descriptionZh: work?.descriptionZh ?? work?.description ?? '',
    descriptionEn: work?.descriptionEn ?? work?.description ?? '',
    year: String(work?.year ?? new Date().getFullYear()),
    categoryZh: work?.categoryZh ?? work?.category ?? '',
    categoryEn: work?.categoryEn ?? work?.category ?? '',
    type: work?.type ?? 'link',
    externalUrl: work?.externalUrl ?? '',
    isGroupWork: work?.isGroupWork ?? false,
    published: work?.published ?? false,
  };
}

const validationKeys: Record<UploadKind, Record<UploadValidationError, TranslationKey>> = {
  cover: { unsupported: 'workForm.coverUnsupported', tooLarge: 'workForm.coverTooLarge', empty: 'workForm.fileEmpty' },
  pdf: { unsupported: 'workForm.pdfUnsupported', tooLarge: 'workForm.pdfTooLarge', empty: 'workForm.fileEmpty' },
  presentation: { unsupported: 'workForm.presentationUnsupported', tooLarge: 'workForm.presentationTooLarge', empty: 'workForm.fileEmpty' },
  preview: { unsupported: 'workForm.previewUnsupported', tooLarge: 'workForm.previewTooLarge', empty: 'workForm.fileEmpty' },
};

export function WorkForm({ mode, ownerId, work, memberOptions, initialContributors = [] }: WorkFormProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const submitLock = useRef(false);
  const [values, setValues] = useState<WorkFormValues>(() => initialValues(work));
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [presentationFile, setPresentationFile] = useState<File | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'creating' | 'uploading' | 'updating'>('idle');
  const [error, setError] = useState('');
  const [contributors, setContributors] = useState<Record<string, string>>(() => Object.fromEntries(
    initialContributors
      .filter((contributor) => contributor.profileId !== ownerId)
      .map((contributor) => [contributor.profileId, contributor.role]),
  ));
  const ownerProfile = memberOptions.find((member) => member.id === ownerId);
  const selectableMembers = memberOptions.filter((member) => member.id !== ownerId);
  const hasExistingPdf = mode === 'edit' && work?.type === 'pdf' && Boolean(work.fileUrl);
  const hasExistingPresentation = mode === 'edit' && work?.type === 'ppt' && Boolean(work.fileUrl);

  function updateValue<Key extends keyof WorkFormValues>(key: Key, value: WorkFormValues[Key]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function toggleContributor(profileId: string, selected: boolean) {
    setContributors((current) => {
      if (selected) return { ...current, [profileId]: current[profileId] ?? '' };
      const next = { ...current };
      delete next[profileId];
      return next;
    });
  }

  function updateContributorRole(profileId: string, role: string) {
    setContributors((current) => ({ ...current, [profileId]: role }));
  }

  function selectFile(kind: UploadKind, file: File | null) {
    setError('');
    if (!file) {
      if (kind === 'cover') setCoverFile(null);
      if (kind === 'pdf') setPdfFile(null);
      if (kind === 'presentation') setPresentationFile(null);
      if (kind === 'preview') setPreviewFile(null);
      return;
    }

    const validationError = validateUploadFile(file, kind);
    if (validationError) {
      setError(t(validationKeys[kind][validationError]));
      return;
    }

    if (kind === 'cover') setCoverFile(file);
    if (kind === 'pdf') setPdfFile(file);
    if (kind === 'presentation') setPresentationFile(file);
    if (kind === 'preview') setPreviewFile(file);
  }

  async function removeObjects(bucket: 'covers' | 'works', paths: string[]) {
    if (paths.length === 0) return;
    const supabase = createSupabaseBrowserClient();
    await supabase.storage.from(bucket).remove(paths);
  }

  async function cleanNewUploads(items: UploadItem[], uploadedPaths: Set<string>) {
    const coverPaths = items
      .filter((item) => item.bucket === 'covers' && uploadedPaths.has(item.path) && item.path !== item.previousPath)
      .map((item) => item.path);
    const workPaths = items
      .filter((item) => item.bucket === 'works' && uploadedPaths.has(item.path) && item.path !== item.previousPath)
      .map((item) => item.path);
    await Promise.all([removeObjects('covers', coverPaths), removeObjects('works', workPaths)]);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || submitLock.current) return;

    submitLock.current = true;
    setSaving(true);
    setPhase(mode === 'create' ? 'creating' : 'uploading');
    setError('');

    if (values.type === 'pdf' && !pdfFile && !hasExistingPdf) {
      setError(t('workForm.pdfRequired'));
      setSaving(false);
      setPhase('idle');
      submitLock.current = false;
      return;
    }

    if (values.type === 'ppt' && !presentationFile && !hasExistingPresentation) {
      setError(t('workForm.presentationRequired'));
      setSaving(false);
      setPhase('idle');
      submitLock.current = false;
      return;
    }

    if (values.type === 'link') {
      try {
        const url = new URL(values.externalUrl.trim());
        if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error('Unsupported protocol');
      } catch {
        setError(t('workForm.externalUrlInvalid'));
        setSaving(false);
        setPhase('idle');
        submitLock.current = false;
        return;
      }
    }

    const supabase = createSupabaseBrowserClient();
    const title = values.titleZh.trim() || values.titleEn.trim();
    const description = values.descriptionZh.trim() || values.descriptionEn.trim();
    const category = values.categoryZh.trim() || values.categoryEn.trim();
    const metadata = {
      title,
      title_zh: values.titleZh.trim(),
      title_en: values.titleEn.trim(),
      description,
      description_zh: values.descriptionZh.trim(),
      description_en: values.descriptionEn.trim(),
      category,
      category_zh: values.categoryZh.trim(),
      category_en: values.categoryEn.trim(),
      year: Number(values.year),
      type: values.type,
      external_url: values.type === 'link' ? values.externalUrl.trim() || null : null,
      is_group_work: values.isGroupWork,
    };

    let workId = work?.id ?? '';
    let createdRecord = false;

    if (mode === 'create') {
      const { data, error: createError } = await supabase
        .from('works')
        .insert({
          ...metadata,
          slug: `${makeSlug(values.titleEn || values.titleZh)}-${Date.now()}`,
          owner_id: ownerId,
          published: values.type === 'link' ? values.published : false,
        })
        .select('id')
        .single<{ id: string }>();

      if (createError || !data) {
        setError(t('workForm.createError'));
        setSaving(false);
        setPhase('idle');
        submitLock.current = false;
        return;
      }

      workId = data.id;
      createdRecord = true;
    }

    if (mode === 'edit' && work && values.type !== work.type) {
      const { error: transitionError } = await supabase
        .from('works')
        .update({
          ...metadata,
          file_url: null,
          preview_url: null,
          published: false,
        })
        .eq('id', workId)
        .eq('owner_id', ownerId);

      if (transitionError) {
        setError(t('workForm.updateError'));
        setSaving(false);
        setPhase('idle');
        submitLock.current = false;
        return;
      }

      const obsoleteTypeFiles = [work.fileUrl, work.previewUrl]
        .filter((path): path is string => isOwnedWorkPath(path, ownerId, workId));
      await removeObjects('works', obsoleteTypeFiles);
    }

    let nextCoverPath = work?.coverUrl ?? null;
    let nextFilePath = values.type === work?.type ? work?.fileUrl ?? null : null;
    let nextPreviewPath = values.type === 'ppt' && work?.type === 'ppt' ? work.previewUrl : null;
    const uploads: UploadItem[] = [];

    if (coverFile) {
      nextCoverPath = coverObjectPath(ownerId, workId, coverFile);
      uploads.push({ bucket: 'covers', path: nextCoverPath, file: coverFile, previousPath: work?.coverUrl ?? null });
    }

    if (values.type === 'pdf' && pdfFile) {
      nextFilePath = documentObjectPath(ownerId, workId);
      uploads.push({ bucket: 'works', path: nextFilePath, file: pdfFile, previousPath: work?.fileUrl ?? null });
    }

    if (values.type === 'ppt' && presentationFile) {
      nextFilePath = presentationObjectPath(ownerId, workId, presentationFile);
      uploads.push({ bucket: 'works', path: nextFilePath, file: presentationFile, previousPath: work?.fileUrl ?? null });
    }

    if (values.type === 'ppt' && previewFile) {
      nextPreviewPath = previewObjectPath(ownerId, workId);
      uploads.push({ bucket: 'works', path: nextPreviewPath, file: previewFile, previousPath: work?.previewUrl ?? null });
    }

    if (values.type === 'link') {
      nextFilePath = null;
      nextPreviewPath = null;
    } else if (values.type === 'pdf') {
      nextPreviewPath = null;
    }

    setPhase('uploading');
    const uploadedPaths = new Set<string>();

    for (const item of uploads) {
      const { error: uploadError } = await supabase.storage
        .from(item.bucket)
        .upload(item.path, item.file, { upsert: true, contentType: item.file.type || undefined });

      if (uploadError) {
        await cleanNewUploads(uploads, uploadedPaths);
        if (createdRecord) await supabase.from('works').delete().eq('id', workId).eq('owner_id', ownerId);
        setError(t('workForm.uploadError'));
        setSaving(false);
        setPhase('idle');
        submitLock.current = false;
        return;
      }
      uploadedPaths.add(item.path);
    }

    setPhase('updating');
    const { error: updateError } = await supabase
      .from('works')
      .update({
        ...metadata,
        cover_url: nextCoverPath,
        file_url: nextFilePath,
        preview_url: nextPreviewPath,
        published: values.published,
      })
      .eq('id', workId)
      .eq('owner_id', ownerId);

    if (updateError) {
      await cleanNewUploads(uploads, uploadedPaths);
      if (createdRecord) await supabase.from('works').delete().eq('id', workId).eq('owner_id', ownerId);
      setError(t(mode === 'create' ? 'workForm.createError' : 'workForm.updateError'));
      setSaving(false);
      setPhase('idle');
      submitLock.current = false;
      return;
    }

    const contributorRows = values.isGroupWork
      ? Object.entries(contributors).map(([profileId, role]) => ({ profile_id: profileId, role: role.trim() }))
      : [];
    const { error: contributorError } = await supabase.rpc('sync_work_contributors', {
      target_work_id: workId,
      contributor_rows: contributorRows,
    });

    if (contributorError) {
      if (createdRecord) {
        await cleanNewUploads(uploads, uploadedPaths);
        await supabase.from('works').delete().eq('id', workId).eq('owner_id', ownerId);
      }
      setError(t('workForm.contributorSyncError'));
      setSaving(false);
      setPhase('idle');
      submitLock.current = false;
      return;
    }

    if (work) {
      const obsoleteCover = isOwnedWorkPath(work.coverUrl, ownerId, workId) && work.coverUrl !== nextCoverPath ? [work.coverUrl as string] : [];
      const obsoleteWorkFiles = [work.fileUrl, work.previewUrl]
        .filter((path): path is string => isOwnedWorkPath(path, ownerId, workId) && path !== nextFilePath && path !== nextPreviewPath);
      await Promise.all([removeObjects('covers', obsoleteCover), removeObjects('works', obsoleteWorkFiles)]);
    }

    router.replace('/dashboard?status=saved');
    router.refresh();
  }

  const submitLabel = phase === 'uploading'
    ? t('workForm.uploading')
    : phase === 'creating' || phase === 'updating'
      ? t('workForm.saving')
      : t(mode === 'create' ? 'workForm.save' : 'workForm.update');

  return (
    <main className="min-h-screen pt-20">
      <section className="mx-auto max-w-[900px] px-5 py-16 md:px-10 md:py-24">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm underline underline-offset-4">
          <ArrowLeft aria-hidden="true" size={16} />
          {t('workForm.back')}
        </Link>
        <p className="mt-12 text-xs uppercase tracking-widest text-neutral-500">{t(mode === 'create' ? 'workForm.newEyebrow' : 'workForm.editEyebrow')}</p>
        <h1 className="display mt-5 text-5xl font-semibold leading-none md:text-7xl">{t(mode === 'create' ? 'workForm.newTitle' : 'workForm.editTitle')}</h1>

        <form onSubmit={handleSubmit} aria-describedby={error ? 'work-form-error' : undefined} className="mt-12 grid gap-8 border-t border-black/10 pt-8">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label={t('workForm.titleZh')} value={values.titleZh} onChange={(value) => updateValue('titleZh', value)} maxLength={200} required />
            <Field label={t('workForm.titleEn')} value={values.titleEn} onChange={(value) => updateValue('titleEn', value)} maxLength={200} required />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <TextArea label={t('workForm.descriptionZh')} value={values.descriptionZh} onChange={(value) => updateValue('descriptionZh', value)} maxLength={5000} />
            <TextArea label={t('workForm.descriptionEn')} value={values.descriptionEn} onChange={(value) => updateValue('descriptionEn', value)} maxLength={5000} />
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <Field label={t('workForm.year')} type="number" min="1900" max="2100" value={values.year} onChange={(value) => updateValue('year', value)} required />
            <Field label={t('workForm.categoryZh')} value={values.categoryZh} onChange={(value) => updateValue('categoryZh', value)} maxLength={120} />
            <Field label={t('workForm.categoryEn')} value={values.categoryEn} onChange={(value) => updateValue('categoryEn', value)} maxLength={120} />
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <label className="grid gap-2 text-sm font-medium">
              {t('workForm.type')}
              <select value={values.type} onChange={(event) => updateValue('type', event.target.value as WorkType)} className="h-12 rounded-sm border border-black/15 bg-white/60 px-4 text-base outline-none">
                <option value="link">{t('work.type.link')}</option>
                <option value="pdf">{t('work.type.pdf')}</option>
                <option value="ppt">{t('work.type.ppt')}</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm font-medium">
              {t('workForm.statusType')}
              <select value={values.isGroupWork ? 'group' : 'personal'} onChange={(event) => updateValue('isGroupWork', event.target.value === 'group')} className="h-12 rounded-sm border border-black/15 bg-white/60 px-4 text-base outline-none">
                <option value="personal">{t('workForm.personal')}</option>
                <option value="group">{t('workForm.group')}</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm font-medium">
              {t('workForm.visibility')}
              <select value={values.published ? 'published' : 'draft'} onChange={(event) => updateValue('published', event.target.value === 'published')} className="h-12 rounded-sm border border-black/15 bg-white/60 px-4 text-base outline-none">
                <option value="draft">{t('workForm.draft')}</option>
                <option value="published">{t('workForm.published')}</option>
              </select>
            </label>
          </div>

          {values.isGroupWork && (
            <fieldset className="grid gap-4 border border-black/10 bg-white/30 p-5 md:p-7">
              <legend className="px-2 text-sm font-medium">{t('workForm.contributors')}</legend>
              <p className="text-sm leading-relaxed text-neutral-500">{t('workForm.contributorsHint')}</p>
              {ownerProfile && (
                <div className="grid gap-3 border-t border-black/10 pt-4">
                  <label className="flex items-center gap-3 text-sm font-medium">
                    <input type="checkbox" checked disabled readOnly />
                    <span>{ownerProfile.name} · {t('workForm.ownerTag')}</span>
                  </label>
                </div>
              )}
              {selectableMembers.length > 0 ? selectableMembers.map((member) => {
                const selected = Object.hasOwn(contributors, member.id);
                return (
                  <div key={member.id} className="grid gap-3 border-t border-black/10 pt-4 sm:grid-cols-[minmax(0,1fr)_minmax(220px,1fr)] sm:items-center">
                    <label className="flex items-center gap-3 text-sm font-medium">
                      <input type="checkbox" checked={selected} onChange={(event) => toggleContributor(member.id, event.target.checked)} />
                      <span>{member.name}</span>
                    </label>
                    {selected && (
                      <label className="grid gap-2 text-xs text-neutral-500">
                        {t('workForm.contributorRole', { name: member.name })}
                        <input type="text" value={contributors[member.id] ?? ''} onChange={(event) => updateContributorRole(member.id, event.target.value)} maxLength={160} className="h-11 rounded-sm border border-black/15 bg-white/60 px-3 text-sm text-black outline-none" />
                      </label>
                    )}
                  </div>
                );
              }) : <p className="text-sm text-neutral-500">{t('workForm.noMembers')}</p>}
            </fieldset>
          )}

          {values.type === 'link' ? (
            <Field label={t('workForm.externalUrl')} type="url" value={values.externalUrl} onChange={(value) => updateValue('externalUrl', value)} required />
          ) : (
            <div className="grid gap-6 border border-black/10 bg-white/30 p-5 md:p-7">
              {values.type === 'pdf' ? (
                <FilePicker id="pdf-file" label={t('workForm.pdfFile')} hint={t('workForm.pdfHint')} accept=".pdf,application/pdf" selectedFile={pdfFile} existingPath={work?.type === 'pdf' ? work.fileUrl : null} onSelect={(file) => selectFile('pdf', file)} required={!hasExistingPdf} />
              ) : (
                <>
                  <FilePicker id="presentation-file" label={t('workForm.presentationFile')} hint={t('workForm.presentationHint')} accept=".ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation" selectedFile={presentationFile} existingPath={work?.type === 'ppt' ? work.fileUrl : null} onSelect={(file) => selectFile('presentation', file)} required={!hasExistingPresentation} />
                  <FilePicker id="preview-file" label={t('workForm.previewFile')} hint={t('workForm.previewHint')} accept=".pdf,application/pdf" selectedFile={previewFile} existingPath={work?.type === 'ppt' ? work.previewUrl : null} onSelect={(file) => selectFile('preview', file)} />
                </>
              )}
            </div>
          )}

          <div className="border border-black/10 bg-white/30 p-5 md:p-7">
            <FilePicker id="cover-file" label={t('workForm.coverFile')} hint={t('workForm.coverHint')} accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" selectedFile={coverFile} existingPath={work?.coverUrl} onSelect={(file) => selectFile('cover', file)} />
          </div>

          {error && <p id="work-form-error" role="alert" aria-live="assertive" className="text-sm text-red-700">{error}</p>}

          <button type="submit" disabled={saving} className="inline-flex h-12 w-fit items-center justify-center gap-3 rounded-sm bg-ink px-5 text-sm font-medium text-white transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50">
            <Save aria-hidden="true" size={16} />
            {submitLabel}
          </button>
        </form>
      </section>
    </main>
  );
}

type FilePickerProps = {
  id: string;
  label: string;
  hint: string;
  accept: string;
  selectedFile: File | null;
  existingPath?: string | null;
  onSelect: (file: File | null) => void;
  required?: boolean;
};

function FilePicker({ id, label, hint, accept, selectedFile, existingPath, onSelect, required = false }: FilePickerProps) {
  const { t } = useLanguage();
  const existingName = existingPath?.split('/').pop();

  return (
    <div className="grid gap-2">
      <label htmlFor={id} className="flex items-center gap-2 text-sm font-medium">
        <FileUp aria-hidden="true" size={16} />
        {label}{required ? ' *' : ''}
      </label>
      <p id={`${id}-hint`} className="text-xs leading-relaxed text-neutral-500">
        {hint}
      </p>
      <input id={id} type="file" accept={accept} required={required} aria-describedby={`${id}-hint ${selectedFile || existingName ? `${id}-status` : ''}`.trim()} onChange={(event) => onSelect(event.target.files?.[0] ?? null)} className="block w-full rounded-sm border border-black/15 bg-white/60 p-3 text-sm file:mr-4 file:rounded-sm file:border-0 file:bg-black file:px-3 file:py-2 file:text-xs file:font-medium file:text-white" />
      {selectedFile ? (
        <p id={`${id}-status`} className="break-anywhere text-sm" role="status">{t('workForm.selectedFile', { name: selectedFile.name, size: formatFileSize(selectedFile.size) })}</p>
      ) : existingName ? (
        <p id={`${id}-status`} className="break-anywhere text-sm text-neutral-500">{t('workForm.existingFile', { name: existingName })}</p>
      ) : null}
    </div>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  min?: string;
  max?: string;
  maxLength?: number;
  required?: boolean;
};

function Field({ label, value, onChange, type = 'text', min, max, maxLength, required = false }: FieldProps) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}{required && <span aria-hidden="true"> *</span>}
      <input type={type} min={min} max={max} maxLength={maxLength} required={required} value={value} onChange={(event) => onChange(event.target.value)} className="h-12 rounded-sm border border-black/15 bg-white/60 px-4 text-base outline-none transition-colors focus:border-black" />
    </label>
  );
}

function TextArea({ label, value, onChange, maxLength }: Omit<FieldProps, 'type' | 'min' | 'max' | 'required'>) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <textarea value={value} maxLength={maxLength} onChange={(event) => onChange(event.target.value)} rows={5} className="rounded-sm border border-black/15 bg-white/60 px-4 py-3 text-base outline-none transition-colors focus:border-black" />
    </label>
  );
}
