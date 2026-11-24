import { expect, test } from '@playwright/test'

const applications = [
  {
    name: 'public',
    url: 'http://127.0.0.1:47121',
    heading: 'A/ Engineering Portfolio',
    details: 'Public rendering and client interaction are available.',
  },
  {
    name: 'admin',
    url: 'http://127.0.0.1:47122',
    heading: 'Portfolio administration',
    details: 'Admin rendering and client interaction are available.',
  },
]

for (const application of applications) {
  test(`${application.name} renders on the server and responds after hydration`, async ({
    page,
    request,
  }) => {
    const serverResponse = await request.get(application.url)
    expect(serverResponse.ok()).toBe(true)
    expect(await serverResponse.text()).toContain(
      `<h1>${application.heading}</h1>`,
    )

    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text())
    })

    await page.goto(application.url)
    await expect(
      page.getByRole('heading', { name: application.heading }),
    ).toBeVisible()
    await expect(page.locator('body')).toHaveCSS(
      'background-color',
      'rgb(21, 23, 21)',
    )

    const toggle = page.getByRole('button', { name: 'Show foundation details' })
    await expect(page.getByText(application.details)).toBeHidden()
    await toggle.click()
    await expect(page.getByText(application.details)).toBeVisible()
    await page.getByRole('button', { name: 'Hide foundation details' }).click()
    await expect(page.getByText(application.details)).toBeHidden()
    expect(errors).toEqual([])
  })
}
