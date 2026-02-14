import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createCampaign, updateHP, updateInitiative, activateCampaign, updateCharacterImage, createCharacter, deleteCharacter, addInventoryItem, removeInventoryItem, advanceTurn, performAttack, performSkillCheck, castSpell, listEncounters, loadEncounter, endEncounter, importCharacterFromLibrary } from '@/app/actions';
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
    $transaction: vi.fn((actions) => Promise.resolve(actions)), // Simple mock that returns the actions array (incorrect for array destructuring but sufficient if we mock the return of the function that uses it, or if we adjust implementation)
    // Wait, the implementation is: const [, newActiveChar] = await prisma.$transaction(...)
    // If $transaction returns the array of promises (or results), and we mock the results...
    // The implementation of $transaction in the mock:
    // It receives an array of Promises (from updateMany and update calls).
    // It should return the results of those promises.
    // However, here we are passing the *results* of the calls if we mock them to return promises?
    // Actually, prisma calls inside $transaction usually return Prisma Promises.
    // If we mock prisma.character.update to return a value (e.g. { id: '...' }), then the array passed to $transaction is [value1, value2].
    // So returning that array is fine.
  },
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
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
        content: expect.stringContaining('The world of **Test Campaign** awakens.'),
        type: 'Story',
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
        content: expect.stringContaining('**Grom** rallies, reclaiming **5** HP.'),
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
        content: expect.stringContaining('**Grom** takes a hit, suffering **5** damage.'),
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
        content: expect.stringContaining('The saga of **Test Campaign** resumes.'),
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
        content: expect.stringContaining('A new challenger approaches: **NewChar**!'),
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
        content: expect.stringContaining('**Grom** has fallen.'),
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
        content: expect.stringContaining('**Grom** obtains **Sword**.'),
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
        content: expect.stringContaining('**Grom** discards **Sword**.'),
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
                content: expect.stringContaining("It is now **Char2**'s turn!"),
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
                content: expect.stringContaining("It is now **Char1**'s turn!"),
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
        content: expect.stringContaining('**Attacker** attacks **Target** and **HITS**! (Roll: **18**) dealing **5** damage'),
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
        content: expect.stringContaining('**Attacker** attacks **Target**... **CRITICAL HIT**! (Roll: **20**)'),
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
        content: expect.stringContaining('**Attacker** attacks **Target**... **CRITICAL MISS**! (Roll: **1**)'),
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
        content: expect.stringContaining('**Hero** attempts **Athletics**: **SUCCESS**! (Roll: **18** vs DC **15**).'),
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
        content: expect.stringContaining('**Wizard** casts **Fireball** on **Goblin**. Condition **Burning** applied.'),
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
      orderBy: { createdAt: 'desc' }
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
        content: 'Combat ends! The dust settles.',
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
            content: expect.stringContaining('The encounter **Saved Battle** has begun!'),
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
            content: expect.stringContaining('**Hero Template** emerges from the archives.'),
            type: 'Story',
        }
    });
  });
});
