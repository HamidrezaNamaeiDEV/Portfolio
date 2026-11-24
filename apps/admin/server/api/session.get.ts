export default defineEventHandler(async (event) => ({
  owner: await currentOwner(event),
}))
