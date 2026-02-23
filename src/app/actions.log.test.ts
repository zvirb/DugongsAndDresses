import { describe, it, expect, vi, beforeEach } from 'vitest';
import { performAttack, performSkillCheck, castSpell, updateHP, updateCharacter, updateInitiative, addInventoryItem, removeInventoryItem, toggleCondition, updateConditions, saveEncounter, deleteEncounter } from '@/app/actions';
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
    encounter: {
        create: vi.fn(),
        delete: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback), // Mock transaction to just return callback result
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

        expect(content).toContain('**CRITICAL HIT**!');
        expect(content).toContain('**Grom** finds a fatal opening and strikes **Goblin** with deadly precision');
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

        expect(content).toContain('**CRITICAL MISS**!');
        expect(content).toContain('**Grom** stumbles disastrously');
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
        expect(content).toContain('but the attempt is thwarted');
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

          expect(content).toContain('**Grom** rallies');
          expect(content).toContain('surging with **5** renewed vitality');
      });

      it('should log unconsciousness dramatically', async () => {
        vi.mocked(prisma.character.update).mockResolvedValue({
            id: 'char-1', name: 'Grom', campaignId: 'camp-1', hp: 0
        } as any);

        await updateHP('char-1', -10);

        const createCall = vi.mocked(prisma.logEntry.create).mock.calls[0][0];
        const content = createCall.data.content;

        expect(content).toContain('**Grom** reels from the blow');
        expect(content).toContain('taking **10** damage');
        expect(content).toContain('collapses! Their vision fades to black. They are **UNCONSCIOUS**!');
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

        expect(content).toContain('**Lyra** attempts to **Stealth**');
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

          expect(content).toContain('**Lyra** attempts to **Stealth**');
          expect(content).toContain('**CRITICAL SUCCESS**!');
          expect(content).toContain('**Lyra** performs the feat with godlike prowess!');
      });

      it('should log critical failure for skill check', async () => {
        vi.mocked(prisma.character.findUnique).mockResolvedValue({
            id: 'char-1', name: 'Lyra', campaignId: 'camp-1'
        } as any);

        // roll 5 (1 + 4), dieRoll 1
        await performSkillCheck('char-1', 'Stealth', 10, 5, 1, 4);

        const createCall = vi.mocked(prisma.logEntry.create).mock.calls[0][0];
        const content = createCall.data.content;

        expect(content).toContain('**Lyra** attempts to **Stealth**');
        expect(content).toContain('**CRITICAL FAILURE**!');
        expect(content).toContain('**Lyra** falters disastrously!');
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
      it('should log initiative with "draws steel"', async () => {
        vi.mocked(prisma.character.update).mockResolvedValue({
            id: 'char-1', name: 'Grom', campaignId: 'camp-1'
        } as any);

        await updateInitiative('char-1', 15);

        const createCall = vi.mocked(prisma.logEntry.create).mock.calls[0][0];
        const content = createCall.data.content;

        expect(content).toContain('**Grom** enters the fray with a roll of **15**!');
      });
  });

  describe('Inventory', () => {
      it('should log adding item with "finds"', async () => {
          vi.mocked(prisma.character.findUnique).mockResolvedValue({
              id: 'char-1', name: 'Grom', campaignId: 'camp-1', inventory: '[]'
          } as any);
          vi.mocked(prisma.character.update).mockResolvedValue({
              id: 'char-1', name: 'Grom', campaignId: 'camp-1', inventory: '["Sword"]'
          } as any);

          await addInventoryItem('char-1', 'Sword');

          const createCall = vi.mocked(prisma.logEntry.create).mock.calls[0][0];
          const content = createCall.data.content;

          expect(content).toContain('**Grom** secures **Sword**');
      });

      it('should log removing item with "drops"', async () => {
        vi.mocked(prisma.character.findUnique).mockResolvedValue({
            id: 'char-1', name: 'Grom', campaignId: 'camp-1', inventory: '["Sword"]'
        } as any);
        vi.mocked(prisma.character.update).mockResolvedValue({
            id: 'char-1', name: 'Grom', campaignId: 'camp-1', inventory: '[]'
        } as any);

        await removeInventoryItem('char-1', 'Sword');

        const createCall = vi.mocked(prisma.logEntry.create).mock.calls[0][0];
        const content = createCall.data.content;

        expect(content).toContain('**Grom** casts aside **Sword**');
    });
  });

  describe('toggleCondition', () => {
      it('should log adding condition', async () => {
          vi.mocked(prisma.character.findUnique).mockResolvedValue({
              id: 'char-1', name: 'Grom', campaignId: 'camp-1', conditions: '[]'
          } as any);
          vi.mocked(prisma.character.update).mockResolvedValue({
              id: 'char-1', name: 'Grom', campaignId: 'camp-1', conditions: '["Blinded"]'
          } as any);

          await toggleCondition('char-1', 'Blinded');

          const createCall = vi.mocked(prisma.logEntry.create).mock.calls[0][0];
          const content = createCall.data.content;
          expect(content).toContain('**Grom** is afflicted by **Blinded**!');
      });

      it('should log removing condition', async () => {
        vi.mocked(prisma.character.findUnique).mockResolvedValue({
            id: 'char-1', name: 'Grom', campaignId: 'camp-1', conditions: '["Blinded"]'
        } as any);
        vi.mocked(prisma.character.update).mockResolvedValue({
            id: 'char-1', name: 'Grom', campaignId: 'camp-1', conditions: '[]'
        } as any);

        await toggleCondition('char-1', 'Blinded');

        const createCall = vi.mocked(prisma.logEntry.create).mock.calls[0][0];
        const content = createCall.data.content;
        expect(content).toContain('**Grom** shakes off the effects of **Blinded**');
    });
  });

  describe('updateConditions', () => {
      it('should log clearing all conditions', async () => {
          vi.mocked(prisma.character.update).mockResolvedValue({
              id: 'char-1', name: 'Grom', campaignId: 'camp-1', conditions: '[]'
          } as any);

          await updateConditions('char-1', []);

          const createCall = vi.mocked(prisma.logEntry.create).mock.calls[0][0];
          const content = createCall.data.content;
          expect(content).toContain('**Grom** is purged of all ailments');
      });

      it('should log setting multiple conditions', async () => {
        vi.mocked(prisma.character.update).mockResolvedValue({
            id: 'char-1', name: 'Grom', campaignId: 'camp-1', conditions: '["Blinded", "Stunned"]'
        } as any);

        await updateConditions('char-1', ['Blinded', 'Stunned']);

        const createCall = vi.mocked(prisma.logEntry.create).mock.calls[0][0];
        const content = createCall.data.content;
        expect(content).toContain('**Grom** falls under the influence of: **Blinded, Stunned**');
      });
  });

  describe('saveEncounter', () => {
      it('should log saving a new encounter', async () => {
          vi.mocked(prisma.encounter.create).mockResolvedValue({
              id: 'enc-1', campaignId: 'camp-1', name: 'Encounter 1'
          } as any);

          await saveEncounter('camp-1', []);

          const createCall = vi.mocked(prisma.logEntry.create).mock.calls[0][0];
          const content = createCall.data.content;
          expect(content).toContain('The DM weaves a new threat: **Encounter 1**');
      });
  });

  describe('deleteEncounter', () => {
      it('should log deleting an encounter', async () => {
          vi.mocked(prisma.encounter.delete).mockResolvedValue({
              id: 'enc-1', campaignId: 'camp-1', name: 'Encounter 1'
          } as any);

          await deleteEncounter('enc-1');

          const createCall = vi.mocked(prisma.logEntry.create).mock.calls[0][0];
          const content = createCall.data.content;
          expect(content).toContain('The DM erases the encounter **Encounter 1** from existence');
      });
  });
});
