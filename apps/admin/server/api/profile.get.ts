import type { ProfileRecord } from '@a/contracts'

export default defineEventHandler(
  async (event): Promise<ProfileRecord | null> => {
    await requireOwner(event)
    return getProfile(event)
  },
)
