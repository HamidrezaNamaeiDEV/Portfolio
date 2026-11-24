import type {
  AdminContent,
  PortfolioPreview,
  PublicPortfolio,
} from '@a/contracts'
import { operations } from '../utils/content'

export default defineEventHandler(async (event): Promise<PortfolioPreview> => {
  await requireOwner(event)

  const selection = Object.entries(operations).map(
    ([kind, operation]) =>
      `${kind}: ${operation.list}(orderBy: [{sortOrder: asc}, {id: asc}]) { ${operation.selection} }`,
  )
  const [content, profile, publicData] = await Promise.all([
    adminGraphql<AdminContent>(event, `{ ${selection.join('\n')} }`),
    getProfile(event),
    adminGraphql<{ publicPortfolio: PublicPortfolio }>(
      event,
      '{ publicPortfolio }',
    ),
  ])

  return {
    published: publicData.publicPortfolio,
    draftCandidates: {
      categories: content.categories.filter(
        (record) => record.status === 'draft' && record.visible,
      ),
      proficiencies: content.proficiencies.filter(
        (record) => record.status === 'draft' && record.visible,
      ),
      skills: content.skills.filter(
        (record) => record.status === 'draft' && record.visible,
      ),
      experiences: content.experiences.filter(
        (record) => record.status === 'draft' && record.visible,
      ),
      projects: content.projects.filter(
        (record) => record.status === 'draft' && record.visible,
      ),
      profile: profile?.status === 'draft' && profile.visible ? profile : null,
    },
  }
})
