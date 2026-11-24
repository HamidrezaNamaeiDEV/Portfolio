import type { PublicPortfolio } from '@a/contracts'

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'no-store')
  const { publicPortfolio } = await publicGraphql<{
    publicPortfolio: PublicPortfolio
  }>(event, '{ publicPortfolio }')
  return publicPortfolio
})
