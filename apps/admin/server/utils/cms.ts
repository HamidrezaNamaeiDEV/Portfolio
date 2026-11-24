import type { H3Event } from 'h3'

const cookieName = 'keystonejs-session'

export function privateResponse(event: H3Event) {
  // Nitro replaces the route-rule default with no-cache on errors when the
  // values match exactly. Keep auth error responses explicitly non-storable.
  setResponseHeader(
    event,
    'Cache-Control',
    'private, no-store, must-revalidate',
  )
}

export function requireAdminOrigin(event: H3Event) {
  const { adminOrigin } = useRuntimeConfig(event)
  if (!adminOrigin || getRequestHeader(event, 'origin') !== adminOrigin) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Invalid request origin.',
    })
  }
}

export async function readAdminJson(
  event: H3Event,
): Promise<Record<string, unknown>> {
  if (
    getRequestHeader(event, 'content-type')?.split(';')[0] !==
    'application/json'
  ) {
    throw createError({ statusCode: 415, statusMessage: 'Expected JSON.' })
  }

  const maxBytes = 380_000
  if (Number(getRequestHeader(event, 'content-length')) > maxBytes) {
    throw createError({
      statusCode: 413,
      statusMessage: 'Request is too large.',
    })
  }

  const chunks: Buffer[] = []
  let bytes = 0
  for await (const chunk of event.node.req.iterator({
    destroyOnReturn: false,
  })) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    bytes += buffer.length
    if (bytes > maxBytes) {
      setResponseHeader(event, 'Connection', 'close')
      throw createError({
        statusCode: 413,
        statusMessage: 'Request is too large.',
      })
    }
    chunks.push(buffer)
  }

  try {
    const value: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8'))
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value as Record<string, unknown>
    }
  } catch {
    // Malformed payloads receive the same response as non-object payloads.
  }
  throw createError({ statusCode: 400, statusMessage: 'Invalid request body.' })
}

interface GraphqlResult<T> {
  data?: T
  errors?: Array<{ message: string; extensions?: { code?: string } }>
}

export async function adminGraphql<T>(
  event: H3Event,
  query: string,
  variables: Record<string, unknown> = {},
  // eslint-disable-next-line no-unused-vars -- TypeScript function signature.
  forwardSetCookie?: (data: T) => boolean,
) {
  privateResponse(event)
  const session = getCookie(event, cookieName)
  const { cmsUrl } = useRuntimeConfig(event)
  let response
  try {
    response = await $fetch.raw<GraphqlResult<T>>('/api/graphql', {
      baseURL: cmsUrl,
      method: 'POST',
      body: { query, variables },
      headers: session
        ? { cookie: `${cookieName}=${encodeURIComponent(session)}` }
        : {},
      retry: 0,
      timeout: 5000,
    })
  } catch {
    throw createError({
      statusCode: 502,
      statusMessage: 'The content service is unavailable.',
    })
  }

  const result = response._data
  if (result?.errors?.length) {
    const error = result.errors[0]
    const code = error?.extensions?.code
    if (code === 'KS_ACCESS_DENIED') {
      throw createError({
        statusCode: 403,
        statusMessage: 'You do not have access to this operation.',
      })
    }
    if (code === 'KS_VALIDATION_FAILURE') {
      const validation = error?.message
        .replace(/^You provided invalid data[^\n]*\n?/u, '')
        .trim()
      throw createError({
        statusCode: 422,
        data: {
          message: validation?.slice(0, 300) || 'Check the supplied values.',
        },
        statusMessage: 'Check the supplied values.',
      })
    }
    if (code === 'KS_PRISMA_ERROR' || code === 'KS_RELATIONSHIP_ERROR') {
      throw createError({
        statusCode: 409,
        statusMessage:
          'Check for duplicate values or references to deleted records.',
      })
    }
    throw createError({
      statusCode: 502,
      statusMessage: 'The content service could not complete this operation.',
    })
  }
  if (!result?.data) {
    throw createError({
      statusCode: 502,
      statusMessage: 'The content service returned no data.',
    })
  }
  if (forwardSetCookie?.(result.data)) {
    for (const cookie of response.headers.getSetCookie()) {
      if (cookie.startsWith(`${cookieName}=`))
        appendResponseHeader(event, 'Set-Cookie', cookie)
    }
  }

  return result.data
}

export async function currentOwner(event: H3Event) {
  privateResponse(event)
  if (!getCookie(event, cookieName)) return null

  const { authenticatedItem } = await adminGraphql<{
    authenticatedItem: { email: string; isOwner: boolean } | null
  }>(event, '{ authenticatedItem { ... on User { email isOwner } } }')
  return authenticatedItem?.isOwner ? { email: authenticatedItem.email } : null
}

export async function requireOwner(event: H3Event) {
  if (!(await currentOwner(event))) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Sign in as the portfolio owner.',
    })
  }
}
