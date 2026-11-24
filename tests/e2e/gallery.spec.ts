import { mkdir } from 'node:fs/promises'
import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from '@playwright/test'
import type { AdminContent } from '@a/contracts'

const web = 'http://127.0.0.1:47121'
const admin = 'http://127.0.0.1:47122'
const screenshotDirectory = 'docs/screenshots/phase-6a'
const categoryId = 'seed-category-frontend'
const skillId = 'seed-skill-javascript'

async function withFrontend(
  request: APIRequestContext,
  run: () => Promise<void>,
  additional = false,
) {
  const headers = { Origin: admin }
  const login = await request.post(`${admin}/api/session`, {
    headers,
    data: {
      email: process.env.CMS_OWNER_EMAIL,
      password: process.env.CMS_OWNER_PASSWORD,
    },
  })
  expect(login.ok()).toBe(true)
  const content: AdminContent = await (
    await request.get(`${admin}/api/content`)
  ).json()
  const category = content.categories.find(({ id }) => id === categoryId)!
  const skill = content.skills.find(({ id }) => id === skillId)!

  async function update(
    kind: 'categories' | 'skills',
    record: typeof category | typeof skill,
    state: Pick<typeof category, 'status' | 'visible'>,
  ) {
    const result = await request.post(`${admin}/api/content`, {
      headers,
      data: { kind, id: record.id, data: state },
    })
    expect(result.ok(), await result.text()).toBe(true)
  }

  const keys = ['backend', 'ai', 'infrastructure', 'product']
  const extra = additional
    ? keys.map((key) => {
        const category = content.categories.find(
          ({ id }) => id === `seed-category-${key}`,
        )!
        return {
          category,
          skill: content.skills.find(
            ({ category: relation }) => relation?.id === category.id,
          )!,
        }
      })
    : []
  const published = { status: 'published', visible: true } as const
  try {
    await update('categories', category, published)
    await update('skills', skill, published)
    for (const stop of extra) {
      await update('categories', stop.category, published)
      await update('skills', stop.skill, published)
    }
    await run()
  } finally {
    for (const stop of extra) {
      await update('skills', stop.skill, {
        status: stop.skill.status,
        visible: stop.skill.visible,
      })
      await update('categories', stop.category, {
        status: stop.category.status,
        visible: stop.category.visible,
      })
    }
    await update('skills', skill, {
      status: skill.status,
      visible: skill.visible,
    })
    await update('categories', category, {
      status: category.status,
      visible: category.visible,
    })
  }
}

function gallery(page: Page) {
  return page.getByRole('group', { name: 'Engineering gallery' })
}

