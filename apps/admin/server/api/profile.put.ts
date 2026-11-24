import type { ProfileRecord } from '@a/contracts'

export default defineEventHandler(async (event): Promise<ProfileRecord> => {
  requireAdminOrigin(event)
  await requireOwner(event)

  const { data: value } = await readAdminJson(event)
  const data = toProfileInput(value)
  const current = await getProfile(event)

  if (current) {
    await adminGraphql<{ record: { id: string } | null }>(
      event,
      `mutation SaveProfile($id: ID!, $data: SiteSettingsUpdateInput!) {
        record: updateSiteSettings(where: {id: $id}, data: $data) { id }
      }`,
      { id: current.id, data },
    )
  } else {
    await adminGraphql<{ record: { id: string } | null }>(
      event,
      `mutation CreateProfile($data: SiteSettingsCreateInput!) {
        record: createSiteSettings(data: $data) { id }
      }`,
      { data: { key: 'portfolio', ...data } },
    )
  }

  const profile = await getProfile(event)
  if (!profile) {
    throw createError({
      statusCode: 502,
      statusMessage: 'The profile could not be reloaded after saving.',
    })
  }
  return profile
})
