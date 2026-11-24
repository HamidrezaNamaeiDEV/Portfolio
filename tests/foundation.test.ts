import { expect, test } from 'vitest'
import { formatPersianMonth, persianMonths } from '@a/contracts'

test('formats Persian employment months at the exact granularity supplied', () => {
  expect(formatPersianMonth(1404, 11)).toBe('Bahman 1404')
  expect(formatPersianMonth(1404, 3)).toBe('Khordad 1404')
  expect(formatPersianMonth(1404, 12)).toBe('Esfand 1404')
  expect(formatPersianMonth(1405, 1)).toBe('Farvardin 1405')
  expect(persianMonths).toHaveLength(12)
})