test('desktop gallery lazily renders, selects, links to CMS and releases its context', async ({
  page,
  request,
}, testInfo) => {
  await withFrontend(request, async () => {
    await page.setViewportSize({ width: 1440, height: 1000 })
    const initialRequests: string[] = []
    page.on('request', (request) => initialRequests.push(request.url()))
    await page.goto(web)
    const open = gallery(page).getByRole('button', { name: 'Explore in 3D' })
    await expect(open).toBeVisible()
    await expect(page.locator('canvas')).toHaveCount(0)
    expect(initialRequests.some((url) => url.includes('.glb'))).toBe(false)
    await expect(page.locator('link[rel="prefetch"][as="script"]')).toHaveCount(
      0,
    )

    const initialResources = await page.evaluate(() =>
      performance.getEntriesByType('resource').map(({ name }) => name),
    )
    await open.focus()
    await page.keyboard.press('Enter')
    const canvas = page.locator('canvas.gallery-surface')
    await expect(canvas).toHaveClass(/gallery-surface--live/)
    await expect(canvas).toHaveAttribute('data-gallery-draw-calls', /[1-9]\d*/)
    await expect(canvas).toHaveAttribute('data-gallery-textures', /^[01]$/)

    for (const width of [1280, 1440, 1920]) {
      await page.setViewportSize({ width, height: 1000 })
      const layout = await page.locator('.hero-copy').evaluate((copy) => {
        const surface = document.querySelector('.gallery-surface')!
        const controls = document.querySelector('.gallery-controls')!
        const copyBounds = copy.getBoundingClientRect()
        const text = document.createRange()
        text.selectNodeContents(copy)
        const textBounds = text.getBoundingClientRect()
        return {
          textFits: textBounds.right <= copyBounds.right + 1,
          imageClearsText:
            copyBounds.right < surface.getBoundingClientRect().left,
          controlsClearText:
            copyBounds.right < controls.getBoundingClientRect().left,
          noOverflow:
            document.documentElement.scrollWidth ===
            document.documentElement.clientWidth,
        }
      })
      expect(layout, `Hero layout at ${width}px`).toEqual({
        textFits: true,
        imageClearsText: true,
        controlsClearText: true,
        noOverflow: true,
      })
    }
    await page.setViewportSize({ width: 1440, height: 1000 })

    const stats = await canvas.evaluate((node, initial) => {
      const surface = node as HTMLCanvasElement
      const context = surface.getContext('webgl2')!
      const info = context.getExtension('WEBGL_debug_renderer_info')
      const assets = performance
        .getEntriesByType('resource')
        .filter(
          (entry): entry is PerformanceResourceTiming =>
            entry instanceof PerformanceResourceTiming &&
            !initial.includes(entry.name) &&
            /\.(?:js|glb)$/.test(new URL(entry.name).pathname),
        )
        .map((entry) => ({
          name: new URL(entry.name).pathname,
          encodedBytes: entry.encodedBodySize,
          ms: entry.duration,
        }))
      return {
        ...surface.dataset,
        buffer: [surface.width, surface.height],
        renderer: info
          ? (context.getParameter(info.UNMASKED_RENDERER_WEBGL) as string)
          : 'unavailable',
        assets,
      }
    }, initialResources)
    expect(
      stats.assets.some(({ name }) => name.endsWith('frontend-study.glb')),
    ).toBe(true)

    await mkdir(screenshotDirectory, { recursive: true })
    await page.screenshot({
      path: `${screenshotDirectory}/gallery-desktop.png`,
    })

    expect(stats.assets.some(({ name }) => name.endsWith('.js'))).toBe(true)
    expect(
      stats.assets.reduce((total, { encodedBytes }) => total + encodedBytes, 0),
    ).toBeLessThan(1_500_000)

    const focus = gallery(page).getByRole('button', { name: 'Focus exhibit' })
    const rect = await canvas.boundingBox()
    expect(rect).not.toBeNull()
    if (!rect) throw new Error('Canvas bounds unavailable')
    let point: { x: number; y: number } | undefined
    for (const offset of [
      0.57, 0.61, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9, 0.94, 0.97,
    ]) {
      const x = rect.x + rect.width * offset
      const y = rect.y + rect.height * 0.52
      await page.mouse.move(x, y)
      if (
        (await canvas.evaluate((node) => getComputedStyle(node).cursor)) ===
        'pointer'
      ) {
        point = { x, y }
        break
      }
    }
    expect(point).toBeDefined()
    if (!point) throw new Error('Exhibit hit target unavailable')
    await page.mouse.click(point.x, point.y)
    await expect(focus).toHaveAttribute('aria-pressed', 'true')
    await focus.focus()
    await page.keyboard.press('Space')
    await expect(focus).toHaveAttribute('aria-pressed', 'false')

    const intervals = await page.evaluate(
      () =>
        new Promise<number[]>((resolve) => {
          const samples: number[] = []
          let start = 0
          let previous = 0
          function sample(time: number) {
            if (!start) start = time
            if (previous) samples.push(time - previous)
            previous = time
            if (time - start > 1800) {
              window.scrollTo({ top: 0, behavior: 'instant' })
              resolve(samples)
              return
            }
            window.scrollTo({
              top: 130 + Math.sin((time - start) / 260) * 125,
              behavior: 'instant',
            })
            requestAnimationFrame(sample)
          }
          requestAnimationFrame(sample)
        }),
    )
    await testInfo.attach('gallery-browser-metrics', {
      body: JSON.stringify({ ...stats, intervals }, null, 2),
      contentType: 'application/json',
    })
    console.log(
      'Gallery lab',
      JSON.stringify({
        ...stats,
        median: intervals.toSorted((a, b) => a - b)[
          Math.floor(intervals.length / 2)
        ],
        p95: intervals.toSorted((a, b) => a - b)[
          Math.floor(intervals.length * 0.95)
        ],
      }),
    )

    const link = gallery(page).getByRole('link', {
      name: 'Frontend Engineering',
    })
    await link.focus()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/#stack-seed-category-frontend$/)
    await expect(page.locator('#stack-seed-category-frontend')).toBeFocused()
    await expect(canvas).toHaveCount(0)

    await page.goto(web)
    for (let cycle = 0; cycle < 2; cycle++) {
      await open.click()
      await expect(canvas).toHaveClass(/gallery-surface--live/)
      const oldCanvas = await canvas.elementHandle()
      await gallery(page).getByRole('button', { name: 'Static view' }).click()
      await expect(canvas).toHaveCount(0)
      expect(
        await oldCanvas?.evaluate((node: HTMLCanvasElement) =>
          node.getContext('webgl2')?.isContextLost(),
        ),
      ).toBe(true)
      await oldCanvas?.dispose()
    }

    await open.click()
    await expect(canvas).toHaveClass(/gallery-surface--live/)
    await canvas.evaluate((node: HTMLCanvasElement) => {
      node
        .getContext('webgl2')
        ?.getExtension('WEBGL_lose_context')
        ?.loseContext()
    })
    await expect(
      page.getByRole('status').filter({ hasText: '3D unavailable' }),
    ).toBeVisible()
    await expect(canvas).toHaveCount(0)
    await expect(page.locator('.gallery-poster img')).toBeVisible()

    await open.click()
    await expect(canvas).toHaveClass(/gallery-surface--live/)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await expect(canvas).toHaveCount(0)
    await expect(open).toBeHidden()
  })
})

