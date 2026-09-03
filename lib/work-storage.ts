import { getSupabaseConfig } from './supabase/env';

export type UploadKind = 'cover' | 'document';
export type UploadValidationError = 'unsupported' | 'tooLarge' | 'empty';

type FileRule = {
  extensions: readonly string[];
  mimeTypes: readonly string[];
  maxBytes: number;
};

export const uploadRules: Record<UploadKind, FileRule> = {
  cover: {
    extensions: ['jpg', 'jpeg', 'png', 'webp'],
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxBytes: 10 * 1024 * 1024,
  },
  document: {
    extensions: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'ppt', 'pptx', 'jpg', 'jpeg', 'png', 'webp'],
    mimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'image/jpeg',
      'image/png',
      'image/webp',
    ],
    maxBytes: 100 * 1024 * 1024,
  },
};

export function getFileExtension(filename: string) {
  const extension = filename.toLowerCase().split('.').pop() ?? '';
  return extension.replace(/[^a-z0-9]/g, '');
}

export function validateUploadFile(file: File, kind: UploadKind): UploadValidationError | null {
  const rule = uploadRules[kind];
  const extension = getFileExtension(file.name);

  if (!rule.extensions.includes(extension)) return 'unsupported';
  if (!file.type || !rule.mimeTypes.includes(file.type)) return 'unsupported';
  if (file.size <= 0) return 'empty';
  if (file.size > rule.maxBytes) return 'tooLarge';
  return null;
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function coverObjectPath(userId: string, workId: string, file: File) {
  return `${userId}/${workId}/cover.${getFileExtension(file.name)}`;
}

export function documentObjectPath(userId: string, workId: string, file: File) {
  return `${userId}/${workId}/document.${getFileExtension(file.name)}`;
}

export function isOwnedWorkPath(path: string | null, userId: string, workId: string) {
  return Boolean(path && !path.startsWith('http') && path.startsWith(`${userId}/${workId}/`));
}

export function getPublicCoverUrl(path: string | null) {
  return getPublicStorageUrl('covers', path);
}

export function getPublicAvatarUrl(path: string | null) {
  return getPublicStorageUrl('avatars', path);
}

function getPublicStorageUrl(bucket: 'covers' | 'avatars', path: string | null) {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;

  const { url } = getSupabaseConfig();
  const encodedPath = path.split('/').map(encodeURIComponent).join('/');
  return `${url}/storage/v1/object/public/${bucket}/${encodedPath}`;
}
