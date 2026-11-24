export default defineEventHandler(async (event) => {
  requireAdminOrigin(event)
  await adminGraphql(event, 'mutation { endSession }', {}, () => true)
  return { ok: true }
})