test('mobile and reduced motion retain the poster without model transfer', async ({
  page,
  browser,
}) => {
  const noScript = await browser.newPage({ javaScriptEnabled: false })
  try {
    await noScript.goto(web)
    await expect(noScript.locator('.gallery-poster img')).toBeVisible()
    await noScript.getByRole('link', { name: 'Explore My Stack' }).click()
    await expect(noScript).toHaveURL(/#technology-stack$/)
  } finally {
    await noScript.close()
  }
  const mobile = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  })
  try {
    for (const surface of [mobile, page]) {
      if (surface === page) await page.emulateMedia({ reducedMotion: 'reduce' })
      const requested: string[] = []
      surface.on('request', (request) => requested.push(request.url()))
      await surface.goto(web)
      await expect(surface.locator('.gallery-poster img')).toHaveJSProperty(
        'naturalWidth',
        surface === mobile ? 640 : 1000,
      )
      await expect(gallery(surface)).toHaveCount(0)
      await expect(surface.locator('canvas')).toHaveCount(0)
      await expect(surface.locator('.gallery-scroll--live')).toHaveCount(0)
      const staticHero = surface.locator('.intro')
      const priorTop = (await staticHero.boundingBox())!.y
      await surface.evaluate(() =>
        window.scrollTo({ top: 240, behavior: 'instant' }),
      )
      await expect
        .poll(async () => (await staticHero.boundingBox())!.y)
        .toBeLessThan(priorTop - 200)
      await surface.evaluate(() =>
        window.scrollTo({ top: 0, behavior: 'instant' }),
      )
      expect(requested.some((url) => url.includes('.glb'))).toBe(false)
    }
    await mkdir(screenshotDirectory, { recursive: true })
    await mobile.screenshot({
      path: `${screenshotDirectory}/gallery-mobile.png`,
    })
  } finally {
    await mobile.close()
  }
})

