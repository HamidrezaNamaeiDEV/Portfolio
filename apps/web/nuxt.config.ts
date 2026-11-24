import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  ssr: true,
  compatibilityDate: '2026-11-24',
  app: {
    head: {
      title: 'A/ Engineering Portfolio',
      htmlAttrs: { lang: 'en' },
    },
  },
  typescript: { strict: true },
})
