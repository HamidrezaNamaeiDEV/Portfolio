const loginWindow = 15 * 60 * 1000
let windowExpiresAt = 0
let attempts = 0

export default defineEventHandler(async (event) => {
  privateResponse(event)
  requireAdminOrigin(event)
  const { email, password } = await readAdminJson(event)
  if (
    typeof email !== 'string' ||
    email.length > 254 ||
    !email.includes('@') ||
    typeof password !== 'string' ||
    !password ||
    password.length > 256
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Enter your email and password.',
    })
  }

  if (Date.now() > windowExpiresAt) {
    attempts = 0
    windowExpiresAt = Date.now() + loginWindow
  }
  if (++attempts > 25) {
    setResponseHeader(
      event,
      'Retry-After',
      Math.ceil((windowExpiresAt - Date.now()) / 1000),
    )
    throw createError({
      statusCode: 429,
      statusMessage: 'Too many sign-in attempts. Try again later.',
    })
  }

  const { authenticateUserWithPassword } = await adminGraphql<{
    authenticateUserWithPassword: { item?: { email: string; isOwner: boolean } }
  }>(
    event,
    `mutation SignIn($email: String!, $password: String!) {
      authenticateUserWithPassword(email: $email, password: $password) {
        ... on UserAuthenticationWithPasswordSuccess { item { email isOwner } }
      }
    }`,
    { email: email.trim().toLowerCase(), password },
    ({ authenticateUserWithPassword }) =>
      authenticateUserWithPassword?.item?.isOwner === true,
  )

  const user = authenticateUserWithPassword?.item
  if (!user?.isOwner) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Email or password is incorrect.',
    })
  }
  return { owner: { email: user.email } }
})
