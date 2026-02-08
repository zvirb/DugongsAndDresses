import { describe, it, expect, vi, beforeEach } from 'vitest'
import { advanceTurn } from './actions'
import { prisma } from '@/lib/prisma'

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    character: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    $transaction: vi.fn((actions) => Promise.resolve(actions)),
  }
}))

// Mock revalidatePath to avoid Next.js errors
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

// Mock actions-utils to just run the callback
vi.mock('@/lib/actions-utils', () => ({
  actionWrapper: vi.fn((name, fn) => fn()),
}))

describe('advanceTurn', () => {
  const campaignId = 'test-campaign'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('advances turn to the next character', async () => {
    // Setup characters: A (active), B, C
    const characters = [
      { id: '1', activeTurn: true, initiativeRoll: 20 },
      { id: '2', activeTurn: false, initiativeRoll: 15 },
      { id: '3', activeTurn: false, initiativeRoll: 10 },
    ]

    vi.mocked(prisma.character.findMany).mockResolvedValue(characters as any)
    vi.mocked(prisma.character.update).mockResolvedValue({ id: '2', activeTurn: true } as any)

    // Act
    const result = await advanceTurn(campaignId, '1')

    // Assert
    expect(prisma.character.updateMany).toHaveBeenCalledWith({
      where: { campaignId, activeTurn: true },
      data: { activeTurn: false }
    })
    expect(prisma.character.update).toHaveBeenCalledWith({
      where: { id: '2' },
      data: { activeTurn: true }
    })
    expect(result).toEqual({ id: '2', activeTurn: true })
  })

  it('loops back to the first character', async () => {
    // Setup characters: A, B, C (active)
    const characters = [
      { id: '1', activeTurn: false, initiativeRoll: 20 },
      { id: '2', activeTurn: false, initiativeRoll: 15 },
      { id: '3', activeTurn: true, initiativeRoll: 10 },
    ]

    vi.mocked(prisma.character.findMany).mockResolvedValue(characters as any)
    vi.mocked(prisma.character.update).mockResolvedValue({ id: '1', activeTurn: true } as any)

    // Act
    const result = await advanceTurn(campaignId, '3')

    // Assert
    expect(prisma.character.update).toHaveBeenCalledWith({
      where: { id: '1' },
      data: { activeTurn: true }
    })
  })

  it('handles race condition: returns current active if expected mismatch', async () => {
    // Setup characters: A (active in DB), B, C
    // Client thinks C is active (stale), calls with expectedActiveId='3'
    const characters = [
      { id: '1', activeTurn: true, initiativeRoll: 20 },
      { id: '2', activeTurn: false, initiativeRoll: 15 },
      { id: '3', activeTurn: false, initiativeRoll: 10 },
    ]

    vi.mocked(prisma.character.findMany).mockResolvedValue(characters as any)
    vi.mocked(prisma.character.findUnique).mockResolvedValue({ id: '1', activeTurn: true } as any)

    // Act
    const result = await advanceTurn(campaignId, '3')

    // Assert
    // Should verify we did NOT update anything
    expect(prisma.character.updateMany).not.toHaveBeenCalled()
    expect(prisma.character.update).not.toHaveBeenCalled()
    // Should return the ACTUAL active character (A)
    expect(result).toEqual({ id: '1', activeTurn: true })
  })

  it('advances if expectedActiveId matches', async () => {
    // Setup characters: A (active), B
    const characters = [
        { id: '1', activeTurn: true, initiativeRoll: 20 },
        { id: '2', activeTurn: false, initiativeRoll: 15 },
    ]
    vi.mocked(prisma.character.findMany).mockResolvedValue(characters as any)
    vi.mocked(prisma.character.update).mockResolvedValue({ id: '2', activeTurn: true } as any)

    await advanceTurn(campaignId, '1')

    expect(prisma.character.update).toHaveBeenCalled()
  })

  it('advances if expectedActiveId is undefined (force)', async () => {
      // Setup: A (active)
      const characters = [
          { id: '1', activeTurn: true, initiativeRoll: 20 },
          { id: '2', activeTurn: false, initiativeRoll: 15 },
      ]
      vi.mocked(prisma.character.findMany).mockResolvedValue(characters as any)
      vi.mocked(prisma.character.update).mockResolvedValue({ id: '2', activeTurn: true } as any)

      await advanceTurn(campaignId, undefined)

      expect(prisma.character.update).toHaveBeenCalledWith({
          where: { id: '2' },
          data: { activeTurn: true }
      })
  })
})
