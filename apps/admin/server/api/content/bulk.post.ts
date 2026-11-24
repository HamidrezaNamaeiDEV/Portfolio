import { isContentId } from '../../utils/content'

export default defineEventHandler(async (event) => {
  requireAdminOrigin(event)
  await requireOwner(event)

  const body = await readAdminJson(event)
  const { ids, status, visible } = body
  if (
    !Array.isArray(ids) ||
    ids.length < 1 ||
    ids.length > 100 ||
    !ids.every(isContentId) ||
    new Set(ids).size !== ids.length
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Choose between 1 and 100 unique skills.',
    })
  }

  const data: Record<string, unknown> = {}
  if (status !== undefined) {
    if (status !== 'draft' && status !== 'published') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Check the publication status.',
      })
    }
    data.status = status
  }
  if (visible !== undefined) {
    if (typeof visible !== 'boolean') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Check the visibility value.',
      })
    }
    data.visible = visible
  }
  if (Object.keys(data).length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Choose a publication or visibility change.',
    })
  }

  const { skills } = await adminGraphql<{ skills: Array<{ id: string }> }>(
    event,
    `query SelectedSkills($ids: [ID!]!) {
      skills(where: {id: {in: $ids}}) { id }
    }`,
    { ids },
  )
  if (skills.length !== ids.length) {
    throw createError({
      statusCode: 404,
      statusMessage: 'One or more selected skills no longer exist.',
    })
  }

  const { records } = await adminGraphql<{
    records: Array<{ id: string } | null>
  }>(
    event,
    `mutation BulkUpdateSkills($data: [SkillUpdateArgs!]!) {
      records: updateSkills(data: $data) { id }
    }`,
    { data: ids.map((id) => ({ where: { id }, data })) },
  )
  if (
    !Array.isArray(records) ||
    records.length !== ids.length ||
    records.some((record) => !record)
  ) {
    throw createError({
      statusCode: 409,
      statusMessage: 'The selected skills could not all be updated.',
    })
  }

  return { updated: records.length }
})
