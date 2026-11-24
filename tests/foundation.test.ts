import { renderToString } from '@vue/server-renderer'
import { createSSRApp } from 'vue'
import { expect, test } from 'vitest'
import Web from '../apps/web/app/app.vue'
import Admin from '../apps/admin/app/app.vue'

test('public shell presents the portfolio heading in SSR', async () => {
  const html = await renderToString(createSSRApp(Web))

  expect(html).toContain('<h1>A/ Engineering Portfolio</h1>')
  expect(html).toContain('A portfolio of software engineering work')
})

test('admin shell identifies the editorial workspace in SSR', async () => {
  const html = await renderToString(createSSRApp(Admin))

  expect(html).toContain('<h1>Portfolio administration</h1>')
  expect(html).toContain('Editorial workspace for portfolio content')
})
