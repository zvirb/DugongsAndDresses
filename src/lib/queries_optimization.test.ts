import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock react cache before importing queries
vi.mock('react', () => ({
  cache: (fn: any) => fn,
}));

// Mock next/cache
vi.mock('next/cache', () => ({
  unstable_cache: (fn: any) => fn,
}));

import { getSpectatorCampaign } from './queries';
import { prisma } from './prisma';

vi.mock('./prisma', () => ({
  prisma: {
    campaign: {
      findFirst: vi.fn(),
    },
    character: {
        findMany: vi.fn(),
        findFirst: vi.fn()
    }
  }
}));

describe('Oracle Optimization', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('getSpectatorCampaign should fetch minimal data', async () => {
        // Mock campaign (Step 1)
        (prisma.campaign.findFirst as any).mockResolvedValue({ id: 'c1', name: 'Test Campaign' });

        // Mock players (Step 2 - Parallel)
        (prisma.character.findMany as any).mockResolvedValue([
            { id: 'p1', name: 'Player 1', type: 'PLAYER', activeTurn: false }
        ]);

        // Mock active char (Step 2 - Parallel)
        (prisma.character.findFirst as any).mockResolvedValue(
            { name: 'NPC 1', type: 'NPC' }
        );

        const result = await getSpectatorCampaign();

        // 1. Verify Campaign Fetch
        expect(prisma.campaign.findFirst).toHaveBeenCalledTimes(1);
        const campaignCall = (prisma.campaign.findFirst as any).mock.calls[0][0];

        // Should strictly select ID and Name only
        expect(campaignCall.select).toEqual({
            id: true,
            name: true
        });
        expect(campaignCall.select.characters).toBeUndefined(); // Should NOT fetch characters here

        // 2. Verify Character Fetches
        // We expect findMany (for players) and findFirst (for active char)

        // Verify Players Fetch
        expect(prisma.character.findMany).toHaveBeenCalledTimes(1);
        const playersCall = (prisma.character.findMany as any).mock.calls[0][0];

        expect(playersCall.where).toEqual({
            campaignId: 'c1',
            type: 'PLAYER'
        });
        expect(playersCall.orderBy).toEqual({ name: 'asc' });
        // Should use PUBLIC_CHAR_SELECT
        expect(playersCall.select).toEqual(expect.objectContaining({
            name: true,
            hp: true,
            activeTurn: true
        }));

        // Verify Active Character Fetch
        expect(prisma.character.findFirst).toHaveBeenCalledTimes(1);
        const activeCall = (prisma.character.findFirst as any).mock.calls[0][0];

        expect(activeCall.where).toEqual({
            campaignId: 'c1',
            activeTurn: true
        });
        expect(activeCall.select).toEqual({
            name: true,
            type: true
        });

        // 3. Verify Result Shape
        expect(result).toEqual({
            name: 'Test Campaign',
            characters: [{ id: 'p1', name: 'Player 1', type: 'PLAYER', activeTurn: false }],
            activeContestant: { name: 'NPC 1', type: 'NPC' }
        });
    });
});
