import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock react cache before importing queries
vi.mock('react', () => ({
  cache: (fn: any) => fn,
}));

// Mock next/cache
vi.mock('next/cache', () => ({
  unstable_cache: (fn: any) => fn,
}));

// Mock Prisma
import { prisma } from './prisma';
vi.mock('./prisma', () => ({
  prisma: {
    campaign: {
      findFirst: vi.fn(),
    },
    character: {
      findFirst: vi.fn(),
    }
  }
}));

import { getSpectatorCampaign } from './queries';

describe('Spectator Campaign Optimization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch players and active NPC in a single query', async () => {
    // Setup mock return
    const mockCampaign = {
      id: 'c1',
      name: 'Test Campaign',
      characters: [
        { id: 'p1', name: 'Player 1', type: 'PLAYER', activeTurn: false },
        { id: 'npc1', name: 'Boss NPC', type: 'NPC', activeTurn: true }
      ]
    };

    (prisma.campaign.findFirst as any).mockResolvedValue(mockCampaign);

    const result = await getSpectatorCampaign();

    // Verify correct calls
    expect(prisma.campaign.findFirst).toHaveBeenCalledTimes(1);
    expect(prisma.character.findFirst).not.toHaveBeenCalled(); // Should NOT call secondary query

    // Verify the select clause used the OR condition
    const calls = (prisma.campaign.findFirst as any).mock.calls;
    const args = calls[0][0];

    expect(args.select.characters.where).toEqual({
      OR: [
        { type: 'PLAYER' },
        { activeTurn: true }
      ]
    });

    // Verify result structure
    // Characters list should ONLY contain players
    expect(result?.characters).toHaveLength(1);
    expect(result?.characters[0].name).toBe('Player 1');
    expect(result?.characters[0].type).toBe('PLAYER');

    // Active Contestant should be the NPC
    expect(result?.activeContestant).toEqual({
      name: 'Boss NPC',
      type: 'NPC'
    });
  });

  it('should handle no active contestant gracefully', async () => {
    const mockCampaign = {
      id: 'c1',
      name: 'Test Campaign',
      characters: [
        { id: 'p1', name: 'Player 1', type: 'PLAYER', activeTurn: false }
      ]
    };

    (prisma.campaign.findFirst as any).mockResolvedValue(mockCampaign);

    const result = await getSpectatorCampaign();

    expect(prisma.campaign.findFirst).toHaveBeenCalledTimes(1);
    expect(prisma.character.findFirst).not.toHaveBeenCalled();

    expect(result?.characters).toHaveLength(1);
    expect(result?.activeContestant).toBeNull();
  });
});
