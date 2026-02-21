import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createCampaign, updateHP, updateInitiative, activateCampaign, updateCharacterImage, createCharacter, deleteCharacter, addInventoryItem, removeInventoryItem, advanceTurn, performAttack, performSkillCheck, castSpell, listEncounters, loadEncounter, endEncounter, importCharacterFromLibrary, performDodge, performDash, performLongRest } from '@/app/actions';
import { prisma } from '@/lib/prisma';

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    campaign: {
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    character: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      updateMany: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    logEntry: {
      create: vi.fn(),
    },
    encounter: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
    },
    settings: {
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
    },
    $transaction: vi.fn((actions) => Promise.resolve(actions)),
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
  createBackup: vi.fn(),
  restoreBackup: vi.fn(),
  listBackups: vi.fn(),
  checkAutoBackup: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/ai', () => ({
  generateStory: vi.fn().mockResolvedValue(undefined),
}));

describe('Server Actions Logging', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('createCampaign logs correctly', async () => {
    const formData = new FormData();
    formData.append('name', 'Test Campaign');

    vi.mocked(prisma.campaign.create).mockResolvedValue({
      id: 'camp-123',
      name: 'Test Campaign',
      active: true,
    } as any);

    vi.mocked(prisma.logEntry.create).mockResolvedValue({} as any);

    await createCampaign(formData);

    expect(prisma.logEntry.create).toHaveBeenCalledWith({
      data: {
        campaignId: 'camp-123',
        content: expect.stringContaining('The mists part, revealing the world of **Test Campaign**. A new saga is etched into the annals of history.'),
        type: 'Story',
      },
    });
  });

  it('performAttack logs targetless attack correctly', async () => {
    vi.mocked(prisma.character.findUnique)
      .mockResolvedValueOnce({ id: 'char-1', name: 'Attacker', campaignId: 'camp-1' } as any);

    await performAttack('char-1', undefined, undefined, 18);

    expect(prisma.logEntry.create).toHaveBeenCalledWith({
      data: {
        campaignId: 'camp-1',
        content: expect.stringContaining('**Attacker** attacks... (Roll: **18**)'),
        type: 'Combat',
      },
    });
  });

  it('updateHP logs recovery correctly', async () => {
    vi.mocked(prisma.character.update).mockResolvedValue({
      id: 'char-1',
      name: 'Grom',
      campaignId: 'camp-1',
      hp: 15,
    } as any);

    await updateHP('char-1', 5);

    expect(prisma.logEntry.create).toHaveBeenCalledWith({
      data: {
        campaignId: 'camp-1',
        content: expect.stringContaining('**Grom** rallies, surging with **5** renewed vitality!'),
        type: 'Combat',
      },
    });
  });

  it('updateHP logs damage correctly', async () => {
    vi.mocked(prisma.character.update).mockResolvedValue({
      id: 'char-1',
      name: 'Grom',
      campaignId: 'camp-1',
      hp: 5,
    } as any);

    await updateHP('char-1', -5);

    expect(prisma.logEntry.create).toHaveBeenCalledWith({
      data: {
        campaignId: 'camp-1',
        content: expect.stringContaining('**Grom** reels from the blow, taking **5** damage'),
        type: 'Combat',
      },
    });
  });

  it('updateInitiative logs correctly', async () => {
    vi.mocked(prisma.character.update).mockResolvedValue({
      id: 'char-1',
      name: 'Grom',
      campaignId: 'camp-1',
    } as any);

    await updateInitiative('char-1', 15);

    expect(prisma.logEntry.create).toHaveBeenCalledWith({
      data: {
        campaignId: 'camp-1',
        content: expect.stringContaining('**Grom** prepares for battle! Initiative: **15**.'),
        type: 'Combat',
      },
    });
  });

  it('activateCampaign logs correctly', async () => {
    vi.mocked(prisma.campaign.update).mockResolvedValue({
      id: 'camp-1',
      name: 'Test Campaign',
    } as any);

    await activateCampaign('camp-1');

    expect(prisma.logEntry.create).toHaveBeenCalledWith({
      data: {
        campaignId: 'camp-1',
        content: expect.stringContaining('The tome is opened once more. The saga of **Test Campaign** continues.'),
        type: 'Story',
      },
    });
  });

  it('updateCharacterImage logs correctly', async () => {
    vi.mocked(prisma.character.update).mockResolvedValue({
      id: 'char-1',
      name: 'Grom',
      campaignId: 'camp-1',
    } as any);

    await updateCharacterImage('char-1', 'new-url');

    expect(prisma.logEntry.create).toHaveBeenCalledWith({
      data: {
        campaignId: 'camp-1',
        content: expect.stringContaining('**Grom** reveals a new appearance.'),
        type: 'Story',
      },
    });
  });

  it('createCharacter logs correctly', async () => {
    const formData = new FormData();
    formData.append('campaignId', 'camp-1');
    formData.append('name', 'NewChar');

    vi.mocked(prisma.character.create).mockResolvedValue({
      id: 'char-new',
      name: 'NewChar',
      campaignId: 'camp-1',
    } as any);

    await createCharacter(formData);

    expect(prisma.logEntry.create).toHaveBeenCalledWith({
      data: {
        campaignId: 'camp-1',
        content: expect.stringContaining('A new legend begins. **NewChar** steps forth into the unknown!'),
        type: 'Story',
      },
    });
  });

  it('deleteCharacter logs correctly', async () => {
    vi.mocked(prisma.character.delete).mockResolvedValue({
      id: 'char-1',
      name: 'Grom',
      campaignId: 'camp-1',
    } as any);

    await deleteCharacter('char-1');

    expect(prisma.logEntry.create).toHaveBeenCalledWith({
      data: {
        campaignId: 'camp-1',
        content: expect.stringContaining('The pages fade. **Grom** is lost to the mists of time.'),
        type: 'Story',
      },
    });
  });

  it('addInventoryItem logs correctly', async () => {
    vi.mocked(prisma.character.findUnique).mockResolvedValue({
      id: 'char-1',
      name: 'Grom',
      campaignId: 'camp-1',
      inventory: '[]',
    } as any);

    vi.mocked(prisma.character.update).mockResolvedValue({
      id: 'char-1',
      name: 'Grom',
      campaignId: 'camp-1',
    } as any);

    await addInventoryItem('char-1', 'Sword');

    expect(prisma.logEntry.create).toHaveBeenCalledWith({
      data: {
        campaignId: 'camp-1',
        content: expect.stringContaining('**Grom** secures **Sword**, stowing it away for the trials ahead.'),
        type: 'Story',
      },
    });
  });

  it('removeInventoryItem logs correctly', async () => {
    vi.mocked(prisma.character.findUnique).mockResolvedValue({
      id: 'char-1',
      name: 'Grom',
      campaignId: 'camp-1',
      inventory: '["Sword"]',
    } as any);

    vi.mocked(prisma.character.update).mockResolvedValue({
      id: 'char-1',
      name: 'Grom',
      campaignId: 'camp-1',
    } as any);

    await removeInventoryItem('char-1', 'Sword');

    expect(prisma.logEntry.create).toHaveBeenCalledWith({
      data: {
        campaignId: 'camp-1',
        content: expect.stringContaining('**Grom** casts aside **Sword**, no longer burdened by its weight.'),
        type: 'Story',
      },
    });
  });

  // --- Re-integrated logic tests for advanceTurn ---

  describe('advanceTurn', () => {
    const campaignId = 'test-campaign';

    it('advances turn to the next character', async () => {
        // Setup characters: A (active), B, C
        const characters = [
          { id: '1', name: 'Char1', activeTurn: true, initiativeRoll: 20 },
          { id: '2', name: 'Char2', activeTurn: false, initiativeRoll: 15 },
          { id: '3', name: 'Char3', activeTurn: false, initiativeRoll: 10 },
        ];

        vi.mocked(prisma.character.findMany).mockResolvedValue(characters as any);
        // Mock updateMany result
        const updateManyResult = { count: 1 };
        // Mock update result (the new active character)
        const updateResult = { id: '2', name: 'Char2', activeTurn: true };

        vi.mocked(prisma.character.updateMany).mockResolvedValue(updateManyResult as any);
        vi.mocked(prisma.character.update).mockResolvedValue(updateResult as any);

        // Mock transaction to return [updateManyResult, updateResult]
        vi.mocked(prisma.$transaction).mockResolvedValue([updateManyResult, updateResult] as any);

        // Act
        const result = await advanceTurn(campaignId, '1');

        // Assert logic
        expect(prisma.character.updateMany).toHaveBeenCalledWith({
          where: { campaignId, activeTurn: true },
          data: { activeTurn: false }
        });
        expect(prisma.character.update).toHaveBeenCalledWith({
          where: { id: '2' },
          data: { activeTurn: true }
        });
        expect(result).toEqual({ success: true, data: updateResult });

        // Assert Logging
        expect(prisma.logEntry.create).toHaveBeenCalledWith({
            data: {
                campaignId,
                content: expect.stringContaining("The chaos of battle shifts. It is now **Char2**'s turn to shape fate."),
                type: 'Combat',
            }
        });
    });

    it('loops back to the first character', async () => {
        // Setup characters: A, B, C (active)
        const characters = [
          { id: '1', name: 'Char1', activeTurn: false, initiativeRoll: 20 },
          { id: '2', name: 'Char2', activeTurn: false, initiativeRoll: 15 },
          { id: '3', name: 'Char3', activeTurn: true, initiativeRoll: 10 },
        ];

        vi.mocked(prisma.character.findMany).mockResolvedValue(characters as any);
        const updateResult = { id: '1', name: 'Char1', activeTurn: true };
        vi.mocked(prisma.$transaction).mockResolvedValue([{ count: 1 }, updateResult] as any);

        // Act
        await advanceTurn(campaignId, '3');

        // Assert logic
        expect(prisma.character.update).toHaveBeenCalledWith({
          where: { id: '1' },
          data: { activeTurn: true }
        });

        // Assert Logging
        expect(prisma.logEntry.create).toHaveBeenCalledWith({
            data: {
                campaignId,
                content: expect.stringContaining("The chaos of battle shifts. It is now **Char1**'s turn to shape fate."),
                type: 'Combat',
            }
        });
    });

    it('handles race condition: returns current active if expected mismatch', async () => {
        // Setup characters: A (active in DB), B, C
        // Client thinks C is active (stale), calls with expectedActiveId='3'
        const characters = [
          { id: '1', name: 'Char1', activeTurn: true, initiativeRoll: 20 },
          { id: '2', name: 'Char2', activeTurn: false, initiativeRoll: 15 },
          { id: '3', name: 'Char3', activeTurn: false, initiativeRoll: 10 },
        ];

        vi.mocked(prisma.character.findMany).mockResolvedValue(characters as any);
        vi.mocked(prisma.character.findUnique).mockResolvedValue({ id: '1', name: 'Char1', activeTurn: true } as any);

        // Act
        const result = await advanceTurn(campaignId, '3');

        // Assert logic
        // Should verify we did NOT update anything
        expect(prisma.character.updateMany).not.toHaveBeenCalled();
        expect(prisma.character.update).not.toHaveBeenCalled(); // The update inside transaction is skipped
        // But findUnique is called to return actual active
        expect(prisma.character.findUnique).toHaveBeenCalledWith({ where: { id: '1' } });

        // Should return the ACTUAL active character (A)
        expect(result).toEqual({ success: true, data: { id: '1', name: 'Char1', activeTurn: true } });

        // Assert Logging: Should NOT log change because turn didn't change
        expect(prisma.logEntry.create).not.toHaveBeenCalled();
    });

    it('advances if expectedActiveId matches', async () => {
        // Setup characters: A (active), B
        const characters = [
            { id: '1', name: 'Char1', activeTurn: true, initiativeRoll: 20 },
            { id: '2', name: 'Char2', activeTurn: false, initiativeRoll: 15 },
        ];
        vi.mocked(prisma.character.findMany).mockResolvedValue(characters as any);
        const updateResult = { id: '2', name: 'Char2', activeTurn: true };
        vi.mocked(prisma.$transaction).mockResolvedValue([{ count: 1 }, updateResult] as any);

        await advanceTurn(campaignId, '1');

        expect(prisma.character.update).toHaveBeenCalled();
        expect(prisma.logEntry.create).toHaveBeenCalled();
    });

    it('returns current active if expectedActiveId is undefined but someone is active', async () => {
          // Setup: A (active)
          const characters = [
              { id: '1', name: 'Char1', activeTurn: true, initiativeRoll: 20 },
              { id: '2', name: 'Char2', activeTurn: false, initiativeRoll: 15 },
          ];
          vi.mocked(prisma.character.findMany).mockResolvedValue(characters as any);
          vi.mocked(prisma.character.findUnique).mockResolvedValue({ id: '1', name: 'Char1', activeTurn: true } as any);

          const result = await advanceTurn(campaignId, undefined);

          // Should NOT advance
          expect(prisma.character.update).not.toHaveBeenCalled();
          expect(prisma.logEntry.create).not.toHaveBeenCalled();

          // Should return current active
          expect(result).toEqual({ success: true, data: { id: '1', name: 'Char1', activeTurn: true } });
    });
  });

  // --- New Actions Tests ---

  it('performAttack logs and updates HP correctly (Normal Hit)', async () => {
    vi.mocked(prisma.character.findUnique)
      .mockResolvedValueOnce({ id: 'char-1', name: 'Attacker', campaignId: 'camp-1' } as any)
      .mockResolvedValueOnce({ id: 'char-2', name: 'Target', hp: 20 } as any);

    vi.mocked(prisma.character.update).mockResolvedValue({ id: 'char-2', name: 'Target', hp: 15 } as any);

    await performAttack('char-1', 'char-2', 5, 18);

    expect(prisma.character.update).toHaveBeenCalledWith({
      where: { id: 'char-2' },
      data: { hp: { decrement: 5 } }
    });

    expect(prisma.logEntry.create).toHaveBeenCalledWith({
      data: {
        campaignId: 'camp-1',
        content: expect.stringContaining('**Attacker** lands a solid blow on **Target**! (Roll: **18**), cutting deep for **5** damage'),
        type: 'Combat',
      },
    });
  });

  it('performAttack logs Critical Hit correctly', async () => {
    vi.mocked(prisma.character.findUnique)
      .mockResolvedValueOnce({ id: 'char-1', name: 'Attacker', campaignId: 'camp-1' } as any)
      .mockResolvedValueOnce({ id: 'char-2', name: 'Target', hp: 20 } as any);

    vi.mocked(prisma.character.update).mockResolvedValue({ id: 'char-2', name: 'Target', hp: 10 } as any);

    await performAttack('char-1', 'char-2', 10, 20); // Roll 20

    expect(prisma.logEntry.create).toHaveBeenCalledWith({
      data: {
        campaignId: 'camp-1',
        content: expect.stringContaining('**CRITICAL HIT**! **Attacker** finds a fatal opening and strikes **Target** with deadly precision! (Roll: **20**)'),
        type: 'Combat',
      },
    });
  });

  it('performAttack logs Critical Miss correctly', async () => {
    vi.mocked(prisma.character.findUnique)
      .mockResolvedValueOnce({ id: 'char-1', name: 'Attacker', campaignId: 'camp-1' } as any)
      .mockResolvedValueOnce({ id: 'char-2', name: 'Target', hp: 20 } as any);

    await performAttack('char-1', 'char-2', 5, 1); // Roll 1

    expect(prisma.logEntry.create).toHaveBeenCalledWith({
      data: {
        campaignId: 'camp-1',
        content: expect.stringContaining('**CRITICAL MISS**! **Attacker** stumbles disastrously, their attack going wide! (Roll: **1**)'),
        type: 'Combat',
      },
    });
  });

  it('performSkillCheck logs success correctly', async () => {
    vi.mocked(prisma.character.findUnique).mockResolvedValue({
      id: 'char-1',
      name: 'Hero',
      campaignId: 'camp-1',
    } as any);

    await performSkillCheck('char-1', 'Athletics', 15, 18);

    expect(prisma.logEntry.create).toHaveBeenCalledWith({
      data: {
        campaignId: 'camp-1',
        content: expect.stringContaining('**Hero** attempts to **Athletics**: **SUCCESS**! They pull it off. (Roll: **18** vs DC **15**).'),
        type: 'Roll',
      },
    });
  });

  it('castSpell logs and applies condition correctly', async () => {
    vi.mocked(prisma.character.findUnique)
      .mockResolvedValueOnce({ id: 'char-1', name: 'Wizard', campaignId: 'camp-1' } as any)
      .mockResolvedValueOnce({ id: 'char-2', name: 'Goblin', conditions: '[]' } as any);

    vi.mocked(prisma.character.update).mockResolvedValue({} as any);

    await castSpell('char-1', 'char-2', 'Fireball', 'Burning');

    // Check that condition update was called with correct stringified JSON
    // We can't easily check stringified JSON order, but we can check if it contains "Burning"
    expect(prisma.character.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'char-2' },
      data: { conditions: expect.stringContaining('Burning') }
    }));

    expect(prisma.logEntry.create).toHaveBeenCalledWith({
      data: {
        campaignId: 'camp-1',
        content: expect.stringContaining('**Wizard** channels the raw power of the weave, casting **Fireball**, targeting **Goblin**. Reality bends as **Burning** takes hold!'),
        type: 'Combat',
      },
    });
  });
});

