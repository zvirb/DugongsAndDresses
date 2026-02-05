import { describe, it, expect, vi } from 'vitest'
import { actionWrapper } from './actions-utils'

describe('actionWrapper', () => {
  it('returns success and data on successful execution', async () => {
    const result = await actionWrapper('testAction', async () => {
      return { foo: 'bar' }
    })

    expect(result).toEqual({
      success: true,
      data: { foo: 'bar' }
    })
  })

  it('returns failure and error message on thrown error', async () => {
    const result = await actionWrapper('testAction', async () => {
      throw new Error('Something went wrong')
    })

    expect(result).toEqual({
      success: false,
      error: 'Something went wrong'
    })
  })

  it('handles non-Error objects being thrown', async () => {
    const result = await actionWrapper('testAction', async () => {
      throw 'A string error'
    })

    expect(result).toEqual({
      success: false,
      error: 'An unknown error occurred'
    })
  })
})
