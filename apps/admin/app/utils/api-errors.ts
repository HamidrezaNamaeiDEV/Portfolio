interface AppApiError {
  statusCode?: number
  data?: { statusMessage?: string; data?: { message?: string } }
}

export function isUnauthorized(error: unknown) {
  return (error as AppApiError | null)?.statusCode === 401
}

export function apiMessage(error: unknown, fallback: string) {
  const data = (error as AppApiError | null)?.data
  return data?.data?.message || data?.statusMessage || fallback
}
