import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: 'schema.prisma',
  migrations: { path: 'tests/fixture-migrations' },
  datasource: { url: process.env.CMS_DATABASE_URL },
})
