import assert from 'node:assert/strict'
import { setTimeout } from 'node:timers/promises'

const server = 'http://127.0.0.1:3002'

function graphQL(query: string): Promise<Response> {
  return fetch(`${server}/api/graphql`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query }),
    signal: AbortSignal.timeout(2000),
  })
}

let response: Response | undefined
for (let attempt = 0; attempt < 30; attempt++) {
  response = await graphQL('{ __typename }').catch(() => undefined)
  if (response?.ok) break
  await setTimeout(1000)
}

assert.ok(response?.ok, 'Keystone did not start successfully')
assert.deepEqual(await response.json(), { data: { __typename: 'Query' } })
assert.equal((await fetch(server, { redirect: 'manual' })).status, 404)

const read = await graphQL('{ foundationProbes { marker } }')
assert.equal(read.status, 200)
assert.deepEqual(await read.json(), { data: { foundationProbes: [] } })

const mutation = await graphQL(
  'mutation { createFoundationProbe(data: { marker: "blocked", value: "blocked" }) { id } }',
)
assert.equal(mutation.status, 200)
const mutationBody: {
  data?: Record<string, unknown>
  errors?: Array<{ extensions?: { code?: string } }>
} = await mutation.json()
assert.deepEqual(mutationBody.data, { createFoundationProbe: null })
assert.deepEqual(
  mutationBody.errors?.map((error) => error.extensions?.code),
  ['KS_ACCESS_DENIED'],
)
console.log(
  'PASS Keystone HTTP startup, disabled Admin UI, and denied anonymous fixture access',
)
