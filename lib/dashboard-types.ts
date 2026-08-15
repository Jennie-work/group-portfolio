export type WorkType = 'link' | 'pdf' | 'ppt';

export type DashboardProfile = {
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
};

export type DashboardWork = {
  id: string;
  slug: string;
  title: string;
  titleZh: string | null;
  titleEn: string | null;
  description: string;
  descriptionZh: string | null;
  descriptionEn: string | null;
  category: string;
  categoryZh: string | null;
  categoryEn: string | null;
  type: WorkType;
  year: number;
  coverUrl: string | null;
  fileUrl: string | null;
  previewUrl: string | null;
  externalUrl: string | null;
  isGroupWork: boolean;
  published: boolean;
};

export type WorkFormValues = {
  titleZh: string;
  titleEn: string;
  descriptionZh: string;
  descriptionEn: string;
  year: string;
  categoryZh: string;
  categoryEn: string;
  type: WorkType;
  externalUrl: string;
  isGroupWork: boolean;
  published: boolean;
};

export type WorkRow = {
  id: string;
  slug: string;
  title: string;
  title_zh: string | null;
  title_en: string | null;
  description: string;
  description_zh: string | null;
  description_en: string | null;
  category: string;
  category_zh: string | null;
  category_en: string | null;
  type: WorkType;
  year: number;
  cover_url: string | null;
  file_url: string | null;
  preview_url: string | null;
  external_url: string | null;
  is_group_work: boolean;
  published: boolean;
};

export function mapWorkRow(row: WorkRow): DashboardWork {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    titleZh: row.title_zh,
    titleEn: row.title_en,
    description: row.description,
    descriptionZh: row.description_zh,
    descriptionEn: row.description_en,
    category: row.category,
    categoryZh: row.category_zh,
    categoryEn: row.category_en,
    type: row.type,
    year: row.year,
    coverUrl: row.cover_url,
    fileUrl: row.file_url,
    previewUrl: row.preview_url,
    externalUrl: row.external_url,
    isGroupWork: row.is_group_work,
    published: row.published,
  };
}

export function getLocalizedWorkTitle(work: DashboardWork, language: 'zh' | 'en') {
  return (language === 'zh' ? work.titleZh : work.titleEn) || work.title;
}

export function getLocalizedWorkDescription(work: DashboardWork, language: 'zh' | 'en') {
  return (language === 'zh' ? work.descriptionZh : work.descriptionEn) || work.description;
}
