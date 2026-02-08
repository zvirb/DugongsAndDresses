import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createCampaign, updateHP, updateInitiative, activateCampaign, updateCharacterImage, createCharacter, deleteCharacter, addInventoryItem, removeInventoryItem, advanceTurn } from '@/app/actions';
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
        content: expect.stringContaining('The world of **Test Campaign** is born.'),
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
        content: expect.stringContaining('**Grom** rallies, recovering **5** HP.'),
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
        content: expect.stringContaining('**Grom** is struck, taking **5** damage.'),
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
        content: expect.stringContaining('**Grom** prepares for battle with an initiative of **15**.'),
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
        content: expect.stringContaining('**Grom** reveals a new guise.'),
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
        content: expect.stringContaining('A new challenger approaches: **NewChar** joins the party.'),
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
        content: expect.stringContaining('**Grom** has vanished from existence.'),
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
        content: expect.stringContaining('**Grom** acquires **Sword**.'),
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
                content: expect.stringContaining("It is now **Char2**'s turn."),
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
                content: expect.stringContaining("It is now **Char1**'s turn."),
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

    it('advances if expectedActiveId is undefined (force)', async () => {
          // Setup: A (active)
          const characters = [
              { id: '1', name: 'Char1', activeTurn: true, initiativeRoll: 20 },
              { id: '2', name: 'Char2', activeTurn: false, initiativeRoll: 15 },
          ];
          vi.mocked(prisma.character.findMany).mockResolvedValue(characters as any);
          const updateResult = { id: '2', name: 'Char2', activeTurn: true };
          vi.mocked(prisma.$transaction).mockResolvedValue([{ count: 1 }, updateResult] as any);

          await advanceTurn(campaignId, undefined);

          expect(prisma.character.update).toHaveBeenCalledWith({
              where: { id: '2' },
              data: { activeTurn: true }
          });
          expect(prisma.logEntry.create).toHaveBeenCalled();
    });
  });
});
