import type {
  ContentKind,
  ExperienceRecord,
  ProjectRecord,
  SkillRecord,
  TaxonomyRecord,
} from '@a/contracts'

export type ContentRecord =
  TaxonomyRecord | SkillRecord | ExperienceRecord | ProjectRecord

export const sections = {
  skills: { title: 'Technology stack', singular: 'skill', empty: 'skills' },
  experiences: {
    title: 'Work experience',
    singular: 'experience',
    empty: 'experience records',
  },
  projects: { title: 'Projects', singular: 'project', empty: 'projects' },
  categories: {
    title: 'Skill categories',
    singular: 'category',
    empty: 'categories',
  },
  proficiencies: {
    title: 'Proficiency levels',
    singular: 'proficiency level',
    empty: 'proficiency levels',
  },
} satisfies Record<
  ContentKind,
  { title: string; singular: string; empty: string }
>

export interface EditorDraft {
  name: string
  description: string
  status: 'draft' | 'published'
  visible: boolean
  sortOrder: number
  company: string
  position: string
  startYear: number | null
  startMonth: number | null
  endYear: number | null
  endMonth: number | null
  employmentStatus: 'active' | 'ended' | null
  responsibilities: string
  achievements: string
  slug: string
  categoryId: string | null
  proficiencyId: string | null
  projectIds: string[]
  skillIds: string[]
  image: string
}

export function recordName(item: ContentRecord) {
  return 'company' in item ? item.company : item.name
}

export function recordDetail(item: ContentRecord) {
  if ('company' in item) return item.position
  if ('slug' in item) return item.slug
  if ('proficiency' in item) {
    return [item.category?.name, item.proficiency?.name]
      .filter(Boolean)
      .join(' · ')
  }
  return item.description
}

export function prepareDraft(item?: ContentRecord): EditorDraft {
  const experience = item && 'company' in item ? item : undefined
  const skill = item && 'proficiency' in item ? item : undefined
  const project = item && 'slug' in item ? item : undefined

  return {
    name: (item && 'name' in item ? item.name : '') ?? '',
    description: item?.description ?? '',
    status: item?.status ?? 'draft',
    visible: item?.visible ?? true,
    sortOrder: item?.sortOrder ?? 0,
    company: experience?.company ?? '',
    position: experience?.position ?? '',
    startYear: experience?.startYear ?? null,
    startMonth: experience?.startMonth ?? null,
    endYear: experience?.endYear ?? null,
    endMonth: experience?.endMonth ?? null,
    employmentStatus: experience?.employmentStatus ?? null,
    responsibilities: experience?.responsibilities ?? '',
    achievements: experience?.achievements ?? '',
    slug: project?.slug ?? '',
    categoryId: skill?.category?.id ?? null,
    proficiencyId: skill?.proficiency?.id ?? null,
    projectIds: skill?.projects.map(({ id }) => id) ?? [],
    skillIds:
      (project?.skills ?? experience?.skills)?.map(({ id }) => id) ?? [],
    image: skill?.logo ?? project?.cover ?? '',
  }
}

export function draftError(draft: EditorDraft, kind: ContentKind) {
  if (kind !== 'experiences') {
    return draft.name.trim() ? '' : 'Enter a name.'
  }
  if (!draft.company.trim() || !draft.position.trim()) {
    return 'Enter the company and position.'
  }
  if (!draft.startYear || !draft.startMonth) {
    return 'Choose a start month and enter its Persian year.'
  }
  if (Boolean(draft.endYear) !== Boolean(draft.endMonth)) {
    return 'Enter both parts of the end date or leave both blank.'
  }
  if (
    draft.endYear &&
    draft.endMonth &&
    draft.endYear * 12 + draft.endMonth <
      draft.startYear * 12 + draft.startMonth
  ) {
    return 'The end date must be on or after the start date.'
  }
  return ''
}

export function draftPayload(
  draft: EditorDraft,
  kind: ContentKind,
  originalImage: string,
): Record<string, unknown> {
  const common = {
    description: draft.description.trim(),
    visible: draft.visible,
    sortOrder: draft.sortOrder,
    status: draft.status,
  }
  if (kind === 'experiences') {
    return {
      ...common,
      company: draft.company.trim(),
      position: draft.position.trim(),
      startYear: draft.startYear,
      startMonth: draft.startMonth,
      endYear: draft.endYear || null,
      endMonth: draft.endMonth,
      employmentStatus: draft.employmentStatus,
      responsibilities: draft.responsibilities.trim(),
      achievements: draft.achievements.trim(),
      skillIds: draft.skillIds,
    }
  }
  const named = { ...common, name: draft.name.trim() }
  if (kind === 'skills') {
    return {
      ...named,
      categoryId: draft.categoryId,
      proficiencyId: draft.proficiencyId,
      projectIds: draft.projectIds,
      ...(draft.image !== originalImage ? { logo: draft.image } : {}),
    }
  }
  if (kind === 'projects') {
    return {
      ...named,
      slug: draft.slug.trim(),
      skillIds: draft.skillIds,
      ...(draft.image !== originalImage ? { cover: draft.image } : {}),
    }
  }
  return named
}
