import { getContext } from '@keystone-6/core/context'
import * as prismaModule from '../generated/prisma/client.ts'
import config from '../keystone.ts'

const email = process.env.CMS_OWNER_EMAIL?.trim().toLowerCase()
const password = process.env.CMS_OWNER_PASSWORD

if (!email || !password || password.length < 16 || password.length > 128) {
  throw new Error(
    'Set CMS_OWNER_EMAIL and CMS_OWNER_PASSWORD (16 to 128 characters).',
  )
}

const context = getContext(config, prismaModule)
try {
  const owner = await context.prisma.user.findFirst({
    where: { isOwner: true },
    select: { email: true },
  })
  if (owner) {
    if (owner.email !== email) throw new Error('The CMS already has an owner.')
    console.log('The owner account already exists.')
  } else {
    await context
      .sudo()
      .db.User.createOne({ data: { email, password, isOwner: true } })
    console.log('Owner account created.')
  }
} finally {
  await context.prisma.$disconnect()
}
