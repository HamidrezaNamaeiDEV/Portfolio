import type { AdminContent } from '@a/contracts'

export default defineEventHandler(async (event) => {
  await requireOwner(event)
  const selection = Object.entries(operations).map(
    ([kind, operation]) =>
      `${kind}: ${operation.list}(orderBy: [{sortOrder: asc}, {id: asc}]) { ${operation.selection} }`,
  )
  return adminGraphql<AdminContent>(event, `{ ${selection.join('\n')} }`)
})
