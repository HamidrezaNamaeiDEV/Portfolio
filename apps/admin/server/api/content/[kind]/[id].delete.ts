export default defineEventHandler(async (event) => {
  requireAdminOrigin(event)
  await requireOwner(event)
  const kind = contentKind(getRouterParam(event, 'kind'))
  const id = getRouterParam(event, 'id')
  if (!isContentId(id)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid record identifier.',
    })
  }
  const { type } = operations[kind]
  const { record } = await adminGraphql<{ record: { id: string } | null }>(
    event,
    `mutation Remove($id: ID!) { record: delete${type}(where: {id: $id}) { id } }`,
    { id },
  )
  if (!record)
    throw createError({
      statusCode: 404,
      statusMessage: 'Record does not exist.',
    })
  return { ok: true }
})
