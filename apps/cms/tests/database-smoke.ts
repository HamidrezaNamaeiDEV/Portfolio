import assert from 'node:assert/strict'
import { getContext } from '@keystone-6/core/context'
import * as prismaModule from '../generated/prisma/client.ts'
import config from '../keystone.ts'

const mode = process.argv[2]
const context = getContext(config, prismaModule)
const probes = context.prisma.foundationProbe

try {
  switch (mode) {
    case 'write': {
      await probes.create({
        data: { marker: 'baseline', value: 'before-release' },
      })
      const row = await probes.findUniqueOrThrow({
        where: { marker: 'baseline' },
      })
      assert.equal(row.value, 'before-release')
      console.log('PASS PostgreSQL write/read through the generated client')

      await assert.rejects(
        context.transaction(async (transaction) => {
          await transaction.prisma.foundationProbe.create({
            data: { marker: 'aborted', value: 'must roll back' },
          })
          throw new Error('Abort the smoke transaction')
        }),
        { message: 'Abort the smoke transaction' },
      )
      assert.equal(
        await probes.findUnique({ where: { marker: 'aborted' } }),
        null,
      )
      console.log('PASS failed transaction rolled back')
      break
    }
    case 'simulate-bad-release': {
      await probes.update({
        where: { marker: 'baseline' },
        data: { value: 'changed-by-bad-release' },
      })
      await probes.create({
        data: { marker: 'after-backup', value: 'lost on restore' },
      })
      assert.equal(
        (await probes.findUniqueOrThrow({ where: { marker: 'baseline' } }))
          .value,
        'changed-by-bad-release',
      )
      console.log('PASS simulated bad release changed the disposable source')
      break
    }
    case 'verify-restore': {
      const rows = await probes.findMany({
        select: { marker: true, value: true },
      })
      assert.deepEqual(rows, [{ marker: 'baseline', value: 'before-release' }])
      console.log(
        'PASS restored backup contains the baseline and excludes later writes',
      )
      break
    }
    default:
      throw new Error('Choose write, simulate-bad-release, or verify-restore.')
  }
} finally {
  await context.prisma.$disconnect()
}
