import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import { Character } from '@prisma/client';

// Mock dependencies
vi.mock('react', () => ({
  cache: (fn: any) => fn,
}));

vi.mock('@/lib/backup', () => ({
  checkAutoBackup: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/ai', () => ({
  generateStory: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    character: {
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      findUnique: vi.fn(),
    },
    logEntry: {
      create: vi.fn(),
    },
    $transaction: vi.fn((ops) => Promise.all(ops)),
  },
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  unstable_cache: (fn: any) => fn,
}));

import { advanceTurn } from '@/app/actions';

// Helper to create mock characters
const createMockCharacter = (id: string, name: string, init: number, active: boolean): Character => ({
  id,
  name,
  activeTurn: active,
  initiativeRoll: init,
  campaignId: 'test-campaign',
  // ... other required fields
  hp: 10, maxHp: 10, armorClass: 10, speed: 30, level: 1,
  type: 'PLAYER', race: 'Human', class: 'Fighter',
  attributes: '{}', inventory: '[]', conditions: '[]',
  imageUrl: null, sourceId: null, initiative: 0
});

describe('Turn Logic (Sentry)', () => {
  const campaignId = 'test-campaign';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should advance turn from index 0 to index 1', async () => {
    const chars = [
      createMockCharacter('char1', 'Alice', 20, true),
      createMockCharacter('char2', 'Bob', 15, false),
    ];

    vi.mocked(prisma.character.findMany).mockResolvedValue(chars);
    // Mock the update transaction result (new active char)
    vi.mocked(prisma.character.update).mockResolvedValue({ ...chars[1], activeTurn: true });
    vi.mocked(prisma.$transaction).mockResolvedValue([
      { count: 1 }, // updateMany result
      { ...chars[1], activeTurn: true } // update result
    ]);

    const result = await advanceTurn(campaignId, 'char1');

    expect(prisma.character.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { campaignId },
      orderBy: [{ initiativeRoll: 'desc' }, { id: 'asc' }]
    }));

    // Expect transaction to clear active turns and set next active
    expect(prisma.character.updateMany).toHaveBeenCalledWith({
      where: { campaignId, activeTurn: true },
      data: { activeTurn: false }
    });
    expect(prisma.character.update).toHaveBeenCalledWith({
      where: { id: 'char2' },
      data: { activeTurn: true }
    });

    expect(result.data?.id).toBe('char2');
  });

  it('should loop from last index to index 0', async () => {
    const chars = [
      createMockCharacter('char1', 'Alice', 20, false),
      createMockCharacter('char2', 'Bob', 15, true),
    ];

    vi.mocked(prisma.character.findMany).mockResolvedValue(chars);
    vi.mocked(prisma.$transaction).mockResolvedValue([
      { count: 1 },
      { ...chars[0], activeTurn: true }
    ]);
    vi.mocked(prisma.character.update).mockResolvedValue({ ...chars[0], activeTurn: true });

    const result = await advanceTurn(campaignId, 'char2');

    expect(prisma.character.update).toHaveBeenCalledWith({
      where: { id: 'char1' }, // Looped to first char
      data: { activeTurn: true }
    });
    expect(result.data?.id).toBe('char1');
  });

  it('should detect race condition and sync to DB state (Idempotency)', async () => {
    // Client thinks 'char1' is active, but DB says 'char2' is active
    const chars = [
      createMockCharacter('char1', 'Alice', 20, false),
      createMockCharacter('char2', 'Bob', 15, true),
    ];

    vi.mocked(prisma.character.findMany).mockResolvedValue(chars);
    vi.mocked(prisma.character.findUnique).mockResolvedValue(chars[1]);

    // Client passes 'char1' as expected active ID
    const result = await advanceTurn(campaignId, 'char1');

    // Should NOT call update or transaction
    expect(prisma.character.updateMany).not.toHaveBeenCalled();
    expect(prisma.character.update).not.toHaveBeenCalled();

    // Should return the ACTUAL active character (char2)
    expect(result.data?.id).toBe('char2');
  });

  it('should handle start of combat (no one active)', async () => {
    const chars = [
      createMockCharacter('char1', 'Alice', 20, false),
      createMockCharacter('char2', 'Bob', 15, false),
    ];

    vi.mocked(prisma.character.findMany).mockResolvedValue(chars);
    vi.mocked(prisma.$transaction).mockResolvedValue([
      { count: 0 },
      { ...chars[0], activeTurn: true }
    ]);
    vi.mocked(prisma.character.update).mockResolvedValue({ ...chars[0], activeTurn: true });

    // Client passes undefined (start)
    const result = await advanceTurn(campaignId, undefined);

    // Should activate index 0
    expect(prisma.character.update).toHaveBeenCalledWith({
      where: { id: 'char1' },
      data: { activeTurn: true }
    });
    expect(result.data?.id).toBe('char1');
  });
});
