import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  ssr: true,
  routeRules: { '/': { headers: { 'cache-control': 'no-store' } } },
  runtimeConfig: {
    cmsUrl: 'http://127.0.0.1:3002',
  },
  compatibilityDate: '2026-11-24',
  app: {
    head: {
      title: 'A/ Engineering Portfolio',
      htmlAttrs: { lang: 'en' },
    },
  },
  typescript: { strict: true },
})
