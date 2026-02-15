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

    it('getSpectatorCampaign should consolidate fetches and skip NPC query if Player is active', async () => {
        // Mock campaign with nested players (Player Active)
        (prisma.campaign.findFirst as any).mockResolvedValue({
            id: 'c1',
            name: 'Test Campaign',
            characters: [
                { id: 'p1', name: 'Player 1', type: 'PLAYER', activeTurn: true }
            ]
        });

        const result = await getSpectatorCampaign();

        // 1. Verify Campaign Fetch (Nested)
        expect(prisma.campaign.findFirst).toHaveBeenCalledTimes(1);
        const campaignCall = (prisma.campaign.findFirst as any).mock.calls[0][0];

        // Should select ID, Name, and nested characters
        expect(campaignCall.select).toEqual(expect.objectContaining({
            id: true,
            name: true,
            characters: expect.objectContaining({
                where: { type: 'PLAYER' },
                orderBy: { name: 'asc' },
                // We assume PUBLIC_CHAR_SELECT is used, checking a key field
                select: expect.objectContaining({ hp: true, type: true, activeTurn: true })
            })
        }));

        // 2. Verify NO extra character fetches
        expect(prisma.character.findMany).not.toHaveBeenCalled(); // Should be zero now
        expect(prisma.character.findFirst).not.toHaveBeenCalled(); // Should be zero because player is active

        // 3. Verify Result Shape
        expect(result).toEqual({
            name: 'Test Campaign',
            characters: [{ id: 'p1', name: 'Player 1', type: 'PLAYER', activeTurn: true }],
            activeContestant: { name: 'Player 1', type: 'PLAYER' }
        });
    });

    it('getSpectatorCampaign should fetch active NPC if no Player is active', async () => {
        // Mock campaign with nested players (No Active Player)
        (prisma.campaign.findFirst as any).mockResolvedValue({
            id: 'c1',
            name: 'Test Campaign',
            characters: [
                { id: 'p1', name: 'Player 1', type: 'PLAYER', activeTurn: false }
            ]
        });

        // Mock active char (NPC)
        (prisma.character.findFirst as any).mockResolvedValue(
            { name: 'NPC 1', type: 'NPC' }
        );

        const result = await getSpectatorCampaign();

        // 1. Verify Campaign Fetch
        expect(prisma.campaign.findFirst).toHaveBeenCalledTimes(1);

        // 2. Verify Active NPC Fetch
        expect(prisma.character.findFirst).toHaveBeenCalledTimes(1);
        const activeCall = (prisma.character.findFirst as any).mock.calls[0][0];

        expect(activeCall.where).toEqual({
            campaignId: 'c1',
            activeTurn: true,
            type: 'NPC' // Optimization: Only look for NPCs
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
