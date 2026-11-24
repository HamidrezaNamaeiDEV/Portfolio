import { list } from '@keystone-6/core'
import { denyAll } from '@keystone-6/core/access'
import {
  checkbox,
  integer,
  password,
  relationship,
  select,
  text,
  timestamp,
} from '@keystone-6/core/fields'
import { imageField } from './media.ts'

export const isOwner = ({
  session,
}: {
  session?: { itemId?: string; data?: { isOwner?: boolean } }
}) => !!session?.itemId && session.data?.isOwner === true

const ownerAccess = { operation: isOwner }
const title = (unique = false) =>
  text({
    isIndexed: unique ? 'unique' : undefined,
    validation: { isRequired: true, length: { max: 160 } },
    hooks: {
      resolveInput: ({ resolvedFieldData }) =>
        typeof resolvedFieldData === 'string'
          ? resolvedFieldData.trim()
          : resolvedFieldData,
    },
  })
const copy = (max: number) => text({ validation: { length: { max } } })
const year = (required = false) =>
  integer({ validation: { isRequired: required, min: 1, max: 9999 } })
const month = (required = false) =>
  integer({ validation: { isRequired: required, min: 1, max: 12 } })
const profileLinks = [
  'websiteUrl',
  'githubUrl',
  'gitlabUrl',
  'linkedinUrl',
  'xUrl',
] as const

function isExternalUrl(value: unknown): boolean {
  if (value === undefined || value === null || value === '') return true
  if (typeof value !== 'string' || value.length > 2048) return false

  try {
    const url = new URL(value)
    return (
      (url.protocol === 'https:' || url.protocol === 'http:') &&
      !url.username &&
      !url.password
    )
  } catch {
    return false
  }
}

