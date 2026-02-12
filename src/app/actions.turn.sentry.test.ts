import { describe, it, expect, vi, beforeEach } from 'vitest';
import { advanceTurn } from '@/app/actions';
import { prisma } from '@/lib/prisma';

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    character: {
      update: vi.fn(),
      updateMany: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    logEntry: {
      create: vi.fn(),
    },
    $transaction: vi.fn((actions) => Promise.resolve(actions)),
  },
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// Mock fire-and-forget side effects to prevent console errors
vi.mock('@/lib/backup', () => ({
  checkAutoBackup: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/ai', () => ({
  generateStory: vi.fn().mockResolvedValue(undefined),
}));

describe('Sentry Logic Fortification', () => {
    const campaignId = 'sentry-campaign';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('Scenario: Client expects Active ID, DB has NONE (Restart at 0)', async () => {
        // Setup: A, B. None active in DB. Client thinks '999' is active.
        const characters = [
            { id: '1', name: 'Char1', activeTurn: false, initiativeRoll: 20 },
            { id: '2', name: 'Char2', activeTurn: false, initiativeRoll: 15 },
        ];
        vi.mocked(prisma.character.findMany).mockResolvedValue(characters as any);

        const updateResult = { id: '1', name: 'Char1', activeTurn: true };
        vi.mocked(prisma.$transaction).mockResolvedValue([{ count: 0 }, updateResult] as any);

        // Spy on console.warn to verify the Sentry log
        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        // Client says '999' is active
        const result = await advanceTurn(campaignId, '999');

        // Should start with first character (A)
        expect(prisma.character.update).toHaveBeenCalledWith({
            where: { id: '1' },
            data: { activeTurn: true }
        });

        // Verify Sentry Log
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[SENTRY] Race Condition: Client expects active character 999, but DB has none. Resetting to start.'));

        expect(result).toEqual({ success: true, data: updateResult });
        consoleSpy.mockRestore();
    });

    it('Scenario: Loop safety with single character', async () => {
        // Setup: A (active) -> A
        const characters = [
            { id: '1', name: 'Char1', activeTurn: true, initiativeRoll: 20 },
        ];
        vi.mocked(prisma.character.findMany).mockResolvedValue(characters as any);
        const updateResult = { id: '1', name: 'Char1', activeTurn: true };
        vi.mocked(prisma.$transaction).mockResolvedValue([{ count: 1 }, updateResult] as any);

        await advanceTurn(campaignId, '1');

        expect(prisma.character.update).toHaveBeenCalledWith({
            where: { id: '1' },
            data: { activeTurn: true }
        });
    });
});
