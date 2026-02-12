
import { updateHP } from './actions';
import { prisma } from '@/lib/prisma';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
    prisma: {
        character: {
            update: vi.fn(),
            findUnique: vi.fn(),
        },
        logEntry: {
            create: vi.fn(),
        },
        settings: {
            findFirst: vi.fn().mockResolvedValue(null),
        },
        $transaction: vi.fn((callback) => callback(prisma)),
    }
}));

// Mock Next.js cache
vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}));

// Mock actionWrapper
vi.mock('@/lib/actions-utils', () => ({
    actionWrapper: async (name: string, fn: Function) => {
        try {
            const data = await fn();
            return { success: true, data };
        } catch (e: any) {
            return { success: false, error: e.message };
        }
    }
}));

// Mock AI
vi.mock('@/lib/ai', () => ({
    generateStory: vi.fn().mockResolvedValue(undefined),
}));

// Mock Backup
vi.mock('@/lib/backup', () => ({
    checkAutoBackup: vi.fn().mockResolvedValue(undefined),
}));

describe('updateHP - Unconsciousness Logic', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should add Unconscious condition when HP drops to 0', async () => {
        // Mock 1st update: HP change
        vi.mocked(prisma.character.update).mockResolvedValueOnce({
            id: 'char-1',
            name: 'TestChar',
            hp: 0,
            campaignId: 'camp-1',
            conditions: '[]',
            sourceId: null
        } as any);

        // Mock 2nd update: Condition change
        vi.mocked(prisma.character.update).mockResolvedValueOnce({
            id: 'char-1',
            name: 'TestChar',
            hp: 0,
            campaignId: 'camp-1',
            conditions: '["Unconscious"]',
            sourceId: null
        } as any);

        // Mock logEntry create for HP change + status change
        vi.mocked(prisma.logEntry.create).mockResolvedValue({} as any);

        const result = await updateHP('char-1', -5);

        expect(result.success).toBe(true);

        // We expect 2 character updates:
        // 1. HP update
        // 2. Condition update
        // And possibly syncToSource calls (which use update or findUnique, but we mocked update)
        // syncToSource calls update on sourceId if present. Here sourceId is null.

        expect(prisma.character.update).toHaveBeenCalledTimes(2);

        // Check the second call arguments (adding Unconscious)
        const secondCallArgs = vi.mocked(prisma.character.update).mock.calls[1];
        expect(secondCallArgs[0]).toEqual({
            where: { id: 'char-1' },
            data: { conditions: '["Unconscious"]' }
        });
    });

    it('should remove Unconscious condition when HP becomes positive', async () => {
        // Mock 1st update: HP change
        vi.mocked(prisma.character.update).mockResolvedValueOnce({
            id: 'char-1',
            name: 'TestChar',
            hp: 5,
            campaignId: 'camp-1',
            conditions: '["Unconscious"]',
            sourceId: null
        } as any);

        // Mock 2nd update: Condition change
        vi.mocked(prisma.character.update).mockResolvedValueOnce({
            id: 'char-1',
            name: 'TestChar',
            hp: 5,
            campaignId: 'camp-1',
            conditions: '[]',
            sourceId: null
        } as any);

        vi.mocked(prisma.logEntry.create).mockResolvedValue({} as any);

        const result = await updateHP('char-1', 5);

        expect(result.success).toBe(true);
        expect(prisma.character.update).toHaveBeenCalledTimes(2);

        // Check the second call arguments (removing Unconscious)
        const secondCallArgs = vi.mocked(prisma.character.update).mock.calls[1];
        expect(secondCallArgs[0]).toEqual({
            where: { id: 'char-1' },
            data: { conditions: '[]' }
        });
    });
});
