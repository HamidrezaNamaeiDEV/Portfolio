import type { ProfileRecord } from '@a/contracts'
import type { H3Event } from 'h3'

const textFields = {
  displayName: 120,
  headline: 240,
  biography: 8000,
  contactEmail: 254,
  phone: 80,
  location: 160,
  websiteUrl: 2048,
  githubUrl: 2048,
  gitlabUrl: 2048,
  linkedinUrl: 2048,
  xUrl: 2048,
} as const

const profileFields = new Set([
  ...Object.keys(textFields),
  'profileImage',
  'status',
  'visible',
])

export const profileSelection = `id displayName headline biography profileImage
  contactEmail phone location websiteUrl githubUrl gitlabUrl linkedinUrl xUrl
  status visible`

function invalid(field: string): never {
  throw createError({
    statusCode: 400,
    statusMessage: `Check the ${field} field.`,
  })
}

export function toProfileInput(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return invalid('profile')
  }

  const source = value as Record<string, unknown>
  const data: Record<string, unknown> = {}

  for (const field of Object.keys(source)) {
    if (!profileFields.has(field)) invalid('profile')
  }

  for (const [field, maxLength] of Object.entries(textFields)) {
    const text = source[field]
    if (text === undefined) continue
    if (typeof text !== 'string' || text.length > maxLength) invalid(field)
    data[field] = text.trim()
  }

  if (source.profileImage !== undefined) {
    if (
      typeof source.profileImage !== 'string' ||
      source.profileImage.length > 350_000
    ) {
      invalid('profile image')
    }
    data.profileImage = source.profileImage
  }
  if (source.status !== undefined) {
    if (source.status !== 'draft' && source.status !== 'published') {
      invalid('publication status')
    }
    data.status = source.status
  }
  if (source.visible !== undefined) {
    if (typeof source.visible !== 'boolean') invalid('visibility')
    data.visible = source.visible
  }

  if (Object.keys(data).length === 0) invalid('profile')
  return data
}

export async function getProfile(event: H3Event) {
  const { siteSettings } = await adminGraphql<{
    siteSettings: ProfileRecord[]
  }>(
    event,
    `{ siteSettings: profiles(where: {key: {equals: "portfolio"}}, take: 1) { ${profileSelection} } }`,
  )
  return siteSettings[0] ?? null
}
