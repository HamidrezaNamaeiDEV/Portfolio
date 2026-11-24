import { mkdir, readFile } from 'node:fs/promises'
import {
  expect,
  test,
  type APIRequestContext,
  type Locator,
} from '@playwright/test'
import type { AdminContent, ContentKind, PublicPortfolio } from '@a/contracts'

const web = 'http://127.0.0.1:47121'
const admin = 'http://127.0.0.1:47122'
const cms = 'http://127.0.0.1:47123'
const origin = { Origin: admin }
const credentials = {
  email: process.env.CMS_OWNER_EMAIL!,
  password: process.env.CMS_OWNER_PASSWORD!,
}
const png =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAEklEQVQImWPwXpThvSiDAUIBACTmBVUC07XeAAAAAElFTkSuQmCC'

async function signIn(request: APIRequestContext) {
  const response = await request.post(`${admin}/api/session`, {
    headers: origin,
    data: credentials,
  })
  expect(response.ok(), await response.text()).toBeTruthy()
  return response
}

async function signInInBrowser(
  page: import('@playwright/test').Page,
  navigate = true,
) {
  if (navigate) await page.goto(admin)
  await page.getByLabel('Email').fill(credentials.email)
  await page.getByLabel('Password').fill(credentials.password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible()
}

async function save(
  request: APIRequestContext,
  kind: ContentKind,
  data: Record<string, unknown>,
  id?: string,
) {
  const response = await request.post(`${admin}/api/content`, {
    headers: origin,
    data: { kind, id, data },
  })
  expect(response.ok(), await response.text()).toBeTruthy()
  return ((await response.json()) as { id: string }).id
}

async function remove(
  request: APIRequestContext,
  kind: ContentKind,
  id: string,
) {
  const response = await request.delete(`${admin}/api/content/${kind}/${id}`, {
    headers: origin,
  })
  expect(response.ok(), await response.text()).toBeTruthy()
}

async function publicContent(
  request: APIRequestContext,
): Promise<PublicPortfolio> {
  const response = await request.get(`${web}/api/portfolio`)
  expect(response.ok(), await response.text()).toBeTruthy()
  return response.json()
}

async function expectNoOverlap(field: Locator, actions: Locator) {
  const [fieldBox, actionsBox] = await Promise.all([
    field.boundingBox(),
    actions.boundingBox(),
  ])
  expect(fieldBox).not.toBeNull()
  expect(actionsBox).not.toBeNull()
  const overlaps =
    fieldBox!.x < actionsBox!.x + actionsBox!.width &&
    fieldBox!.x + fieldBox!.width > actionsBox!.x &&
    fieldBox!.y < actionsBox!.y + actionsBox!.height &&
    fieldBox!.y + fieldBox!.height > actionsBox!.y
  expect(overlaps).toBe(false)
}

test('admin requires an owner, checks exact origin, and revokes a replayed session', async ({
  request,
}) => {
  const endpoint = `${admin}/api/content`
  expect((await request.get(endpoint)).status()).toBe(401)
  expect(
    (await request.post(endpoint, { headers: origin, data: {} })).status(),
  ).toBe(401)
  expect(
    (
      await request.post(`${admin}/api/session`, {
        headers: { Origin: web },
        data: credentials,
      })
    ).status(),
  ).toBe(403)
  expect(
    (
      await request.post(`${admin}/api/session`, {
        headers: origin,
        data: { ...credentials, password: 'invalid' },
      })
    ).status(),
  ).toBe(401)

  const response = await signIn(request)
  const session = response.headers()['set-cookie']
  expect(session).toContain('HttpOnly')
  expect(session).toMatch(/SameSite=Lax/i)
  expect(session).not.toMatch(/Domain=/i)
  expect(await request.get(endpoint)).toBeOK()
  expect(
    (
      await request.post(endpoint, { headers: { Origin: web }, data: {} })
    ).status(),
  ).toBe(403)
  expect(
    (
      await request.delete(`${admin}/api/session`, { headers: { Origin: web } })
    ).status(),
  ).toBe(403)
  expect(
    await request.delete(`${admin}/api/session`, { headers: origin }),
  ).toBeOK()
  expect(
    (
      await request.get(endpoint, {
        headers: { Cookie: session!.split(';')[0]! },
      })
    ).status(),
  ).toBe(401)

  const direct = await fetch(`${cms}/api/graphql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: 'mutation { createSkill(data: {name: "Unauthorized"}) { id } }',
    }),
  })
  const body = await direct.json()
  expect(body.data).toEqual({ createSkill: null })
  expect(body.errors[0].extensions.code).toBe('KS_ACCESS_DENIED')
})

test('source seed keeps skill proficiency, Persian months, and unknown facts intact', async ({
  request,
}) => {
  await signIn(request)
  const response = await request.get(`${admin}/api/content`)
  expect(response.ok(), await response.text()).toBeTruthy()
  const data: AdminContent = await response.json()
  const source = await readFile('MASTER_PROMPT.md', 'utf8')
  const [, inventory = ''] = source.split('### Skills Inventory')
  const levels = [
    ...inventory.matchAll(
      /^(Advanced|Intermediate|Beginner|Unverified proficiency):\r?\n((?:- [^\r\n]+\r?\n)+)/gm,
    ),
  ]
  const expected = levels.flatMap(([, level, section]) =>
    [...section.matchAll(/^- (.+)$/gm)].map(([, name]) => [
      name.trim(),
      level === 'Unverified proficiency' ? 'Unverified' : level,
    ]),
  )
  expect(expected).toHaveLength(40)
  expect(
    data.skills
      .map(({ name, proficiency }) => [name, proficiency?.name])
      .sort(),
  ).toEqual(expected.sort())
  expect(data.proficiencies.map(({ name }) => name).sort()).toEqual([
    'Advanced',
    'Beginner',
    'Intermediate',
    'Unverified',
  ])
  expect(
    data.experiences.map((item) => ({
      company: item.company,
      position: item.position,
      startYear: item.startYear,
      startMonth: item.startMonth,
      endYear: item.endYear,
      endMonth: item.endMonth,
      employmentStatus: item.employmentStatus,
      responsibilities: item.responsibilities,
      achievements: item.achievements,
    })),
  ).toEqual(
    expect.arrayContaining([
      {
        company: 'Part Software Company',
        position: 'Software Developer',
        startYear: 1404,
        startMonth: 11,
        endYear: null,
        endMonth: null,
        employmentStatus: null,
        responsibilities: '',
        achievements: '',
      },
      {
        company: 'SabzCoder Team',
        position: 'Software Developer',
        startYear: 1404,
        startMonth: 3,
        endYear: null,
        endMonth: null,
        employmentStatus: null,
        responsibilities: '',
        achievements: '',
      },
    ]),
  )
  expect(data.projects.map(({ name }) => name)).toEqual(
    expect.arrayContaining([
      'Qeshm Portal',
      'Luxury Auction Platform',
      'Kartamoon — app.kartamoon.ir',
    ]),
  )
  for (const entries of Object.values(data)) {
    expect(
      entries.every((item: { status: string }) => item.status === 'draft'),
    ).toBeTruthy()
  }
  expect(await publicContent(request)).toEqual({
    profile: null,
    categories: [],
    skills: [],
    experiences: [],
    projects: [],
  })
})

test('owner CRUD propagates published records, order, relationships and approved images only', async ({
  request,
}) => {
  await signIn(request)
  const categoryId = await save(request, 'categories', {
    name: 'Applied engineering',
    status: 'published',
  })
  const proficiencyId = await save(request, 'proficiencies', {
    name: 'Maintainer',
    status: 'published',
  })
  const skillId = await save(request, 'skills', {
    name: 'Public Skill',
    categoryId,
    proficiencyId,
    logo: png,
    sortOrder: 20,
  })
  const earlierId = await save(request, 'skills', {
    name: 'First Skill',
    sortOrder: 10,
    status: 'published',
  })
  const projectId = await save(request, 'projects', {
    name: 'Example selected project',
    slug: 'example-selected-project',
    cover: png,
    skillIds: [skillId],
    status: 'published',
  })
  const experienceId = await save(request, 'experiences', {
    company: 'Test Studio',
    position: 'Software Developer',
    startYear: 1404,
    startMonth: 11,
    skillIds: [skillId],
    status: 'published',
  })

  let published = await publicContent(request)
  expect(published.skills.map(({ id }) => id)).toEqual([earlierId])
  expect(published.projects[0]?.skills).toEqual([])
  expect(published.experiences[0]?.skills).toEqual([])
  expect(
    (await request.get(`${web}/api/images/skill/${skillId}`)).status(),
  ).toBe(404)
  const cover = await request.get(`${web}/api/images/project/${projectId}`)
  expect(cover.ok()).toBeTruthy()
  expect(cover.headers()['content-type']).toContain('image/webp')

  await save(
    request,
    'skills',
    { status: 'published', description: 'Published description' },
    skillId,
  )
  published = await publicContent(request)
  expect(published.skills.map(({ id }) => id)).toEqual([earlierId, skillId])
  expect(published.skills[1]).toMatchObject({
    description: 'Published description',
    projects: [{ id: projectId, slug: 'example-selected-project' }],
    category: { id: categoryId },
    proficiency: { id: proficiencyId },
  })
  expect(published.experiences[0]?.skills).toEqual([
    { id: skillId, name: 'Public Skill' },
  ])
  expect(
    (await request.get(`${web}/api/images/skill/${skillId}`)).ok(),
  ).toBeTruthy()
  const ssr = await request.get(web)
  const html = await ssr.text()
  expect(html).toContain('Technology Stack')
  expect(html).toContain('Public Skill')
  expect(html).toContain('Bahman 1404')
  expect(html).not.toContain('Part Software Company')

  const invalid = await request.post(`${admin}/api/content`, {
    headers: origin,
    data: {
      kind: 'experiences',
      id: experienceId,
      data: { endYear: 1404, endMonth: 1 },
    },
  })
  expect(invalid.status()).toBe(422)
  const badImage = await request.post(`${admin}/api/content`, {
    headers: origin,
    data: {
      kind: 'skills',
      id: skillId,
      data: { logo: 'data:image/svg+xml;base64,PHN2Zz4=' },
    },
  })
  expect(badImage.status()).toBe(422)
  await save(
    request,
    'projects',
    { description: 'Updated from the owner dashboard.' },
    projectId,
  )
  await save(
    request,
    'categories',
    { description: 'Updated taxonomy' },
    categoryId,
  )
  await save(
    request,
    'proficiencies',
    { description: 'Updated proficiency' },
    proficiencyId,
  )
  await save(
    request,
    'experiences',
    { responsibilities: 'Tested a publication workflow.' },
    experienceId,
  )
  await save(request, 'skills', { visible: false }, skillId)
  published = await publicContent(request)
  expect(published.projects[0]).toMatchObject({
    description: 'Updated from the owner dashboard.',
    skills: [],
  })
  expect(published.experiences[0]?.responsibilities).toBe(
    'Tested a publication workflow.',
  )
  expect(
    (await request.get(`${web}/api/images/skill/${skillId}`)).status(),
  ).toBe(404)

  await remove(request, 'categories', categoryId)
  await remove(request, 'proficiencies', proficiencyId)
  const adminRecords: AdminContent = await (
    await request.get(`${admin}/api/content`)
  ).json()
  expect(adminRecords.skills.find(({ id }) => id === skillId)).toMatchObject({
    category: null,
    proficiency: null,
  })
  for (const [kind, id] of [
    ['skills', skillId],
    ['skills', earlierId],
    ['projects', projectId],
    ['experiences', experienceId],
  ] as const) {
    await remove(request, kind, id)
  }
  expect((await publicContent(request)).projects).toEqual([])
  expect(
    (await request.get(`${web}/api/images/project/${projectId}`)).status(),
  ).toBe(404)
})

test('owner manages and publishes all three content areas through the mobile dashboard', async ({
  page,
  request,
}) => {
  const anonymous = await request.get(admin)
  expect(await anonymous.text()).toContain('Portfolio administration')
  const pageErrors: string[] = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(admin)
  await page.getByLabel('Email').fill(credentials.email)
  await page.getByLabel('Password').fill(credentials.password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible()
  await page.getByRole('link', { name: 'Add a skill', exact: true }).click()
  await page.getByLabel('Name', { exact: true }).fill('Browser-tested skill')
  const skillEditor = page.getByRole('region', { name: 'Add skill' })
  await skillEditor.getByLabel('Publication status').selectOption('published')
  await page.getByRole('button', { name: 'Save skill', exact: true }).click()
  await expect(page.getByText('Skill saved.')).toBeVisible()
  const publicPage = await page.context().newPage()
  await publicPage.goto(web)
  await expect(
    publicPage.getByRole('heading', { name: 'Technology Stack' }),
  ).toBeVisible()
  await expect(
    publicPage.getByText('Browser-tested skill', { exact: true }),
  ).toBeVisible()
  await page.bringToFront()
  await page
    .getByRole('button', { name: 'Work experience', exact: true })
    .click()
  await page
    .getByRole('button', { name: 'Add experience', exact: true })
    .click()
  const experienceEditor = page.getByRole('region', { name: 'Add experience' })
  await experienceEditor
    .getByLabel('Company', { exact: true })
    .fill('Browser-tested company')
  await experienceEditor.getByLabel('Position').fill('Software Developer')
  await experienceEditor.getByLabel('Start month').selectOption('3')
  await experienceEditor.getByLabel('Start year').fill('1404')
  await experienceEditor
    .getByRole('checkbox', { name: 'Browser-tested skill', exact: true })
    .check()
  await experienceEditor
    .getByLabel('Publication status')
    .selectOption('published')
  await experienceEditor
    .getByRole('button', { name: 'Save experience' })
    .click()
  await expect(page.getByText('Experience saved.')).toBeVisible()

  await page.getByRole('button', { name: 'Projects', exact: true }).click()
  await page.getByRole('button', { name: 'Add project', exact: true }).click()
  const projectEditor = page.getByRole('region', { name: 'Add project' })
  await projectEditor
    .getByLabel('Name', { exact: true })
    .fill('Browser-tested project')
  await projectEditor.getByLabel('Slug').fill('browser-tested-project')
  await projectEditor
    .getByRole('checkbox', { name: 'Browser-tested skill', exact: true })
    .check()
  await projectEditor.getByLabel('Publication status').selectOption('published')
  await projectEditor.getByRole('button', { name: 'Save project' }).click()
  await expect(page.getByText('Project saved.')).toBeVisible()
  await publicPage.bringToFront()
  await publicPage.reload()
  await expect(
    publicPage.getByRole('heading', { name: 'Browser-tested company' }),
  ).toBeVisible()
  await expect(publicPage.getByText('Started Khordad 1404')).toBeVisible()
  await expect(
    publicPage.getByRole('heading', { name: 'Browser-tested project' }),
  ).toBeVisible()
  await expect(publicPage.getByText('Present', { exact: true })).toHaveCount(0)

  await page.bringToFront()
  for (const [section, title, singular] of [
    ['Projects', 'Browser-tested project', 'project'],
    ['Work experience', 'Browser-tested company', 'experience'],
    ['Technology stack', 'Browser-tested skill', 'skill'],
  ]) {
    await page.getByRole('button', { name: section, exact: true }).click()
    await page
      .getByRole('button', { name: `Edit ${title}`, exact: true })
      .click()
    await page
      .getByRole('button', { name: `Delete ${singular}`, exact: true })
      .click()
    await page.getByRole('button', { name: 'Confirm delete' }).click()
    await expect(
      page.getByRole('button', { name: `Edit ${title}`, exact: true }),
    ).toHaveCount(0)
  }
  await publicPage.bringToFront()
  await publicPage.reload()
  await expect(
    publicPage.getByText('Browser-tested skill', { exact: true }),
  ).toHaveCount(0)
  await page.bringToFront()
  await page.getByRole('button', { name: 'Sign out' }).click()
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible()
  expect(pageErrors).toEqual([])
})

test('profile is owner-only and keeps unconfirmed fields blank in its draft seed', async ({
  request,
}) => {
  expect((await request.get(`${admin}/api/profile`)).status()).toBe(401)
  await signIn(request)

  const response = await request.get(`${admin}/api/profile`)
  expect(response.ok(), await response.text()).toBeTruthy()
  expect(await response.json()).toMatchObject({
    displayName: '',
    headline: 'Software Engineer & AI-Native Product Builder',
    biography:
      'Frontend-focused Full-stack Engineer working at the intersection of software engineering, AI, product development, and system architecture.',
    profileImage: '',
    contactEmail: '',
    phone: '',
    location: '',
    websiteUrl: '',
    githubUrl: '',
    gitlabUrl: '',
    linkedinUrl: '',
    xUrl: '',
    status: 'draft',
    visible: true,
  })

  const portfolioResponse = await request.get(`${web}/api/portfolio`)
  const portfolio = await portfolioResponse.json()
  expect(portfolio.profile).toBeNull()
})

test('published profile fields and optimized image appear in the public portfolio', async ({
  request,
}) => {
  await signIn(request)
  const response = await request.get(`${admin}/api/profile`)
  expect(response.ok(), await response.text()).toBeTruthy()
  const profile = (await response.json()) as { id: string }

  const draft = await request.put(`${admin}/api/profile`, {
    headers: origin,
    data: {
      data: {
        displayName: 'Profile Test Owner',
        profileImage: png,
        status: 'draft',
      },
    },
  })
  expect(draft.ok(), await draft.text()).toBeTruthy()
  expect(
    ((await publicContent(request)) as unknown as { profile: unknown }).profile,
  ).toBeNull()

  const published = await request.put(`${admin}/api/profile`, {
    headers: origin,
    data: {
      data: { status: 'published', visible: true },
    },
  })
  expect(published.ok(), await published.text()).toBeTruthy()
  const responsePublic = await request.get(`${web}/api/portfolio`)
  const publicData = await responsePublic.json()
  expect(publicData.profile).toMatchObject({
    displayName: 'Profile Test Owner',
    headline: 'Software Engineer & AI-Native Product Builder',
    profileImage: `/api/images/profile/${profile.id}`,
  })
  expect(publicData.profile.status).toBeUndefined()
  expect(publicData.profile.profileImage).not.toContain('base64')

  const image = await request.get(`${web}/api/images/profile/${profile.id}`)
  expect(image.ok()).toBeTruthy()
  expect(image.headers()['content-type']).toContain('image/webp')
})

test('project and profile links reject unsafe URLs and publish valid HTTPS links', async ({
  request,
}) => {
  await signIn(request)
  const projectId = await save(request, 'projects', {
    name: 'URL Test Project',
    slug: 'url-test-project',
  })

  for (const url of [
    'javascript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'https://owner:secret@example.test/work',
    'not a URL',
  ]) {
    const invalid = await request.post(`${admin}/api/content`, {
      headers: origin,
      data: { kind: 'projects', id: projectId, data: { url } },
    })
    expect(invalid.status(), url).toBe(422)
  }

  const invalidProfile = await request.put(`${admin}/api/profile`, {
    headers: origin,
    data: { data: { githubUrl: 'javascript:alert(1)' } },
  })
  expect(invalidProfile.status()).toBe(422)

  const valid = await save(
    request,
    'projects',
    { url: 'https://example.test/work', status: 'published' },
    projectId,
  )
  expect(valid).toBe(projectId)
  const response = await request.get(`${web}/api/portfolio`)
  const portfolio = await response.json()
  expect(portfolio.projects).toContainEqual(
    expect.objectContaining({
      id: projectId,
      url: 'https://example.test/work',
    }),
  )
})

test('published experience logos are served only while the experience is public', async ({
  request,
}) => {
  await signIn(request)
  const experienceId = await save(request, 'experiences', {
    company: 'Logo Test Studio',
    position: 'Software Developer',
    startYear: 1404,
    startMonth: 3,
    companyLogo: png,
    status: 'published',
  })

  const response = await request.get(`${web}/api/portfolio`)
  const portfolio = await response.json()
  expect(portfolio.experiences).toContainEqual(
    expect.objectContaining({
      id: experienceId,
      companyLogo: `/api/images/experience/${experienceId}`,
    }),
  )
  expect(
    (
      await request.get(`${web}/api/images/experience/${experienceId}`)
    ).headers()['content-type'],
  ).toContain('image/webp')

  await save(request, 'experiences', { visible: false }, experienceId)
  expect(
    (
      await request.get(`${web}/api/images/experience/${experienceId}`)
    ).status(),
  ).toBe(404)
})

test('bulk skill changes require explicit valid IDs and leave other seed records as drafts', async ({
  request,
}) => {
  const endpoint = `${admin}/api/content/bulk`
  expect(
    (
      await request.post(endpoint, {
        headers: origin,
        data: { ids: ['seed-skill-javascript'], status: 'published' },
      })
    ).status(),
  ).toBe(401)

  await signIn(request)
  expect(
    (
      await request.post(endpoint, {
        headers: { Origin: web },
        data: { ids: ['seed-skill-javascript'], status: 'published' },
      })
    ).status(),
  ).toBe(403)
  const contentResponse = await request.get(`${admin}/api/content`)
  const initial: AdminContent = await contentResponse.json()
  const preservedSeedId = initial.skills.find(({ id }) =>
    id.startsWith('seed-skill-'),
  )!.id
  const first = await save(request, 'skills', { name: 'Bulk test one' })
  const second = await save(request, 'skills', { name: 'Bulk test two' })

  const duplicate = await request.post(endpoint, {
    headers: origin,
    data: { ids: [first, first], status: 'published' },
  })
  expect(duplicate.status()).toBe(400)

  const stale = await request.post(endpoint, {
    headers: origin,
    data: { ids: [first, 'missing-skill-id'], status: 'published' },
  })
  expect(stale.status()).toBe(404)

  const beforeExplicitChange: AdminContent = await (
    await request.get(`${admin}/api/content`)
  ).json()
  expect(
    beforeExplicitChange.skills
      .filter(({ id }) => id === first || id === second)
      .every(({ status }) => status === 'draft'),
  ).toBeTruthy()

  const updated = await request.post(endpoint, {
    headers: origin,
    data: { ids: [first, second], status: 'published' },
  })
  expect(updated.ok(), await updated.text()).toBeTruthy()

  const after: AdminContent = await (
    await request.get(`${admin}/api/content`)
  ).json()
  expect(after.skills.find(({ id }) => id === first)?.status).toBe('published')
  expect(after.skills.find(({ id }) => id === second)?.status).toBe('published')
  expect(after.skills.find(({ id }) => id === preservedSeedId)?.status).toBe(
    'draft',
  )
  await remove(request, 'skills', first)
  await remove(request, 'skills', second)
})

test('overview reflects loaded records and offers a direct technology-stack action', async ({
  page,
}) => {
  await signInInBrowser(page)
  const response = await page.request.get(`${admin}/api/content`)
  expect(response.ok(), await response.text()).toBeTruthy()
  const content: AdminContent = await response.json()

  await expect(
    page.getByRole('heading', { name: 'Portfolio overview' }),
  ).toBeVisible()
  await expect(page.getByRole('group', { name: 'Total skills' })).toContainText(
    String(content.skills.length),
  )
  await expect(
    page.getByRole('group', { name: 'Published skills' }),
  ).toContainText(
    String(content.skills.filter((item) => item.status === 'published').length),
  )
  await page.getByRole('link', { name: 'Manage technology stack' }).click()
  await expect(
    page.getByRole('heading', { name: 'Technology stack' }),
  ).toBeVisible()
  await page.getByRole('link', { name: 'Overview' }).click()
  await page.getByRole('link', { name: 'Add a skill' }).click()
  await expect(page.getByRole('region', { name: 'Add skill' })).toBeVisible()
  await page.getByRole('button', { name: 'Close' }).click()
})

test('technology stack filters and bulk publishing apply only to selected skills', async ({
  page,
}) => {
  await signInInBrowser(page)
  const categoryId = await save(page.request, 'categories', {
    name: 'Phase 4 Filter Category',
  })
  const otherCategoryId = await save(page.request, 'categories', {
    name: 'Phase 4 Other Filter Category',
  })
  const proficiencyId = await save(page.request, 'proficiencies', {
    name: 'Phase 4 Filter Proficiency',
  })
  const skillId = await save(page.request, 'skills', {
    name: 'Phase 4 Filtered skill',
    categoryId,
    proficiencyId,
    logo: png,
    status: 'draft',
    visible: false,
    sortOrder: 17,
  })
  const untouchedId = await save(page.request, 'skills', {
    name: 'Phase 4 Untouched skill',
    status: 'draft',
  })

  await page.goto(`${admin}/content`)
  await page.getByLabel('Filter by category').selectOption(categoryId)
  await page.getByLabel('Filter by proficiency').selectOption(proficiencyId)
  await page.getByLabel('Publication status').selectOption('draft')
  await page.getByLabel('Filter by visibility').selectOption('hidden')
  await expect(
    page.getByRole('row', { name: /Phase 4 Filtered skill/ }),
  ).toBeVisible()
  await expect(
    page.getByRole('row', { name: /Phase 4 Untouched skill/ }),
  ).toHaveCount(0)
  await expect(
    page.getByRole('img', { name: 'Phase 4 Filtered skill logo' }),
  ).toBeVisible()
  await page
    .getByRole('checkbox', { name: 'Select Phase 4 Filtered skill' })
    .check()
  await page.getByLabel('Filter by category').selectOption(otherCategoryId)
  await expect(
    page.getByText('1 selected, 1 outside current filters'),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Clear selection' }).click()
  await expect(
    page.getByRole('group', { name: 'Selected skill actions' }),
  ).toHaveCount(0)
  await page.getByLabel('Filter by category').selectOption(categoryId)
  await page
    .getByRole('checkbox', { name: 'Select Phase 4 Filtered skill' })
    .check()
  page.once('dialog', (dialog) => dialog.accept())
  const bulkResponsePromise = page.waitForResponse(
    (response) => response.url() === `${admin}/api/content/bulk`,
  )
  await page.getByRole('button', { name: 'Publish selected skills' }).click()
  const bulkResponse = await bulkResponsePromise
  expect(bulkResponse.ok()).toBeTruthy()
  expect(await bulkResponse.json()).toEqual({ updated: 1 })
  await expect(page.getByText('Loading content…')).toHaveCount(0)
  await expect(
    page.getByRole('row', { name: /Phase 4 Filtered skill/ }),
  ).toHaveCount(0)

  const records: AdminContent = await (
    await page.request.get(`${admin}/api/content`)
  ).json()
  expect(records.skills.find(({ id }) => id === skillId)?.status).toBe(
    'published',
  )
  expect(records.skills.find(({ id }) => id === untouchedId)?.status).toBe(
    'draft',
  )
  await remove(page.request, 'skills', skillId)
  await remove(page.request, 'skills', untouchedId)
  await remove(page.request, 'categories', categoryId)
  await remove(page.request, 'categories', otherCategoryId)
  await remove(page.request, 'proficiencies', proficiencyId)
})

test('experience and project editors expose logo, URL, and ordering fields', async ({
  page,
}) => {
  await signInInBrowser(page)
  await page.goto(`${admin}/content`)
  await page.getByRole('button', { name: 'Work experience' }).click()
  await page.getByRole('button', { name: 'Add experience' }).click()
  const experienceEditor = page.getByRole('region', { name: 'Add experience' })
  await expect(experienceEditor.getByLabel('Company logo')).toBeVisible()
  await expect(experienceEditor.getByLabel('Display order')).toBeVisible()

  await experienceEditor.getByRole('button', { name: 'Close' }).click()
  await page.getByRole('button', { name: 'Projects' }).click()
  await page.getByRole('button', { name: 'Add project' }).click()
  const projectEditor = page.getByRole('region', { name: 'Add project' })
  await expect(projectEditor.getByLabel('Project URL')).toBeVisible()
  await expect(projectEditor.getByLabel('Display order')).toBeVisible()
})

test('mobile technology stack remains readable without page overflow', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await signInInBrowser(page)
  const skillId = await save(page.request, 'skills', {
    name: 'Phase 4 mobile readability skill',
    status: 'draft',
  })
  await page.goto(`${admin}/content`)
  const row = page.getByRole('row', {
    name: /Phase 4 mobile readability skill/,
  })
  await expect(row).toBeVisible()
  expect(
    await row.evaluate((element) => getComputedStyle(element).display),
  ).toBe('grid')
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390)
  await remove(page.request, 'skills', skillId)
})

test('session expiry during a save preserves the editor draft through sign-in', async ({
  page,
}) => {
  await signInInBrowser(page)
  await page.goto(`${admin}/content`)
  await page.getByRole('button', { name: 'Add skill' }).click()
  const editor = page.locator('.editor')
  const name = editor.getByLabel('Name', { exact: true })
  await name.fill('Recoverable skill draft')
  await page.route(`${admin}/api/content`, async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          statusCode: 401,
          statusMessage: 'Unauthorized',
        }),
      })
      return
    }
    await route.continue()
  })
  await editor.getByRole('button', { name: 'Save skill' }).click()
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible()
  await expect(editor).toBeAttached()
  await page.unroute(`${admin}/api/content`)
  await signInInBrowser(page, false)
  await expect(name).toHaveValue('Recoverable skill draft')
})

test('preview is owner-only, private, non-indexable, and separates public records from visible drafts', async ({
  request,
}) => {
  const htmlResponse = await request.get(`${admin}/preview`)
  expect(htmlResponse.status()).toBe(200)
  expect(htmlResponse.headers()['cache-control']).toContain('private')
  expect(htmlResponse.headers()['cache-control']).toContain('no-store')
  expect(htmlResponse.headers()['x-robots-tag']).toContain('noindex')
  const html = await htmlResponse.text()
  expect(html).not.toContain('Preview owner-only draft value')

  const anonymous = await request.get(`${admin}/api/preview`)
  expect(anonymous.status()).toBe(401)
  expect(anonymous.headers()['cache-control']).toContain('no-store')
  expect(anonymous.headers()['x-robots-tag']).toContain('noindex')

  await signIn(request)
  const publishedId = await save(request, 'skills', {
    name: 'Preview published skill',
    status: 'published',
  })
  const draftId = await save(request, 'skills', {
    name: 'Preview owner-only draft value',
    status: 'draft',
    visible: true,
  })
  const savedProfile = (await (
    await request.get(`${admin}/api/profile`)
  ).json()) as {
    displayName: string
    status: 'draft' | 'published'
    visible: boolean
  }
  const profile = await request.put(`${admin}/api/profile`, {
    headers: origin,
    data: {
      data: {
        displayName: 'Preview visible draft profile',
        status: 'draft',
        visible: true,
      },
    },
  })
  expect(profile.ok(), await profile.text()).toBeTruthy()
  const response = await request.get(`${admin}/api/preview`)
  expect(response.ok(), await response.text()).toBeTruthy()
  expect(response.headers()['cache-control']).toContain('no-store')
  const preview = await response.json()
  expect(preview.published.skills).toContainEqual(
    expect.objectContaining({ id: publishedId }),
  )
  expect(preview.published.skills).not.toContainEqual(
    expect.objectContaining({ id: draftId }),
  )
  expect(preview.draftCandidates.skills).toContainEqual(
    expect.objectContaining({ id: draftId, status: 'draft', visible: true }),
  )
  expect(preview.draftCandidates.profile).toMatchObject({
    displayName: 'Preview visible draft profile',
    status: 'draft',
    visible: true,
  })
  expect(preview.published.profile).toBeNull()
  await remove(request, 'skills', publishedId)
  await remove(request, 'skills', draftId)
  await request.put(`${admin}/api/profile`, {
    headers: origin,
    data: { data: savedProfile },
  })
})

test('profile editor keeps unknown values blank and saves owner-entered fields', async ({
  page,
  request,
}) => {
  await signIn(request)
  const reset = await request.put(`${admin}/api/profile`, {
    headers: origin,
    data: {
      data: {
        displayName: '',
        contactEmail: '',
        phone: '',
        location: '',
        profileImage: '',
        websiteUrl: '',
        githubUrl: '',
        gitlabUrl: '',
        linkedinUrl: '',
        xUrl: '',
        status: 'draft',
        visible: true,
      },
    },
  })
  expect(reset.ok(), await reset.text()).toBeTruthy()

  await signInInBrowser(page)
  await page.getByRole('link', { name: 'Profile' }).click()
  await expect(
    page.getByRole('heading', { name: 'Professional profile' }),
  ).toBeVisible()
  await expect(page.getByLabel('Display name')).toHaveValue('')
  await expect(page.getByLabel('Contact email')).toHaveValue('')
  await expect(page.getByLabel('Phone')).toHaveValue('')
  await expect(page.getByLabel('Location')).toHaveValue('')
  await expect(page.getByLabel('Professional headline')).toHaveValue(
    'Software Engineer & AI-Native Product Builder',
  )

  await page.getByLabel('Display name').fill('Browser Profile Owner')
  await page.getByLabel('Website URL').fill('https://example.test/profile')
  await page.getByLabel('GitHub URL').fill('https://github.com/example-owner')
  await page.getByRole('button', { name: 'Save profile' }).click()
  await expect(page.getByText('Profile saved.')).toBeVisible()
  const saved = await (await page.request.get(`${admin}/api/profile`)).json()
  expect(saved).toMatchObject({
    displayName: 'Browser Profile Owner',
    contactEmail: '',
    phone: '',
    location: '',
    websiteUrl: 'https://example.test/profile',
    githubUrl: 'https://github.com/example-owner',
    status: 'draft',
  })
})

test('published profile, links, and experience logo render in public server-side HTML', async ({
  request,
}) => {
  await signIn(request)
  const currentProfile = (await (
    await request.get(`${admin}/api/profile`)
  ).json()) as { id: string }
  const profile = await request.put(`${admin}/api/profile`, {
    headers: origin,
    data: {
      data: {
        displayName: 'SSR Profile Owner',
        headline: 'Public profile headline',
        biography: 'A verified public profile biography.',
        profileImage: png,
        contactEmail: 'owner@example.test',
        phone: '+989120000000',
        location: 'Tehran',
        websiteUrl: 'https://example.test/profile',
        githubUrl: 'https://github.com/example-owner',
        linkedinUrl: 'https://linkedin.com/in/example-owner',
        status: 'published',
        visible: true,
      },
    },
  })
  expect(profile.ok(), await profile.text()).toBeTruthy()
  const experienceId = await save(request, 'experiences', {
    company: 'SSR Logo Company',
    position: 'Software Developer',
    startYear: 1404,
    startMonth: 3,
    companyLogo: png,
    status: 'published',
  })
  const projectId = await save(request, 'projects', {
    name: 'SSR Linkable Project',
    slug: 'ssr-linkable-project',
    url: 'https://example.test/projects/ssr',
    status: 'published',
  })

  const response = await request.get(web)
  expect(response.ok(), await response.text()).toBeTruthy()
  const html = await response.text()
  expect(html).toContain('SSR Profile Owner')
  expect(html).toContain('Public profile headline')
  expect(html).toContain('A verified public profile biography.')
  expect(html).toContain(`/api/images/profile/${currentProfile.id}`)
  expect(html).toContain('mailto:owner@example.test')
  expect(html).toContain('tel:+989120000000')
  expect(html).toContain('https://example.test/profile')
  expect(html).toContain(`/api/images/experience/${experienceId}`)
  expect(html).toContain('Khordad 1404')
  expect(html).toContain('href="https://example.test/projects/ssr"')

  await request.put(`${admin}/api/profile`, {
    headers: origin,
    data: { data: { status: 'draft' } },
  })
  const fallbackResponse = await request.get(web)
  const fallbackHtml = await fallbackResponse.text()
  expect(fallbackHtml).not.toContain('SSR Profile Owner')
  expect(fallbackHtml).toContain(
    'Software Engineer &amp; AI-Native Product Builder',
  )
  expect(fallbackHtml).toContain(
    'Frontend-focused Full-stack Engineer working at the intersection of software engineering, AI, product development, and system architecture.',
  )
  await remove(request, 'experiences', experienceId)
  await remove(request, 'projects', projectId)
})

test('profile and content save actions never cover editable fields', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await signInInBrowser(page)
  await page.getByRole('link', { name: 'Profile', exact: true }).click()
  const profileActions = page.locator('.profile-editor__actions')
  await expectNoOverlap(page.getByLabel('Contact email'), profileActions)
  const profileVisibility = page.getByLabel('Visible after publishing')
  await profileVisibility.scrollIntoViewIfNeeded()
  await expectNoOverlap(profileVisibility, profileActions)

  await page
    .getByRole('link', { name: 'Technology stack', exact: true })
    .click()
  await page.getByRole('button', { name: 'Work experience' }).click()
  await page.getByRole('button', { name: 'Add experience' }).click()
  const editor = page.getByRole('region', { name: 'Add experience' })
  const responsibilities = editor.getByLabel('Responsibilities', {
    exact: true,
  })
  await responsibilities.scrollIntoViewIfNeeded()
  await expectNoOverlap(
    responsibilities,
    editor.locator('form > .editor__fields > .editor__actions'),
  )
})

test('captures authenticated Phase 4 admin reference screenshots', async ({
  page,
}) => {
  const screenshotDirectory = 'docs/screenshots/phase-4'
  await mkdir(screenshotDirectory, { recursive: true })
  await page.setViewportSize({ width: 1440, height: 1000 })
  await signInInBrowser(page)

  const resetProfile = await page.request.put(`${admin}/api/profile`, {
    headers: origin,
    data: {
      data: {
        displayName: '',
        headline: 'Software Engineer & AI-Native Product Builder',
        biography:
          'Frontend-focused Full-stack Engineer working at the intersection of software engineering, AI, product development, and system architecture.',
        profileImage: '',
        contactEmail: '',
        phone: '',
        location: '',
        websiteUrl: '',
        githubUrl: '',
        gitlabUrl: '',
        linkedinUrl: '',
        xUrl: '',
        status: 'draft',
        visible: true,
      },
    },
  })
  expect(resetProfile.ok(), await resetProfile.text()).toBeTruthy()

  await expect(
    page.getByRole('heading', { name: 'Portfolio overview' }),
  ).toBeVisible()
  await page.screenshot({
    path: `${screenshotDirectory}/overview-desktop.png`,
    fullPage: true,
  })

  await page
    .getByRole('link', { name: 'Technology stack', exact: true })
    .click()
  await expect(
    page.getByRole('heading', { name: 'Technology stack' }),
  ).toBeVisible()
  await expect(page.getByRole('row').nth(1)).toBeVisible()
  await page.screenshot({
    path: `${screenshotDirectory}/technology-stack-desktop.png`,
    fullPage: true,
  })

  await page.getByRole('link', { name: 'Profile', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'Professional profile' }),
  ).toBeVisible()
  await page.screenshot({
    path: `${screenshotDirectory}/profile-desktop.png`,
  })
  await page.locator('.profile-editor__group').last().scrollIntoViewIfNeeded()
  await page.screenshot({
    path: `${screenshotDirectory}/profile-publication-desktop.png`,
  })

  await page.getByRole('link', { name: 'Preview', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'Visible draft candidates' }),
  ).toBeVisible()
  await page.screenshot({
    path: `${screenshotDirectory}/preview-desktop.png`,
    fullPage: true,
  })

  await page.setViewportSize({ width: 390, height: 844 })
  await page
    .getByRole('link', { name: 'Technology stack', exact: true })
    .click()
  await expect(page.getByRole('row').nth(1)).toBeVisible()
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390)
  for (const selector of ['.topnav', '.workspace__sections']) {
    expect(
      await page
        .locator(selector)
        .evaluate((element) => element.scrollWidth - element.clientWidth),
    ).toBeLessThanOrEqual(0)
  }
  await page.screenshot({
    path: `${screenshotDirectory}/technology-stack-mobile.png`,
  })
})

test('public portfolio supports section history, keyboard details, and responsive layouts', async ({
  page,
  request,
}) => {
  await signIn(request)
  const content: AdminContent = await (
    await request.get(`${admin}/api/content`)
  ).json()
  for (const kind of [
    'categories',
    'proficiencies',
    'experiences',
    'projects',
  ] as const) {
    for (const record of content[kind].filter(({ id }) =>
      id.startsWith('seed-'),
    )) {
      await save(
        request,
        kind,
        { status: 'published', visible: true },
        record.id,
      )
    }
  }
  const bulk = await request.post(`${admin}/api/content/bulk`, {
    headers: origin,
    data: {
      ids: content.skills
        .filter(({ id }) => id.startsWith('seed-'))
        .map(({ id }) => id),
      status: 'published',
      visible: true,
    },
  })
  expect(bulk.ok(), await bulk.text()).toBeTruthy()
  const skill = await save(request, 'skills', {
    name: 'Browser fixture technology',
    categoryId: 'seed-category-frontend',
    description: 'Component based web interfaces.',
    status: 'published',
  })
  for (const project of content.projects.filter(
    ({ name }) => name === 'URL Test Project',
  )) {
    await remove(request, 'projects', project.id)
  }
  expect((await request.get(`${web}/projects`)).status()).toBe(404)
  const response = await request.get(web)
  expect(await response.text()).toContain(`rel="canonical" href="${web}/"`)
  expect(await (await request.get(`${web}/robots.txt`)).text()).toContain(
    `${web}/sitemap.xml`,
  )
  expect(await (await request.get(`${web}/sitemap.xml`)).text()).toContain(
    `<loc>${web}/</loc>`,
  )
  const directory = 'docs/screenshots/phase-5'
  await mkdir(directory, { recursive: true })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto(web)
  await expect(page.locator('.gallery-poster img')).toHaveJSProperty(
    'complete',
    true,
  )
  const navigation = page.getByRole('navigation', {
    name: 'Portfolio',
    exact: true,
  })
  await page.getByRole('link', { name: 'Explore My Stack' }).click()
  await expect(navigation.getByRole('link', { name: 'Stack' })).toHaveAttribute(
    'aria-current',
    'location',
  )
  await navigation.getByRole('link', { name: 'Experience' }).click()
  await page.goBack()
  await expect(page).toHaveURL(/#technology-stack$/)
  await expect(navigation.getByRole('link', { name: 'Stack' })).toHaveAttribute(
    'aria-current',
    'location',
  )
  const disclosure = page
    .locator('summary')
    .filter({ hasText: 'Browser fixture technology' })
  await disclosure.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByText('Component based web interfaces.')).toBeVisible()
  expect(
    await page
      .locator('html')
      .evaluate((node) => getComputedStyle(node).scrollBehavior),
  ).toBe('auto')
  await remove(request, 'skills', skill)
  await page.goto(web)
  await page.screenshot({
    path: `${directory}/homepage-desktop.png`,
    fullPage: true,
  })
  await page.setViewportSize({ width: 390, height: 844 })
  await expect
    .poll(() =>
      page
        .locator('html')
        .evaluate((root) => root.scrollWidth - root.clientWidth),
    )
    .toBe(0)
  await page.screenshot({
    path: `${directory}/homepage-mobile.png`,
    fullPage: true,
  })
})
