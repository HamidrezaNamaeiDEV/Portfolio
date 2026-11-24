import { createAuth } from '@keystone-6/auth'
import { config } from '@keystone-6/core'
import { PrismaPg } from '@prisma/adapter-pg'
import { lists } from './content/lists.ts'
import { publicSchema } from './content/public.ts'
import {
  databaseUrl,
  editorialSession,
  validateSessionConfig,
} from './content/session.ts'

const { withAuth } = createAuth({
  listKey: 'User',
  identityField: 'email',
  secretField: 'password',
  sessionData: 'id isOwner',
})

export default withAuth(
  config({
    db: {
      provider: 'postgresql',
      prismaClientOptions: () => ({
        adapter: new PrismaPg({ connectionString: databaseUrl() }),
      }),
    },
    graphql: {
      bodyParser: { limit: '400kb' },
      extendGraphqlSchema: publicSchema,
    },
    server: {
      port: Number(process.env.CMS_PORT || '3002'),
      extendExpressApp: () => validateSessionConfig(),
    },
    session: editorialSession,
    ui: { isDisabled: true },
    lists,
  }),
)