describe('New Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('listEncounters returns encounters', async () => {
    const encounters = [{ id: 'enc-1', name: 'Test Encounter' }];
    vi.mocked(prisma.encounter.findMany).mockResolvedValue(encounters as any);

    const result = await listEncounters('camp-1');

    expect(prisma.encounter.findMany).toHaveBeenCalledWith({
      where: { campaignId: 'camp-1' },
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, createdAt: true }
    });
    expect(result).toEqual({ success: true, data: encounters });
  });

  it('endEncounter resets initiative and active turn', async () => {
    vi.mocked(prisma.character.updateMany).mockResolvedValue({ count: 5 });

    await endEncounter('camp-1');

    expect(prisma.character.updateMany).toHaveBeenCalledWith({
      where: { campaignId: 'camp-1' },
      data: { initiativeRoll: 0, activeTurn: false }
    });

    expect(prisma.logEntry.create).toHaveBeenCalledWith({
      data: {
        campaignId: 'camp-1',
        content: 'Silence falls as combat ends. The dust settles on the battlefield.',
        type: 'Story',
      },
    });
  });

  it('loadEncounter updates characters from participants', async () => {
    const participants = [
        { characterId: 'char-1', initiative: 20 },
        { characterId: 'char-2', initiative: 15 }
    ];
    const encounter = {
        id: 'enc-1',
        campaignId: 'camp-1',
        name: 'Saved Battle',
        participants: JSON.stringify(participants)
    };

    vi.mocked(prisma.encounter.findUnique).mockResolvedValue(encounter as any);
    vi.mocked(prisma.character.updateMany).mockResolvedValue({ count: 2 });
    vi.mocked(prisma.character.update).mockResolvedValue({} as any);

    await loadEncounter('enc-1');

    // Should reset active turns first
    expect(prisma.character.updateMany).toHaveBeenCalledWith({
        where: { campaignId: 'camp-1' },
        data: { activeTurn: false }
    });

    // Should update initiative for each participant
    expect(prisma.character.update).toHaveBeenCalledWith({
        where: { id: 'char-1' },
        data: { initiativeRoll: 20 }
    });
    expect(prisma.character.update).toHaveBeenCalledWith({
        where: { id: 'char-2' },
        data: { initiativeRoll: 15 }
    });

    expect(prisma.logEntry.create).toHaveBeenCalledWith({
        data: {
            campaignId: 'camp-1',
            content: expect.stringContaining('Tension fills the air. The encounter **Saved Battle** has begun!'),
            type: 'Combat',
        }
    });
  });

  it('importCharacterFromLibrary clones character', async () => {
    const source = {
        id: 'lib-1',
        name: 'Hero Template',
        type: 'PLAYER',
        hp: 20,
        maxHp: 20,
        attributes: '{}',
        inventory: '[]',
        // ... other fields
    };

    vi.mocked(prisma.character.findUnique).mockResolvedValue(source as any);
    vi.mocked(prisma.character.create).mockResolvedValue({
        id: 'new-char-1',
        name: 'Hero Template',
        campaignId: 'camp-1',
        // ...
    } as any);

    await importCharacterFromLibrary('camp-1', 'lib-1');

    expect(prisma.character.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
            campaignId: 'camp-1',
            name: 'Hero Template',
            sourceId: 'lib-1',
            initiativeRoll: 0,
            conditions: '[]',
        })
    }));

    expect(prisma.logEntry.create).toHaveBeenCalledWith({
        data: {
            campaignId: 'camp-1',
            content: expect.stringContaining('**Hero Template** is summoned from the archives to join the adventure.'),
            type: 'Story',
        }
    });
  });

  it('performDodge logs and applies condition', async () => {
    vi.mocked(prisma.character.findUnique).mockResolvedValue({
      id: 'char-1',
      name: 'Rogue',
      campaignId: 'camp-1',
      conditions: '[]',
    } as any);

    vi.mocked(prisma.character.update).mockResolvedValue({} as any);

    await performDodge('char-1');

    expect(prisma.character.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'char-1' },
      data: { conditions: expect.stringContaining('Dodging') }
    }));

    expect(prisma.logEntry.create).toHaveBeenCalledWith({
      data: {
        campaignId: 'camp-1',
        content: expect.stringContaining('**Rogue** shifts their weight, eyes darting, prepared to evade the coming storm.'),
        type: 'PlayerAction',
      },
    });
  });

  it('performDash logs and applies condition', async () => {
    vi.mocked(prisma.character.findUnique).mockResolvedValue({
      id: 'char-1',
      name: 'Monk',
      campaignId: 'camp-1',
      conditions: '[]',
    } as any);

    vi.mocked(prisma.character.update).mockResolvedValue({} as any);

    await performDash('char-1');

    expect(prisma.character.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'char-1' },
      data: { conditions: expect.stringContaining('Dashing') }
    }));

    expect(prisma.logEntry.create).toHaveBeenCalledWith({
      data: {
        campaignId: 'camp-1',
        content: expect.stringContaining('**Monk** sprints with desperate urgency, covering ground with unnatural speed!'),
        type: 'PlayerAction',
      },
    });
  });

  it('performLongRest restores HP and clears conditions', async () => {
    vi.mocked(prisma.character.findUnique).mockResolvedValue({
      id: 'char-1',
      name: 'TiredHero',
      campaignId: 'camp-1',
      maxHp: 20,
    } as any);

    vi.mocked(prisma.character.update).mockResolvedValue({
        id: 'char-1',
        name: 'TiredHero',
        hp: 20,
        conditions: "[]"
    } as any);

    await performLongRest('char-1');

    expect(prisma.character.update).toHaveBeenCalledWith({
      where: { id: 'char-1' },
      data: {
        hp: 20,
        conditions: "[]"
      }
    });

    expect(prisma.logEntry.create).toHaveBeenCalledWith({
      data: {
        campaignId: 'camp-1',
        content: expect.stringContaining('**TiredHero** settles in for a long rest. Wounds are bound, spirits lifted, and all ailments are washed away. They are fully restored.'),
        type: 'Story',
      },
    });
  });
});
