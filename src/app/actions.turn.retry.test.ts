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
    $transaction: vi.fn(),
  },
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  unstable_cache: vi.fn((fn) => fn),
}));

vi.mock('react', () => ({
  cache: vi.fn((fn) => fn),
}));

vi.mock('@/lib/backup', () => ({
  checkAutoBackup: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/ai', () => ({
  generateStory: vi.fn().mockResolvedValue(undefined),
}));

describe('Turn Retry Logic', () => {
    const campaignId = 'retry-campaign';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('Scenario: Combatant Vanished (Retry Success)', async () => {
        // Step 1: Initial State (A Active, B Inactive)
        const charA = { id: '1', name: 'CharA', activeTurn: true, initiativeRoll: 20 };
        const charB = { id: '2', name: 'CharB', activeTurn: false, initiativeRoll: 15 };

        // Mock findMany to return [A, B] on first call, then [A] on second call (B vanished)
        vi.mocked(prisma.character.findMany)
            .mockResolvedValueOnce([charA, charB] as any) // First attempt
            .mockResolvedValueOnce([charA] as any);       // Second attempt (Retry)

        // Mock $transaction
        // First call: Throws P2025 (B not found)
        const error: any = new Error('Record to update not found.');
        error.code = 'P2025';

        // Second call: Succeeds (A -> A loop)
        const updateResult = { id: '1', name: 'CharA', activeTurn: true };

        vi.mocked(prisma.$transaction)
            .mockRejectedValueOnce(error)
            .mockResolvedValueOnce([{ count: 1 }, updateResult] as any);

        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        // Call advanceTurn
        const result = await advanceTurn(campaignId, '1');

        // Verification
        expect(prisma.character.findMany).toHaveBeenCalledTimes(2);
        expect(prisma.$transaction).toHaveBeenCalledTimes(2);

        // Verify Retry Log
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[SENTRY] Race Condition: Next character 2 not found (likely deleted). Retrying attempt 1...'));

        // Verify Success
        expect(result).toEqual({ success: true, data: updateResult });

        consoleSpy.mockRestore();
    });

    it('Scenario: Max Retries Exceeded', async () => {
        // Setup: Always fails with P2025
        const charA = { id: '1', name: 'CharA', activeTurn: true, initiativeRoll: 20 };
        const charB = { id: '2', name: 'CharB', activeTurn: false, initiativeRoll: 15 };

        vi.mocked(prisma.character.findMany).mockResolvedValue([charA, charB] as any);

        const error: any = new Error('Record to update not found.');
        error.code = 'P2025';
        vi.mocked(prisma.$transaction).mockRejectedValue(error);

        const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        // Call advanceTurn
        const result = await advanceTurn(campaignId, '1');

        expect(result).toEqual({
            success: false,
            error: "Combatant vanished! The next character cannot be found even after retrying."
        });

        // Verification (Should try 0, 1, 2, 3 times -> 4 calls total? No, 3 retries means call 0, retry 1, retry 2, retry 3. 4 calls.)
        // Initial call (retryCount=0) -> Fail -> Call retryCount=1
        // Retry 1 -> Fail -> Call retryCount=2
        // Retry 2 -> Fail -> Call retryCount=3
        // Retry 3 -> Fail -> Max retries reached -> Throw

        expect(prisma.$transaction).toHaveBeenCalledTimes(4);

        expect(consoleWarnSpy).toHaveBeenCalledTimes(3);
        expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('[SENTRY] Critical Failure: Max retries reached'));

        consoleWarnSpy.mockRestore();
        consoleErrorSpy.mockRestore();
    });
});
