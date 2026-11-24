import js from '@eslint/js'
import nx from '@nx/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import vue from 'eslint-plugin-vue'
import vueParser from 'vue-eslint-parser'

export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/.nuxt/**',
      '**/.output/**',
      '**/.keystone/**',
      '**/.nx/**',
      'apps/cms/generated/**',
    ],
  },
  js.configs.recommended,
  ...vue.configs['flat/essential'],
  {
    files: ['**/*.ts', '**/*.vue'],
    rules: { 'no-undef': 'off' },
  },
  {
    files: ['**/*.ts'],
    languageOptions: { parser: tsParser },
  },
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: { parser: tsParser },
    },
  },
  {
    files: ['apps/**/*.{ts,mjs,vue}', 'libs/**/*.{ts,mjs,vue}'],
    plugins: { '@nx': nx },
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          depConstraints: [
            {
              sourceTag: 'scope:web',
              onlyDependOnLibsWithTags: ['type:tokens', 'type:contracts'],
            },
            {
              sourceTag: 'scope:admin',
              onlyDependOnLibsWithTags: ['type:tokens', 'type:contracts'],
            },
            { sourceTag: 'scope:cms', onlyDependOnLibsWithTags: [] },
            { sourceTag: 'scope:shared', onlyDependOnLibsWithTags: [] },
          ],
        },
      ],
    },
  },
]
