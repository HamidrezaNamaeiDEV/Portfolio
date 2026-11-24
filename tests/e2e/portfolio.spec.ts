import { readFile } from 'node:fs/promises'
import { expect, test, type APIRequestContext } from '@playwright/test'
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
  await page.getByRole('button', { name: 'Add skill', exact: true }).click()
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
  await page
    .getByRole('button', { name: 'Work experience', exact: true })
    .click()
  await page
    .getByRole('button', { name: 'Add experience', exact: true })
    .click()
  const experienceEditor = page.getByRole('region', { name: 'Add experience' })
  await experienceEditor.getByLabel('Company').fill('Browser-tested company')
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
  await publicPage.reload()
  await expect(
    publicPage.getByRole('heading', { name: 'Browser-tested company' }),
  ).toBeVisible()
  await expect(publicPage.getByText('Started Khordad 1404')).toBeVisible()
  await expect(
    publicPage.getByRole('heading', { name: 'Browser-tested project' }),
  ).toBeVisible()
  await expect(publicPage.getByText('Present', { exact: true })).toHaveCount(0)

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
  await publicPage.reload()
  await expect(
    publicPage.getByText('Browser-tested skill', { exact: true }),
  ).toHaveCount(0)
  await page.getByRole('button', { name: 'Sign out' }).click()
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible()
  expect(pageErrors).toEqual([])
})
