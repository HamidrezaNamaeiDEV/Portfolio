export default defineEventHandler(async (event) => {
  requireAdminOrigin(event)
  await requireOwner(event)
  const { kind: requestedKind, id, data } = await readAdminJson(event)
  const kind = contentKind(requestedKind)
  if (id !== undefined && !isContentId(id)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid record identifier.',
    })
  }
  const { type } = operations[kind]
  const input = toKeystoneInput(kind, data, id !== undefined)
  const mutation = id
    ? `mutation Save($id: ID!, $data: ${type}UpdateInput!) {
        record: update${type}(where: {id: $id}, data: $data) { id }
      }`
    : `mutation Save($data: ${type}CreateInput!) {
        record: create${type}(data: $data) { id }
      }`
  const { record } = await adminGraphql<{ record: { id: string } | null }>(
    event,
    mutation,
    { id, data: input },
  )
  if (!record)
    throw createError({
      statusCode: 404,
      statusMessage: 'Record does not exist.',
    })
  return record
})
