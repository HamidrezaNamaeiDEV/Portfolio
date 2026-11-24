import { ESLint } from 'eslint'
import { expect, test } from 'vitest'

const eslint = new ESLint({ cache: false })

const filename = 'apps/web/app/BoundaryProbe.vue'

function source(specifier: string) {
  return `<script setup lang="ts">import '${specifier}'</script>
<template><main>Boundary fixture</main></template>`
}

test.each(['@a/design-tokens', '@a/contracts'])(
  'allows Vue SFC imports from %s',
  async (specifier) => {
    const [result] = await eslint.lintText(source(specifier), {
      filePath: filename,
    })

    expect(result.messages).toEqual([])
  },
)

test.each(['../../admin/app/app.vue', '@a/admin/app/app.vue'])(
  'rejects the cross-app Vue SFC import %s',
  async (specifier) => {
    const [result] = await eslint.lintText(source(specifier), {
      filePath: filename,
    })

    expect(result.messages).toEqual([
      expect.objectContaining({
        ruleId: '@nx/enforce-module-boundaries',
        severity: 2,
      }),
    ])
  },
)
