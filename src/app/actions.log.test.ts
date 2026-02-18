
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { performAttack, performSkillCheck, castSpell, updateHP, updateCharacter, updateInitiative, addInventoryItem, removeInventoryItem } from '@/app/actions';
import { prisma } from '@/lib/prisma';

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    logEntry: {
      create: vi.fn().mockResolvedValue({ id: 'log-1', content: 'test', type: 'Story' })
    },
    character: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback), // Mock transaction to just return callback result
  }
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
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

describe('Bard Logging Enhancements', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('performAttack', () => {
    it('should log a critical hit with flavor', async () => {
        vi.mocked(prisma.character.findUnique).mockImplementation(async (args) => {
            if (args.where.id === 'char-1') return { id: 'char-1', name: 'Grom', campaignId: 'camp-1', armorClass: 15, hp: 20 } as any;
            if (args.where.id === 'target-1') return { id: 'target-1', name: 'Goblin', campaignId: 'camp-1', armorClass: 12, hp: 5 } as any;
            return null;
        });
        vi.mocked(prisma.character.update).mockResolvedValue({
             id: 'target-1', name: 'Goblin', campaignId: 'camp-1', armorClass: 12, hp: 5
        } as any);

        await performAttack('char-1', 'target-1', 10, 20); // Natural 20

        const createCall = vi.mocked(prisma.logEntry.create).mock.calls[0][0];
        const content = createCall.data.content;

        expect(content).toContain('**Grom** attacks **Goblin**');
        expect(content).toContain('**CRITICAL HIT**!');
        expect(content).toContain('A devastating blow!');
    });

    it('should log a critical miss with flavor', async () => {
        vi.mocked(prisma.character.findUnique).mockImplementation(async (args) => {
            if (args.where.id === 'char-1') return { id: 'char-1', name: 'Grom', campaignId: 'camp-1', armorClass: 15, hp: 20 } as any;
            if (args.where.id === 'target-1') return { id: 'target-1', name: 'Goblin', campaignId: 'camp-1', armorClass: 12, hp: 5 } as any;
            return null;
        });

        await performAttack('char-1', 'target-1', 0, 1); // Natural 1

        const createCall = vi.mocked(prisma.logEntry.create).mock.calls[0][0];
        const content = createCall.data.content;

        expect(content).toContain('**Grom** attacks **Goblin**');
        expect(content).toContain('**CRITICAL MISS**!');
        expect(content).toContain('A clumsy fumble!');
    });

    it('should log a normal miss with flavor', async () => {
        vi.mocked(prisma.character.findUnique).mockImplementation(async (args) => {
            if (args.where.id === 'char-1') return { id: 'char-1', name: 'Grom', campaignId: 'camp-1', armorClass: 15, hp: 20 } as any;
            if (args.where.id === 'target-1') return { id: 'target-1', name: 'Goblin', campaignId: 'camp-1', armorClass: 20, hp: 5 } as any; // AC 20
            return null;
        });

        await performAttack('char-1', 'target-1', 0, 10); // Roll 10 vs AC 20 = Miss

        const createCall = vi.mocked(prisma.logEntry.create).mock.calls[0][0];
        const content = createCall.data.content;

        expect(content).toContain('**Grom** attacks **Goblin**');
        expect(content).toContain('**MISSES**!');
        expect(content).toContain('The attack goes wide.');
    });
  });

  describe('updateHP', () => {
      it('should log healing with "rallies"', async () => {
          vi.mocked(prisma.character.update).mockResolvedValue({
              id: 'char-1', name: 'Grom', campaignId: 'camp-1', hp: 15
          } as any);

          await updateHP('char-1', 5);

          const createCall = vi.mocked(prisma.logEntry.create).mock.calls[0][0];
          const content = createCall.data.content;

          expect(content).toContain('**Grom** rallies!');
          expect(content).toContain('Recovers **5** HP');
      });

      it('should log unconsciousness dramatically', async () => {
        vi.mocked(prisma.character.update).mockResolvedValue({
            id: 'char-1', name: 'Grom', campaignId: 'camp-1', hp: 0
        } as any);

        await updateHP('char-1', -10);

        const createCall = vi.mocked(prisma.logEntry.create).mock.calls[0][0];
        const content = createCall.data.content;

        expect(content).toContain('**Grom** suffers **10** damage');
        expect(content).toContain('falls **UNCONSCIOUS**!');
    });
  });

  describe('performSkillCheck', () => {
      it('should log skill checks clearly', async () => {
        vi.mocked(prisma.character.findUnique).mockResolvedValue({
            id: 'char-1', name: 'Lyra', campaignId: 'camp-1'
        } as any);

        await performSkillCheck('char-1', 'Stealth', 15, 18, 14, 4);

        const createCall = vi.mocked(prisma.logEntry.create).mock.calls[0][0];
        const content = createCall.data.content;

        expect(content).toContain('**Lyra** checks **Stealth**');
        expect(content).toContain(': **SUCCESS**!');
        expect(content).toContain('The attempt succeeds.');
        expect(content).toContain('Roll: **14**+**4** = **18**');
      });

      it('should log critical success for skill check', async () => {
          vi.mocked(prisma.character.findUnique).mockResolvedValue({
              id: 'char-1', name: 'Lyra', campaignId: 'camp-1'
          } as any);

          // roll 24 (20 + 4), dieRoll 20
          await performSkillCheck('char-1', 'Stealth', 20, 24, 20, 4);

          const createCall = vi.mocked(prisma.logEntry.create).mock.calls[0][0];
          const content = createCall.data.content;

          expect(content).toContain('**Lyra** checks **Stealth**');
          expect(content).toContain('**CRITICAL SUCCESS**!');
          expect(content).toContain('A stroke of brilliance!');
      });

      it('should log critical failure for skill check', async () => {
        vi.mocked(prisma.character.findUnique).mockResolvedValue({
            id: 'char-1', name: 'Lyra', campaignId: 'camp-1'
        } as any);

        // roll 5 (1 + 4), dieRoll 1
        await performSkillCheck('char-1', 'Stealth', 10, 5, 1, 4);

        const createCall = vi.mocked(prisma.logEntry.create).mock.calls[0][0];
        const content = createCall.data.content;

        expect(content).toContain('**Lyra** checks **Stealth**');
        expect(content).toContain('**CRITICAL FAILURE**!');
        expect(content).toContain('A disastrous fumble');
    });
  });

  describe('updateCharacter', () => {
    it('should log level up', async () => {
        vi.mocked(prisma.character.findUnique).mockResolvedValue({
            id: 'char-1', name: 'Grom', level: 1, campaignId: 'camp-1', attributes: '{}'
        } as any);
        vi.mocked(prisma.character.update).mockResolvedValue({
            id: 'char-1', name: 'Grom', level: 2, campaignId: 'camp-1'
        } as any);

        const formData = new FormData();
        formData.append('name', 'Grom');
        formData.append('level', '2');

        await updateCharacter('char-1', formData);

        const createCall = vi.mocked(prisma.logEntry.create).mock.calls[0][0];
        const content = createCall.data.content;
        expect(content).toContain('**Grom** ascends! Reaches Level **2**');
    });

    it('should log name change', async () => {
        vi.mocked(prisma.character.findUnique).mockResolvedValue({
            id: 'char-1', name: 'Grom', level: 1, campaignId: 'camp-1', attributes: '{}'
        } as any);
        vi.mocked(prisma.character.update).mockResolvedValue({
            id: 'char-1', name: 'Grom the Great', level: 1, campaignId: 'camp-1'
        } as any);

        const formData = new FormData();
        formData.append('name', 'Grom the Great');
        formData.append('level', '1');

        await updateCharacter('char-1', formData);

        const createCall = vi.mocked(prisma.logEntry.create).mock.calls[0][0];
        const content = createCall.data.content;
        expect(content).toContain('**Grom** is now known as **Grom the Great**');
    });

    it('should log class/race change', async () => {
        vi.mocked(prisma.character.findUnique).mockResolvedValue({
            id: 'char-1', name: 'Grom', race: 'Human', class: 'Fighter', campaignId: 'camp-1', attributes: '{}'
        } as any);
        vi.mocked(prisma.character.update).mockResolvedValue({
            id: 'char-1', name: 'Grom', race: 'Elf', class: 'Paladin', campaignId: 'camp-1'
        } as any);

        const formData = new FormData();
        formData.append('name', 'Grom');
        formData.append('race', 'Elf');
        formData.append('class', 'Paladin');

        await updateCharacter('char-1', formData);

        const createCall = vi.mocked(prisma.logEntry.create).mock.calls[0][0];
        const content = createCall.data.content;
        expect(content).toContain('**Grom** is reborn as a **Elf** **Paladin**');
    });

    it('should log generic update', async () => {
        vi.mocked(prisma.character.findUnique).mockResolvedValue({
            id: 'char-1', name: 'Grom', race: 'Human', class: 'Fighter', campaignId: 'camp-1', attributes: '{}'
        } as any);
        vi.mocked(prisma.character.update).mockResolvedValue({
            id: 'char-1', name: 'Grom', race: 'Human', class: 'Fighter', campaignId: 'camp-1'
        } as any);

        const formData = new FormData();
        formData.append('name', 'Grom');
        formData.append('race', 'Human');
        formData.append('class', 'Fighter');

        await updateCharacter('char-1', formData);

        const createCall = vi.mocked(prisma.logEntry.create).mock.calls[0][0];
        const content = createCall.data.content;
        expect(content).toContain('**Grom** undergoes a transformation');
    });
  });

  describe('updateInitiative', () => {
      it('should log initiative with "prepares for battle"', async () => {
        vi.mocked(prisma.character.update).mockResolvedValue({
            id: 'char-1', name: 'Grom', campaignId: 'camp-1'
        } as any);

        await updateInitiative('char-1', 15);

        const createCall = vi.mocked(prisma.logEntry.create).mock.calls[0][0];
        const content = createCall.data.content;

        expect(content).toContain('**Grom** prepares for battle!');
        expect(content).toContain('Initiative: **15**');
      });
  });

  describe('Inventory', () => {
      it('should log adding item with "obtains"', async () => {
          vi.mocked(prisma.character.findUnique).mockResolvedValue({
              id: 'char-1', name: 'Grom', campaignId: 'camp-1', inventory: '[]'
          } as any);
          vi.mocked(prisma.character.update).mockResolvedValue({
              id: 'char-1', name: 'Grom', campaignId: 'camp-1', inventory: '["Sword"]'
          } as any);

          await addInventoryItem('char-1', 'Sword');

          const createCall = vi.mocked(prisma.logEntry.create).mock.calls[0][0];
          const content = createCall.data.content;

          expect(content).toContain('**Grom** obtains **Sword**');
      });

      it('should log removing item with "discards"', async () => {
        vi.mocked(prisma.character.findUnique).mockResolvedValue({
            id: 'char-1', name: 'Grom', campaignId: 'camp-1', inventory: '["Sword"]'
        } as any);
        vi.mocked(prisma.character.update).mockResolvedValue({
            id: 'char-1', name: 'Grom', campaignId: 'camp-1', inventory: '[]'
        } as any);

        await removeInventoryItem('char-1', 'Sword');

        const createCall = vi.mocked(prisma.logEntry.create).mock.calls[0][0];
        const content = createCall.data.content;

        expect(content).toContain('**Grom** discards **Sword**');
    });
  });
});
