import { createHash, randomUUID } from 'node:crypto'
import { storedSessions } from '@keystone-6/core/session'
import type { SessionStrategy } from '@keystone-6/core/types'
import pg from 'pg'

export function databaseUrl(): string {
  const url = process.env.CMS_DATABASE_URL
  if (!url) throw new Error('Set CMS_DATABASE_URL before starting Keystone.')
  return url
}

type Session = { itemId: string }
let store: ReturnType<typeof storedSessions<Session>> | undefined
let pool: pg.Pool | undefined

function database() {
  if (!pool) {
    pool = new pg.Pool({ connectionString: databaseUrl(), max: 3 })
    pool.on('error', () =>
      console.error('An idle editorial session connection was lost.'),
    )
  }
  return pool
}

function hash(key: string) {
  return createHash('sha256').update(key).digest('hex')
}

function getSessionStore() {
  if (!store) {
    const secret = process.env.CMS_SESSION_SECRET
    if (!secret || secret.length < 32) {
      throw new Error(
        'Set CMS_SESSION_SECRET to a random value of at least 32 characters.',
      )
    }

    store = storedSessions<Session>({
      secret,
      secure: process.env.CMS_INSECURE_DEV_COOKIE !== '1',
      sameSite: 'lax',
      maxAge: 60 * 60 * 8,
      store: ({ maxAge }) => ({
        async get(key) {
          const result = await database().query<Session>(
            `SELECT session."user" AS "itemId" FROM "EditorialSession" session
             JOIN "User" owner ON owner.id = session."user" AND owner."isOwner"
             WHERE session."keyHash" = $1 AND session."expiresAt" > (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')`,
            [hash(key)],
          )
          return result.rows[0]
        },
        async set(key, data) {
          await database().query(
            `DELETE FROM "EditorialSession"
             WHERE "expiresAt" <= (CURRENT_TIMESTAMP AT TIME ZONE 'UTC') OR "user" IS NULL`,
          )
          await database().query(
            `INSERT INTO "EditorialSession" ("id", "keyHash", "user", "expiresAt")
             VALUES ($1, $2, $3, (CURRENT_TIMESTAMP AT TIME ZONE 'UTC') + ($4 * INTERVAL '1 second'))`,
            [randomUUID(), hash(key), data.itemId, maxAge],
          )
        },
        async delete(key) {
          await database().query(
            'DELETE FROM "EditorialSession" WHERE "keyHash" = $1',
            [hash(key)],
          )
        },
      }),
    })
  }
  return store
}

// Resolve runtime secrets only when starting the server or handling requests.
export const editorialSession: SessionStrategy<Session> = {
  get: (args) => getSessionStore().get(args),
  async start(args) {
    const owner = await database().query(
      'SELECT 1 FROM "User" WHERE id = $1 AND "isOwner"',
      [args.data.itemId],
    )
    if (owner.rowCount === 0) return
    return getSessionStore().start(args)
  },
  end: (args) => getSessionStore().end(args),
}

export function validateSessionConfig() {
  getSessionStore()
}
