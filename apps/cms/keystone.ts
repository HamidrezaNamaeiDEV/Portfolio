import { config, list } from '@keystone-6/core'
import { denyAll } from '@keystone-6/core/access'
import { text } from '@keystone-6/core/fields'
import { PrismaPg } from '@prisma/adapter-pg'

export default config({
  db: {
    provider: 'postgresql',
    prismaClientOptions: () => {
      const connectionString = process.env.CMS_DATABASE_URL
      if (!connectionString) {
        throw new Error('Set CMS_DATABASE_URL before starting Keystone.')
      }

      return { adapter: new PrismaPg({ connectionString }) }
    },
  },
  server: { port: 3002 },
  ui: { isDisabled: true },
  lists: {
    // Temporary Foundation fixture. All generated operations are denied.
    FoundationProbe: list({
      access: denyAll,
      fields: {
        marker: text({ validation: { isRequired: true }, isIndexed: 'unique' }),
        value: text({ validation: { isRequired: true } }),
      },
    }),
  },
})
