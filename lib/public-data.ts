import type { Language } from './i18n';
import type { DashboardWork, WorkRow } from './dashboard-types';

export type PublicProfileRow = {
  id: string;
  slug: string;
  name: string;
  role: string;
  role_zh: string | null;
  role_en: string | null;
  bio: string;
  bio_zh: string | null;
  bio_en: string | null;
  avatar_url: string | null;
  skills: string[];
  skills_zh: string[] | null;
  skills_en: string[] | null;
};

export type PublicProfile = {
  id: string;
  slug: string;
  name: string;
  role: string;
  roleZh: string | null;
  roleEn: string | null;
  bio: string;
  bioZh: string | null;
  bioEn: string | null;
  avatarUrl: string | null;
  skills: string[];
  skillsZh: string[] | null;
  skillsEn: string[] | null;
};

export type WorkContributorRow = {
  work_id: string;
  profile_id: string;
  role: string;
};

export type PublicWorkRow = WorkRow & {
  owner_id: string;
};

export type WorkContributor = {
  profile: PublicProfile;
  role: string;
};

export type PublicWork = DashboardWork & {
  owner: PublicProfile | null;
  contributors: WorkContributor[];
};

export type ContributorFormValue = {
  profileId: string;
  role: string;
};

export function mapPublicProfile(row: PublicProfileRow): PublicProfile {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    role: row.role,
    roleZh: row.role_zh,
    roleEn: row.role_en,
    bio: row.bio,
    bioZh: row.bio_zh,
    bioEn: row.bio_en,
    avatarUrl: row.avatar_url,
    skills: row.skills ?? [],
    skillsZh: row.skills_zh,
    skillsEn: row.skills_en,
  };
}

export function getLocalizedProfileRole(profile: PublicProfile, language: Language) {
  return (language === 'zh' ? profile.roleZh : profile.roleEn) || profile.role;
}

export function getLocalizedProfileBio(profile: PublicProfile, language: Language) {
  return (language === 'zh' ? profile.bioZh : profile.bioEn) || profile.bio;
}

export function getLocalizedProfileSkills(profile: PublicProfile, language: Language) {
  return (language === 'zh' ? profile.skillsZh : profile.skillsEn) || profile.skills;
}

export function attachWorkPeople(
  works: DashboardWork[],
  profiles: PublicProfile[],
  contributorRows: WorkContributorRow[],
  ownerIds: Record<string, string>,
): PublicWork[] {
  const profilesById = new Map(profiles.map((profile) => [profile.id, profile]));

  return works.map((work) => ({
    ...work,
    owner: profilesById.get(ownerIds[work.id]) ?? null,
    contributors: contributorRows
      .filter((row) => row.work_id === work.id)
      .map((row) => ({ profile: profilesById.get(row.profile_id), role: row.role }))
      .filter((item): item is WorkContributor => Boolean(item.profile)),
  }));
}

export const publicProfileSelect = 'id, slug, name, role, role_zh, role_en, bio, bio_zh, bio_en, avatar_url, skills, skills_zh, skills_en';
export const publicWorkSelect = 'id, slug, title, title_zh, title_en, description, description_zh, description_en, category, category_zh, category_en, type, year, cover_url, file_url, preview_url, external_url, is_group_work, published, updated_at, owner_id';
