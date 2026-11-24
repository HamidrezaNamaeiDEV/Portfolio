export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'no-store')
  const kind = getRouterParam(event, 'kind')
  const id = getRouterParam(event, 'id')
  if (
    (kind !== 'skill' && kind !== 'project') ||
    !id ||
    !/^[a-zA-Z0-9_-]{1,80}$/.test(id)
  ) {
    throw createError({ statusCode: 404, statusMessage: 'Image not found.' })
  }

  const { publicImage } = await publicGraphql<{ publicImage: string | null }>(
    event,
    'query Image($kind: String!, $id: ID!) { publicImage(kind: $kind, id: $id) }',
    { kind, id },
  )
  const encoded = publicImage?.match(
    /^data:image\/webp;base64,([a-zA-Z0-9+/=]+)$/,
  )?.[1]
  if (!encoded)
    throw createError({ statusCode: 404, statusMessage: 'Image not found.' })

  setResponseHeader(event, 'Content-Type', 'image/webp')
  setResponseHeader(event, 'X-Content-Type-Options', 'nosniff')
  return Buffer.from(encoded, 'base64')
})
