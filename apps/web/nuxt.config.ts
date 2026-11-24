import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  ssr: true,
  hooks: {
    'build:manifest'(manifest) {
      // Nuxt otherwise emits an SSR prefetch for this dynamic import.
      for (const [id, entry] of Object.entries(manifest)) {
        if (id.endsWith('/libs/three-scenes/index.ts')) entry.prefetch = false
      }
    },
  },
  routeRules: { '/': { headers: { 'cache-control': 'no-store' } } },
  runtimeConfig: {
    public: { adminUrl: 'http://localhost:3001', siteUrl: '' },
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
