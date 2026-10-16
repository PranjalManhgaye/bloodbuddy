import { describe, it, expect } from 'vitest'
import { formatDate, cn } from '@/lib/utils'

describe('utils', () => {
  it('formats dates', () => {
    const result = formatDate('2026-10-20')
    expect(result).toContain('2026')
  })

  it('merges class names', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
    expect(cn('text-red-500', false && 'hidden', 'block')).toBe('text-red-500 block')
  })
})
