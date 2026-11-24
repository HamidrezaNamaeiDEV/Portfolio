import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  ssr: true,
  routeRules: {
    '/**': {
      headers: {
        'cache-control': 'private, no-store',
        'x-robots-tag': 'noindex',
      },
    },
  },
  runtimeConfig: {
    cmsUrl: 'http://127.0.0.1:3002',
    adminOrigin: '',
  },
  compatibilityDate: '2026-11-24',
  app: {
    head: {
      title: 'Portfolio administration',
      htmlAttrs: { lang: 'en' },
    },
  },
  typescript: { strict: true },
})
