import type { H3Event } from 'h3'

export async function publicGraphql<T>(
  event: H3Event,
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T> {
  try {
    const result = await $fetch<{ data?: T; errors?: unknown[] }>(
      '/api/graphql',
      {
        baseURL: useRuntimeConfig(event).cmsUrl,
        method: 'POST',
        body: { query, variables },
        retry: 0,
        timeout: 5000,
      },
    )
    if (result.data && !result.errors?.length) return result.data
  } catch {
    // The public app presents an upstream failure without exposing CMS details.
  }
  throw createError({
    statusCode: 503,
    statusMessage: 'Portfolio content is temporarily unavailable.',
  })
}
