import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateCharacter, createCharacter } from '@/app/actions';
import { prisma } from '@/lib/prisma';

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    character: {
      findUnique: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    campaign: {
        create: vi.fn()
    },
    logEntry: {
        create: vi.fn()
    }
  }
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  unstable_cache: vi.fn((fn) => fn),
}));

vi.mock('react', () => ({
  cache: vi.fn((fn) => fn),
}));

vi.mock('@/lib/ai', () => ({
  generateStory: vi.fn().mockResolvedValue(null)
}));

vi.mock('@/lib/backup', () => ({
  checkAutoBackup: vi.fn().mockResolvedValue(null)
}));

describe('Quartermaster Attribute Checks', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should preserve other attributes during partial update', async () => {
        // Existing character with custom stats
        const existing = {
            id: 'char-1',
            name: 'Test Char',
            campaignId: 'camp-1',
            level: 1,
            hp: 10,
            maxHp: 10,
            armorClass: 10,
            speed: 30,
            initiative: 0,
            conditions: '[]',
            inventory: '[]',
            attributes: JSON.stringify({ str: 18, dex: 16, con: 14, int: 12, wis: 10, cha: 8 }),
        };

        // Mock findUnique to return existing character
        vi.mocked(prisma.character.findUnique).mockResolvedValue(existing as any);

        // Mock update to return updated character (so action doesn't crash)
        vi.mocked(prisma.character.update).mockResolvedValue({ ...existing } as any);

        const formData = new FormData();
        formData.append('str', '20'); // Updating ONLY Strength

        await updateCharacter('char-1', formData);

        // Verify update call
        const updateCall = vi.mocked(prisma.character.update).mock.calls[0];
        if (!updateCall) throw new Error("Update not called");

        const updateData = updateCall[0].data;
        // Check attributes sent to DB
        // updateData.attributes will be a JSON string
        const newAttributes = JSON.parse(updateData.attributes as string);

        expect(newAttributes.str).toBe(20);
        expect(newAttributes.dex).toBe(16); // Should remain 16
        expect(newAttributes.con).toBe(14); // Should remain 14
    });

    it('should create character with full default attributes', async () => {
        vi.mocked(prisma.character.create).mockResolvedValue({ id: 'new-char', name: 'New Char', campaignId: 'camp-1' } as any);

        const formData = new FormData();
        formData.append('campaignId', 'camp-1');
        formData.append('name', 'New Char');
        // No attributes provided

        await createCharacter(formData);

        const createCall = vi.mocked(prisma.character.create).mock.calls[0][0];
        const attributes = JSON.parse(createCall.data.attributes as string);

        expect(attributes.str).toBe(10);
        expect(attributes.dex).toBe(10);
    });

    it('should create character with merged attributes', async () => {
        vi.mocked(prisma.character.create).mockResolvedValue({ id: 'new-char', name: 'New Char', campaignId: 'camp-1' } as any);

        const formData = new FormData();
        formData.append('campaignId', 'camp-1');
        formData.append('name', 'New Char');
        formData.append('str', '18'); // Only Str provided

        await createCharacter(formData);

        const createCall = vi.mocked(prisma.character.create).mock.calls[0][0];
        const attributes = JSON.parse(createCall.data.attributes as string);

        expect(attributes.str).toBe(18);
        expect(attributes.dex).toBe(10); // Default
    });
});