test('unsupported WebGL and model failure return a usable poster', async ({
  page,
  browser,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.route('**/frontend-study.glb', (route) => route.abort())
  await page.goto(web)
  await gallery(page).getByRole('button', { name: 'Explore in 3D' }).click()
  await expect(
    page.getByText('3D unavailable. The static gallery is shown.'),
  ).toBeVisible()
  await expect(page.locator('.gallery-poster img')).toBeVisible()

  const unsupported = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  })
  try {
    await unsupported.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext
      Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
        value(this: HTMLCanvasElement, kind: string, options?: unknown) {
          if (kind === 'webgl2') return null
          return Reflect.apply(original, this, [kind, options])
        },
      })
    })
    await unsupported.goto(web)
    await gallery(unsupported)
      .getByRole('button', { name: 'Explore in 3D' })
      .click()
    await expect(
      unsupported.getByText('3D unavailable. The static gallery is shown.'),
    ).toBeVisible()
    await expect(
      unsupported.getByRole('link', { name: 'Explore My Stack' }),
    ).toBeVisible()
  } finally {
    await unsupported.close()
  }
})

test('five station tour resolves published categories and profiles the live session', async ({
  page,
  request,
}, testInfo) => {
  test.setTimeout(115_000)
  await withFrontend(
    request,
    async () => {
      await page.setViewportSize({ width: 1440, height: 1000 })
      await page.goto(web)
      const controls = gallery(page)
      await controls.getByRole('button', { name: 'Explore in 3D' }).click()
      const surface = page.locator('.gallery-surface--live')
      const selector = controls.getByRole('combobox', {
        name: 'Engineering station',
      })
      await expect(selector.getByRole('option')).toHaveCount(5)
      const keys = ['frontend', 'backend', 'ai', 'infrastructure', 'product']
      const directory = 'docs/screenshots/phase-6b'
      const capture = process.env.GALLERY_SOAK === '1'
      if (capture) await mkdir(directory, { recursive: true })
      const metrics = []
      for (const [index, key] of keys.entries()) {
        await selector.focus()
        if (index > 0) await selector.press('ArrowDown')
        await expect(selector).toHaveValue(String(index))
        await expect(surface).toHaveAttribute(
          'data-gallery-stop',
          String(index),
        )
        const href = `#stack-seed-category-${key}`
        await expect(controls.locator('a')).toHaveAttribute('href', href)
        await expect(page.locator(href).locator('.skill').first()).toBeVisible()
        metrics.push(
          await surface.evaluate((canvas) => ({
            draws: Number(canvas.dataset.galleryDrawCalls),
            triangles: Number(canvas.dataset.galleryTriangles),
            textures: Number(canvas.dataset.galleryTextures),
          })),
        )
        if (capture) await page.screenshot({ path: `${directory}/${key}.png` })
      }
      expect(Math.max(...metrics.map(({ draws }) => draws))).toBeLessThan(40)
      expect(
        Math.max(...metrics.map(({ triangles }) => triangles)),
      ).toBeLessThan(1800)
      const cdp = await page.context().newCDPSession(page)
      const sample = async () => {
        await cdp.send('HeapProfiler.collectGarbage')
        return {
          heap: await cdp.send('Runtime.getHeapUsage'),
          dom: await cdp.send('Memory.getDOMCounters'),
        }
      }
      if (capture) {
        const before = await sample()
        const frames = await page.evaluate(async () => {
          const track = document.querySelector<HTMLElement>('.gallery-scroll')!
          const intro = track.querySelector<HTMLElement>('.intro')!
          const origin = track.getBoundingClientRect().top + window.scrollY
          const distance = track.offsetHeight - intro.offsetHeight
          const intervals: number[] = []
          let previous = 0
          const start = performance.now()
          await new Promise<void>((resolve) => {
            function step(time: number) {
              if (previous) intervals.push(time - previous)
              previous = time
              const elapsed = time - start
              if (elapsed >= 65_000) return resolve()
              const lane = (elapsed / 5_200) % 2
              const progress = lane <= 1 ? lane : 2 - lane
              window.scrollTo({
                top: origin + distance * progress,
                behavior: 'instant',
              })
              requestAnimationFrame(step)
            }
            requestAnimationFrame(step)
          })
          window.scrollTo({ top: 0, behavior: 'instant' })
          const ordered = intervals.toSorted((a, b) => a - b)
          return {
            samples: ordered.length,
            median: ordered[Math.floor(ordered.length * 0.5)],
            p95: ordered[Math.floor(ordered.length * 0.95)],
          }
        })
        const after = await sample()
        console.log(
          'Gallery 6B profile',
          JSON.stringify({ metrics, frames, before, after }),
        )
        await testInfo.attach('gallery-6b-profile', {
          body: JSON.stringify({ metrics, frames, before, after }),
          contentType: 'application/json',
        })
        const mobile = await page.context().newPage()
        try {
          await mobile.setViewportSize({ width: 390, height: 844 })
          await mobile.goto(web)
          await expect(mobile.locator('canvas')).toHaveCount(0)
          await mobile.screenshot({ path: `${directory}/mobile.png` })
        } finally {
          await mobile.close()
        }
      }
      await selector.selectOption('4')
      await controls.locator('a').click()
      await expect(page).toHaveURL(/#stack-seed-category-product$/)
      await expect(surface).toHaveCount(0)
    },
    true,
  )
})

for (const [width, height] of [
  [1280, 800],
  [1440, 1000],
  [1920, 1080],
]) {
  test(`desktop gallery pins and follows native scroll at ${width} × ${height}`, async ({
    page,
  }) => {
    test.setTimeout(60_000)
    await page.setViewportSize({ width, height })
    await page.goto(web)
    const hero = page.locator('.gallery-scroll .intro')
    await gallery(page).getByRole('button', { name: 'Explore in 3D' }).click()
    const canvas = hero.locator('.gallery-surface--live')
    await expect(canvas).toBeVisible()
    await expect(hero).toHaveCSS('position', 'sticky')
    const track = page.locator('.gallery-scroll')
    const measure = () =>
      track.evaluate((node) => {
        const view = node.querySelector<HTMLElement>('.intro')!
        return {
          start: Math.round(node.getBoundingClientRect().top + window.scrollY),
          range: node.offsetHeight - view.offsetHeight,
        }
      })
    const { start, range } = await measure()
    expect(range).toBeGreaterThan(height)
    const scrollTo = (top: number) =>
      page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), top)
    const selector = gallery(page).getByRole('combobox', {
      name: 'Engineering station',
    })
    const stop = async (index: number) => {
      await scrollTo(start + Math.round((range * index) / 4))
      await expect(canvas).toHaveAttribute('data-gallery-stop', String(index))
      await expect(selector).toHaveValue(String(index))
      expect(Math.abs((await hero.boundingBox())!.y)).toBeLessThan(2)
    }
    for (const index of [0, 1, 2, 3, 4, 2, 0]) await stop(index)
    expect(
      (await page.locator('#technology-stack').boundingBox())!.y,
    ).toBeGreaterThan(height)
    await page.mouse.move(width * 0.8, height * 0.55)
    await page.mouse.wheel(0, Math.round(range / 4))
    await expect(canvas).toHaveAttribute('data-gallery-stop', '1')
    expect(Math.abs((await hero.boundingBox())!.y)).toBeLessThan(2)
    await stop(0)

    await selector.focus()
    await selector.press('ArrowDown')
    await expect(canvas).toHaveAttribute('data-gallery-stop', '1')
    expect(
      Math.abs((await page.evaluate(() => scrollY)) - (start + range / 4)),
    ).toBeLessThan(3)

    await scrollTo(start + range + 120)
    await expect(canvas).toHaveAttribute('data-gallery-stop', '4')
    await expect
      .poll(async () => (await hero.boundingBox())!.y)
      .toBeLessThan(-100)
    const endPose = await canvas.getAttribute('data-gallery-progress')
    await scrollTo(start + range + 200)
    await expect
      .poll(async () => (await hero.boundingBox())!.y)
      .toBeLessThan(-180)
    await expect(canvas).toHaveAttribute('data-gallery-progress', endPose!)
    await stop(3)
  })
}
