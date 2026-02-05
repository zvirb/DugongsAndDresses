import { describe, it, expect } from 'vitest'
import { cn } from './utils'

describe('cn utility', () => {
  it('merges multiple class names', () => {
    expect(cn('class1', 'class2')).toBe('class1 class2')
  })

  it('filters out falsy values', () => {
    expect(cn('class1', null, 'class2', undefined, false, '')).toBe('class1 class2')
  })

  it('returns empty string when no arguments provided', () => {
    expect(cn()).toBe('')
  })
})
