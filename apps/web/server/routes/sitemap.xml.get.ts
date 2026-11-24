export default defineEventHandler((event) => {
  const { siteUrl } = useRuntimeConfig(event).public
  if (!siteUrl) throw createError({ statusCode: 404 })

  const home = new URL('/', siteUrl).href.replaceAll('&', '&amp;')
  setResponseHeader(event, 'content-type', 'application/xml; charset=utf-8')
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${home}</loc></url></urlset>`
})
