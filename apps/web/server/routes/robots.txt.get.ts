export default defineEventHandler((event) => {
  const { siteUrl } = useRuntimeConfig(event).public
  setResponseHeader(event, 'content-type', 'text/plain; charset=utf-8')
  return [
    'User-agent: *',
    'Allow: /',
    ...(siteUrl ? [`Sitemap: ${new URL('/sitemap.xml', siteUrl).href}`] : []),
    '',
  ].join('\n')
})