function isContactEmail(value: unknown): boolean {
  return (
    value === undefined ||
    value === null ||
    value === '' ||
    (typeof value === 'string' &&
      value.length <= 254 &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
  )
}

function editorialFields() {
  return {
    sortOrder: integer({
      defaultValue: 0,
      validation: { isRequired: true, min: 0 },
    }),
    status: select({
      type: 'string',
      options: ['draft', 'published'],
      defaultValue: 'draft',
      validation: { isRequired: true },
    }),
    visible: checkbox({ defaultValue: true }),
  }
}

export const lists = {
  FoundationProbe: list({
    access: denyAll,
    fields: {
      marker: text({ validation: { isRequired: true }, isIndexed: 'unique' }),
      value: text({ validation: { isRequired: true } }),
    },
  }),
  User: list({
    access: {
      operation: {
        query: isOwner,
        create: () => false,
        update: () => false,
        delete: () => false,
      },
    },
    graphql: { omit: { create: true, update: true, delete: true } },
    fields: {
      email: text({
        isIndexed: 'unique',
        validation: {
          isRequired: true,
          length: { max: 254 },
          match: {
            regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            explanation: 'Enter a valid email address.',
          },
        },
        hooks: {
          resolveInput: ({ resolvedFieldData }) =>
            typeof resolvedFieldData === 'string'
              ? resolvedFieldData.trim().toLowerCase()
              : resolvedFieldData,
        },
      }),
      password: password({
        validation: { isRequired: true, length: { min: 16, max: 128 } },
      }),
      isOwner: checkbox({ defaultValue: false }),
    },
  }),
  EditorialSession: list({
    access: denyAll,
    graphql: { omit: true },
    fields: {
      keyHash: text({ isIndexed: 'unique', validation: { isRequired: true } }),
      user: relationship({ ref: 'User', db: { foreignKey: true } }),
      expiresAt: timestamp({
        isIndexed: true,
        validation: { isRequired: true },
      }),
    },
  }),
  SiteSettings: list({
    access: ownerAccess,
    graphql: { plural: 'Profiles' },
    fields: {
      key: text({ isIndexed: 'unique', defaultValue: 'portfolio' }),
      displayName: copy(120),
      headline: copy(240),
      biography: copy(8000),
      profileImage: imageField(),
      contactEmail: copy(254),
      phone: copy(80),
      location: copy(160),
      websiteUrl: copy(2048),
      githubUrl: copy(2048),
      gitlabUrl: copy(2048),
      linkedinUrl: copy(2048),
      xUrl: copy(2048),
      ...editorialFields(),
    },
    hooks: {
      validate: ({ operation, resolvedData, item, addValidationError }) => {
        if (operation === 'delete') return
        const value = (field: string) => resolvedData[field] ?? item?.[field]

        for (const field of profileLinks) {
          if (!isExternalUrl(value(field))) {
            addValidationError(
              'Enter an HTTP or HTTPS link without sign-in details.',
            )
          }
        }
        if (!isContactEmail(value('contactEmail'))) {
          addValidationError('Enter a valid contact email address.')
        }
      },
    },
  }),
  SkillCategory: list({
    access: ownerAccess,
    graphql: { plural: 'SkillCategories' },
    fields: {
      name: title(true),
      description: copy(1200),
      ...editorialFields(),
    },
  }),
  Proficiency: list({
    access: ownerAccess,
    graphql: { plural: 'Proficiencies' },
    fields: {
      name: title(true),
      description: copy(1200),
      ...editorialFields(),
    },
  }),
  Skill: list({
    access: ownerAccess,
    fields: {
      name: title(true),
      description: copy(1200),
      category: relationship({
        ref: 'SkillCategory',
        db: { foreignKey: true },
      }),
      proficiency: relationship({
        ref: 'Proficiency',
        db: { foreignKey: true },
      }),
      projects: relationship({ ref: 'Project.skills', many: true }),
      experiences: relationship({ ref: 'Experience.skills', many: true }),
      logo: imageField(),
      ...editorialFields(),
    },
  }),
  Experience: list({
    access: ownerAccess,
    fields: {
      company: title(),
      position: title(),
      startYear: year(true),
      startMonth: month(true),
      endYear: year(),
      endMonth: month(),
      employmentStatus: select({
        type: 'string',
        options: ['active', 'ended'],
      }),
      description: copy(3000),
      responsibilities: copy(3000),
      achievements: copy(3000),
      skills: relationship({ ref: 'Skill.experiences', many: true }),
      companyLogo: imageField(),
      ...editorialFields(),
    },
    hooks: {
      validate: ({ operation, resolvedData, item, addValidationError }) => {
        if (operation === 'delete') return
        const startYear = resolvedData.startYear ?? item?.startYear
        const startMonth = resolvedData.startMonth ?? item?.startMonth
        const endYear =
          resolvedData.endYear === undefined
            ? item?.endYear
            : resolvedData.endYear
        const endMonth =
          resolvedData.endMonth === undefined
            ? item?.endMonth
            : resolvedData.endMonth

        if ((endYear == null) !== (endMonth == null)) {
          addValidationError(
            'Enter both the end year and month, or leave both blank.',
          )
        } else if (
          endYear != null &&
          endMonth != null &&
          startYear != null &&
          startMonth != null &&
          (endYear < startYear ||
            (endYear === startYear && endMonth < startMonth))
        ) {
          addValidationError(
            'The end month must be on or after the start month.',
          )
        }
      },
    },
  }),
  Project: list({
    access: ownerAccess,
    fields: {
      name: title(),
      slug: text({
        isIndexed: 'unique',
        validation: {
          isRequired: true,
          length: { max: 100 },
          match: {
            regex: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
            explanation: 'Use lowercase letters, numbers and single hyphens.',
          },
        },
        hooks: {
          resolveInput: ({ resolvedFieldData }) =>
            typeof resolvedFieldData === 'string'
              ? resolvedFieldData.trim()
              : resolvedFieldData,
        },
      }),
      url: copy(2048),
      description: copy(500),
      cover: imageField(),
      skills: relationship({ ref: 'Skill.projects', many: true }),
      ...editorialFields(),
    },
    hooks: {
      validate: ({ operation, resolvedData, item, addValidationError }) => {
        if (
          operation !== 'delete' &&
          !isExternalUrl(resolvedData.url ?? item?.url)
        ) {
          addValidationError(
            'Enter an HTTP or HTTPS link without sign-in details.',
          )
        }
      },
    },
  }),
}
