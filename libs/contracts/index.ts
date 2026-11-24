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
  companyLogo: string
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
  url: string
  cover: string
  skills: NamedRecord[]
}

export interface ProfileRecord {
  id: string
  displayName: string
  headline: string
  biography: string
  profileImage: string
  contactEmail: string
  phone: string
  location: string
  websiteUrl: string
  githubUrl: string
  gitlabUrl: string
  linkedinUrl: string
  xUrl: string
  status: 'draft' | 'published'
  visible: boolean
}

export interface PublicProfile extends Omit<
  ProfileRecord,
  'id' | 'profileImage' | 'status' | 'visible'
> {
  profileImage: string | null
}

export interface AdminContent {
  categories: TaxonomyRecord[]
  proficiencies: TaxonomyRecord[]
  skills: SkillRecord[]
  experiences: ExperienceRecord[]
  projects: ProjectRecord[]
}

export interface PortfolioPreview {
  published: PublicPortfolio
  draftCandidates: Pick<
    AdminContent,
    'categories' | 'proficiencies' | 'skills' | 'experiences' | 'projects'
  > & {
    profile: ProfileRecord | null
  }
}

export interface PublicPortfolio {
  profile: PublicProfile | null
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
  experiences: Array<
    ExperienceFields & { description: string; companyLogo: string | null }
  >
  projects: Array<
    Pick<
      ProjectRecord,
      'id' | 'name' | 'slug' | 'url' | 'description' | 'skills'
    > & {
      cover: string | null
    }
  >
}
