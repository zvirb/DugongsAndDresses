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

    it('Scenario: Idempotency (Client Stale - Sync)', async () => {
        // Setup: A, B, C.
        // Client thinks A ('1') is active.
        // DB says B ('2') is active (Another DM advanced it).
        const characters = [
            { id: '1', name: 'Char1', activeTurn: false, initiativeRoll: 20 },
            { id: '2', name: 'Char2', activeTurn: true, initiativeRoll: 15 },
            { id: '3', name: 'Char3', activeTurn: false, initiativeRoll: 10 },
        ];
        vi.mocked(prisma.character.findMany).mockResolvedValue(characters as any);

        // Mock findUnique for the return value
        const activeChar = { id: '2', name: 'Char2', activeTurn: true };
        vi.mocked(prisma.character.findUnique).mockResolvedValue(activeChar as any);

        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        // Client calls advanceTurn expecting '1' to be active
        const result = await advanceTurn(campaignId, '1');

        // Should NOT advance turn. Should return '2' (Sync).
        expect(prisma.character.update).not.toHaveBeenCalled();
        expect(prisma.$transaction).not.toHaveBeenCalled();

        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[SENTRY] Race Condition Detected'));

        // Result should be the actual active character (Char2)
        expect(result).toEqual({ success: true, data: activeChar });

        consoleSpy.mockRestore();
    });

    it('Scenario: Normal Advance', async () => {
        // Setup: A ('1') active. Advance to B ('2').
        const characters = [
            { id: '1', name: 'Char1', activeTurn: true, initiativeRoll: 20 },
            { id: '2', name: 'Char2', activeTurn: false, initiativeRoll: 15 },
        ];
        vi.mocked(prisma.character.findMany).mockResolvedValue(characters as any);

        const updateResult = { id: '2', name: 'Char2', activeTurn: true };
        vi.mocked(prisma.$transaction).mockResolvedValue([{ count: 1 }, updateResult] as any);

        const result = await advanceTurn(campaignId, '1');

        // Should advance to '2'
        expect(prisma.character.update).toHaveBeenCalledWith({
            where: { id: '2' },
            data: { activeTurn: true }
        });

        expect(result).toEqual({ success: true, data: updateResult });
    });

    it('Scenario: Loop Safety (Last -> First)', async () => {
        // Setup: A (0), B (1), C (2 - Active). Next should be A (0).
        const characters = [
            { id: '1', name: 'Char1', activeTurn: false, initiativeRoll: 20 },
            { id: '2', name: 'Char2', activeTurn: false, initiativeRoll: 15 },
            { id: '3', name: 'Char3', activeTurn: true, initiativeRoll: 10 },
        ];
        vi.mocked(prisma.character.findMany).mockResolvedValue(characters as any);

        const updateResult = { id: '1', name: 'Char1', activeTurn: true };
        vi.mocked(prisma.$transaction).mockResolvedValue([{ count: 1 }, updateResult] as any);

        // Advance turn from '3' (last one)
        const result = await advanceTurn(campaignId, '3');

        // Should loop back to '1' (first one)
        expect(prisma.character.update).toHaveBeenCalledWith({
            where: { id: '1' },
            data: { activeTurn: true }
        });

        expect(result).toEqual({ success: true, data: updateResult });
    });

    it('Scenario: Empty Campaign (Should Return Error)', async () => {
        vi.mocked(prisma.character.findMany).mockResolvedValue([]);
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        const result = await advanceTurn(campaignId);

        expect(result).toEqual({ success: false, error: 'No characters in campaign' });
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[SENTRY] AdvanceTurn failed: No characters found'));

        consoleSpy.mockRestore();
    });

    it('Scenario: Combatant Vanished (Race Condition - Deleted during turn)', async () => {
        // Setup: A (Active) -> B.
        // But B is deleted right before transaction.
        const characters = [
            { id: '1', name: 'Char1', activeTurn: true, initiativeRoll: 20 },
            { id: '2', name: 'Char2', activeTurn: false, initiativeRoll: 15 },
        ];
        vi.mocked(prisma.character.findMany).mockResolvedValue(characters as any);

        // Mock transaction to throw P2025
        const error: any = new Error('Record to update not found.');
        error.code = 'P2025';
        vi.mocked(prisma.$transaction).mockRejectedValue(error);

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        const result = await advanceTurn(campaignId, '1');

        expect(result).toEqual({
            success: false,
            error: expect.stringContaining('Combatant vanished!')
        });
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[SENTRY] Race Condition: Next character 2 not found'));

        consoleSpy.mockRestore();
    });
});
