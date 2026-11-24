import { contentKinds, type ContentKind } from '@a/contracts'

interface Operations {
  list: string
  type: string
  selection: string
  text: Record<string, number>
  integers?: string[]
  single?: string[]
  many?: string[]
  image?: string
}

const editorial = 'id description status visible sortOrder'
const taxonomy = {
  selection: `${editorial} name`,
  text: { name: 120 },
}
export const operations: Record<ContentKind, Operations> = {
  categories: { ...taxonomy, list: 'skillCategories', type: 'SkillCategory' },
  proficiencies: { ...taxonomy, list: 'proficiencies', type: 'Proficiency' },
  skills: {
    list: 'skills',
    type: 'Skill',
    selection: `${editorial} name logo category { id name } proficiency { id name } projects { id name }`,
    text: { name: 120 },
    single: ['category', 'proficiency'],
    many: ['project'],
    image: 'logo',
  },
  experiences: {
    list: 'experiences',
    type: 'Experience',
    selection: `${editorial} company position startYear startMonth endYear endMonth employmentStatus
      responsibilities achievements skills { id name }`,
    text: {
      company: 160,
      position: 160,
      responsibilities: 8000,
      achievements: 8000,
    },
    integers: ['startYear', 'startMonth', 'endYear', 'endMonth'],
    many: ['skill'],
  },
  projects: {
    list: 'projects',
    type: 'Project',
    selection: `${editorial} name slug cover skills { id name }`,
    text: { name: 120, slug: 120 },
    many: ['skill'],
    image: 'cover',
  },
}

function invalid(field: string): never {
  throw createError({
    statusCode: 400,
    statusMessage: `Check the ${field} field.`,
  })
}

export function isContentId(id: unknown): id is string {
  return typeof id === 'string' && /^[a-zA-Z0-9_-]{1,80}$/.test(id)
}

export function contentKind(value: unknown): ContentKind {
  const kind = contentKinds.find((item) => item === value)
  return kind ?? invalid('content type')
}

export function toKeystoneInput(
  kind: ContentKind,
  value: unknown,
  update: boolean,
) {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    invalid('content')
  const source = value as Record<string, unknown>
  const operation = operations[kind]
  const data: Record<string, unknown> = {}

  for (const [field, limit] of Object.entries({
    description: 8000,
    ...operation.text,
  })) {
    const text = source[field]
    if (text === undefined) continue
    if (typeof text !== 'string' || text.length > limit) invalid(field)
    data[field] = text.trim()
  }
  for (const field of ['sortOrder', ...(operation.integers ?? [])]) {
    const integer = source[field]
    if (integer === undefined) continue
    if (
      integer !== null &&
      (typeof integer !== 'number' ||
        !Number.isInteger(integer) ||
        integer < 0 ||
        integer > 999999)
    )
      invalid(field)
    data[field] = integer
  }
  if (source.status !== undefined) {
    if (source.status !== 'draft' && source.status !== 'published')
      invalid('publication status')
    data.status = source.status
  }
  if (source.visible !== undefined) {
    if (typeof source.visible !== 'boolean') invalid('visibility')
    data.visible = source.visible
  }
  if (kind === 'experiences' && source.employmentStatus !== undefined) {
    if (
      source.employmentStatus !== null &&
      source.employmentStatus !== 'active' &&
      source.employmentStatus !== 'ended'
    )
      invalid('employment status')
    data.employmentStatus = source.employmentStatus
  }
  if (operation.image && source[operation.image] !== undefined) {
    const image = source[operation.image]
    if (typeof image !== 'string' || image.length > 350_000)
      invalid(operation.image)
    data[operation.image] = image
  }

  for (const field of operation.single ?? []) {
    const id = source[`${field}Id`]
    if (id === undefined) continue
    if (isContentId(id)) data[field] = { connect: { id } }
    else if (id === null && update) data[field] = { disconnect: true }
    else if (id !== null) invalid(field)
  }
  for (const field of operation.many ?? []) {
    const ids = source[`${field}Ids`]
    if (ids === undefined) continue
    if (!Array.isArray(ids) || ids.length > 500 || !ids.every(isContentId))
      invalid(`${field}s`)
    data[`${field}s`] = {
      [update ? 'set' : 'connect']: [...new Set(ids)].map((id) => ({ id })),
    }
  }
  return data
}
