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

describe('Turn Logic Fortification', () => {
    const campaignId = 'test-campaign';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('advances turn to the next character (Normal Flow)', async () => {
        // Setup: A (active) -> B
        const characters = [
            { id: '1', name: 'Char1', activeTurn: true, initiativeRoll: 20 },
            { id: '2', name: 'Char2', activeTurn: false, initiativeRoll: 15 },
        ];
        vi.mocked(prisma.character.findMany).mockResolvedValue(characters as any);
        const updateResult = { id: '2', name: 'Char2', activeTurn: true };
        vi.mocked(prisma.$transaction).mockResolvedValue([{ count: 1 }, updateResult] as any);

        const result = await advanceTurn(campaignId, '1');

        expect(prisma.character.update).toHaveBeenCalledWith({
            where: { id: '2' },
            data: { activeTurn: true }
        });
        expect(result).toEqual({ success: true, data: updateResult });
    });

    it('loops back to the first character (Loop Safety)', async () => {
        // Setup: A, B (active) -> A
        const characters = [
            { id: '1', name: 'Char1', activeTurn: false, initiativeRoll: 20 },
            { id: '2', name: 'Char2', activeTurn: true, initiativeRoll: 15 },
        ];
        vi.mocked(prisma.character.findMany).mockResolvedValue(characters as any);
        const updateResult = { id: '1', name: 'Char1', activeTurn: true };
        vi.mocked(prisma.$transaction).mockResolvedValue([{ count: 1 }, updateResult] as any);

        await advanceTurn(campaignId, '2');

        expect(prisma.character.update).toHaveBeenCalledWith({
            where: { id: '1' },
            data: { activeTurn: true }
        });
    });

    it('handles race condition: Stale Client (Expected mismatch)', async () => {
        // Setup: A (active in DB), B. Client thinks B is active (stale or wrong).
        // Wait, if client thinks B is active, they send '2'.
        // DB says '1' is active.
        const characters = [
            { id: '1', name: 'Char1', activeTurn: true, initiativeRoll: 20 },
            { id: '2', name: 'Char2', activeTurn: false, initiativeRoll: 15 },
        ];
        vi.mocked(prisma.character.findMany).mockResolvedValue(characters as any);
        vi.mocked(prisma.character.findUnique).mockResolvedValue({ id: '1', name: 'Char1', activeTurn: true } as any);

        const result = await advanceTurn(campaignId, '2');

        // Should NOT advance
        expect(prisma.character.update).not.toHaveBeenCalled();
        // Should return actual active (A)
        expect(result).toEqual({ success: true, data: { id: '1', name: 'Char1', activeTurn: true } });
    });

    it('handles race condition: Unexpected Start', async () => {
        // Setup: A (active in DB). Client sends undefined (thinks start of combat).
        const characters = [
            { id: '1', name: 'Char1', activeTurn: true, initiativeRoll: 20 },
        ];
        vi.mocked(prisma.character.findMany).mockResolvedValue(characters as any);
        vi.mocked(prisma.character.findUnique).mockResolvedValue({ id: '1', name: 'Char1', activeTurn: true } as any);

        const result = await advanceTurn(campaignId, undefined);

        // Should NOT advance
        expect(prisma.character.update).not.toHaveBeenCalled();
        expect(result).toEqual({ success: true, data: { id: '1', name: 'Char1', activeTurn: true } });
    });

    it('starts combat correctly (No active character)', async () => {
        // Setup: A, B. None active.
        const characters = [
            { id: '1', name: 'Char1', activeTurn: false, initiativeRoll: 20 },
            { id: '2', name: 'Char2', activeTurn: false, initiativeRoll: 15 },
        ];
        vi.mocked(prisma.character.findMany).mockResolvedValue(characters as any);
        const updateResult = { id: '1', name: 'Char1', activeTurn: true };
        vi.mocked(prisma.$transaction).mockResolvedValue([{ count: 0 }, updateResult] as any);

        // expectedActiveId is undefined or null
        const result = await advanceTurn(campaignId);

        // Should start with first character (A)
        expect(prisma.character.update).toHaveBeenCalledWith({
            where: { id: '1' },
            data: { activeTurn: true }
        });
        expect(result).toEqual({ success: true, data: updateResult });
    });

    it('handles single participant campaign (Loop to self)', async () => {
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

    it('requests correct sorting from DB', async () => {
        vi.mocked(prisma.character.findMany).mockResolvedValue([]);
        try {
            await advanceTurn(campaignId);
        } catch (e) {
            // Expected "No characters" error
        }

        expect(prisma.character.findMany).toHaveBeenCalledWith(expect.objectContaining({
            orderBy: [
                { initiativeRoll: 'desc' },
                { id: 'asc' }
            ]
        }));
    });
});
