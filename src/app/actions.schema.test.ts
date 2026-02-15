
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logAction, performAttack } from '@/app/actions';
import { prisma } from '@/lib/prisma';
import { LogTypeSchema, AttackActionSchema } from '@/lib/schemas';

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    logEntry: {
      create: vi.fn().mockResolvedValue({ id: 'log-1', content: 'test', type: 'Story' })
    },
    character: {
      findUnique: vi.fn(),
      update: vi.fn(),
    }
  }
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn()
}));

vi.mock('@/lib/ai', () => ({
  generateStory: vi.fn().mockResolvedValue(null)
}));

vi.mock('@/lib/backup', () => ({
  checkAutoBackup: vi.fn().mockResolvedValue(null)
}));

describe('Quartermaster Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Log Validation', () => {
    it('should validate log types', async () => {
      // Valid type
      await logAction('camp-1', 'Valid log', 'Story');
      expect(prisma.logEntry.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ type: 'Story' })
      }));

      // Invalid type should default to Story (and log warning, but we can't easily check console.warn here without mocking it)
      await logAction('camp-1', 'Invalid type log', 'INVALID_TYPE' as any);
      expect(prisma.logEntry.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ type: 'Story' })
      }));
    });

    it('should sanitize long content', async () => {
      const longContent = 'a'.repeat(2000);
      await logAction('camp-1', longContent, 'Story');

      const createCall = vi.mocked(prisma.logEntry.create).mock.calls[0][0];
      const savedContent = createCall.data.content;

      expect(savedContent.length).toBeLessThan(1100); // 1000 + suffix
      expect(savedContent).toContain('... (truncated)');
    });
  });

  describe('Action Input Validation', () => {
    it('should fail on invalid attack inputs', async () => {
      // Missing ID
      const res1 = await performAttack('', 'target-1', 10);
      expect(res1.success).toBe(false);

      // Negative damage
      const res2 = await performAttack('char-1', 'target-1', -5);
      expect(res2.success).toBe(false);
    });

    it('should pass valid attack inputs', async () => {
        vi.mocked(prisma.character.findUnique).mockResolvedValue({
            id: 'char-1', name: 'Char 1', campaignId: 'camp-1', armorClass: 10, hp: 10, sourceId: null
        } as any);
        vi.mocked(prisma.character.update).mockResolvedValue({
             id: 'char-1', name: 'Char 1', campaignId: 'camp-1', armorClass: 10, hp: 5, sourceId: null
        } as any);

        await performAttack('char-1', 'target-1', 5);
        expect(prisma.character.findUnique).toHaveBeenCalled();
    });
  });
});
