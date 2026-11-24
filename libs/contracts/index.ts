export const persianMonths = [
  'Farvardin',
  'Ordibehesht',
  'Khordad',
  'Tir',
  'Mordad',
  'Shahrivar',
  'Mehr',
  'Aban',
  'Azar',
  'Dey',
  'Bahman',
  'Esfand',
] as const

export function formatPersianMonth(year: number, month: number): string {
  return `${persianMonths[month - 1]} ${year}`
}

export const contentKinds = [
  'categories',
  'proficiencies',
  'skills',
  'experiences',
  'projects',
] as const
export type ContentKind = (typeof contentKinds)[number]

export interface NamedRecord {
  id: string
  name: string
}
interface EditorialFields {
  description: string
  status: 'draft' | 'published'
  visible: boolean
  sortOrder: number
}
export interface TaxonomyRecord extends NamedRecord, EditorialFields {}
export interface SkillRecord extends NamedRecord, EditorialFields {
  category: NamedRecord | null
  proficiency: NamedRecord | null
  logo: string
  projects: NamedRecord[]
}
export interface ExperienceFields {
  id: string
  company: string
  position: string
  startYear: number
  startMonth: number
  endYear: number | null
  endMonth: number | null
  employmentStatus: 'active' | 'ended' | null
  responsibilities: string
  achievements: string
  skills: NamedRecord[]
}
export interface ExperienceRecord extends ExperienceFields, EditorialFields {}
export interface ProjectRecord extends NamedRecord, EditorialFields {
  slug: string
  cover: string
  skills: NamedRecord[]
}

export interface AdminContent {
  categories: TaxonomyRecord[]
  proficiencies: TaxonomyRecord[]
  skills: SkillRecord[]
  experiences: ExperienceRecord[]
  projects: ProjectRecord[]
}

export interface PublicPortfolio {
  categories: Array<NamedRecord & { description: string }>
  skills: Array<
    Pick<
      SkillRecord,
      'id' | 'name' | 'category' | 'proficiency' | 'description'
    > & {
      logo: string | null
      projects: Array<NamedRecord & { slug: string }>
    }
  >
  experiences: Array<ExperienceFields & { description: string }>
  projects: Array<
    Pick<ProjectRecord, 'id' | 'name' | 'slug' | 'description' | 'skills'> & {
      cover: string | null
    }
  >
}
