import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock react cache before importing queries
vi.mock('react', () => ({
  cache: (fn: any) => fn,
}));

// Mock next/cache
vi.mock('next/cache', () => ({
  unstable_cache: (fn: any) => fn,
}));

import { getActiveCampaign, getPublicCampaign, getSpectatorCampaign, getPlayerDashboard } from './queries';
import { prisma } from './prisma';

vi.mock('./prisma', () => ({
  prisma: {
    campaign: {
      findFirst: vi.fn(),
    },
    character: {
      findUnique: vi.fn(),
    }
  }
}));

describe('Query Optimization: getActiveCampaign', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls findFirst only once with optimized orderBy', async () => {
    (prisma.campaign.findFirst as any).mockResolvedValue({ id: 'any', name: 'Any Campaign' });

    await getActiveCampaign();

    const calls = (prisma.campaign.findFirst as any).mock.calls;
    expect(calls.length).toBe(1);

    // Check orderBy logic: Active first, then most recent
    expect(calls[0][0].orderBy).toEqual([
      { active: 'desc' },
      { createdAt: 'desc' }
    ]);
  });
});

describe('Query Optimization: getPublicCampaign', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('fetches active campaign with minimized payload', async () => {
        (prisma.campaign.findFirst as any).mockResolvedValue({ name: 'Public Camp' });

        await getPublicCampaign();

        const calls = (prisma.campaign.findFirst as any).mock.calls;
        expect(calls.length).toBe(1);
        const args = calls[0][0];

        // Should target active campaigns
        expect(args.where).toEqual({ active: true });

        // Should sort by createdAt desc (deterministic)
        expect(args.orderBy).toEqual({ createdAt: 'desc' });

        // Verify selections
        const charSelect = args.select.characters.select;
        expect(charSelect.id).toBe(true);
        expect(charSelect.conditions).toBe(true);
        expect(charSelect.imageUrl).toBe(true);
        expect(charSelect.activeTurn).toBe(true);
        // Verify that type is now selected as part of PUBLIC_CHAR_SELECT updates
        expect(charSelect.type).toBe(true);

        // Should NOT select heavy internal fields
        expect(charSelect.attributes).toBeUndefined();
        expect(charSelect.inventory).toBeUndefined();
    });
});

describe('Query Optimization: getSpectatorCampaign', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('fetches all characters and correctly filters for display', async () => {
        const mockCharacters = [
            { id: '1', name: 'Player1', type: 'PLAYER', activeTurn: false },
            { id: '2', name: 'NPC1', type: 'NPC', activeTurn: true },
            { id: '3', name: 'Player2', type: 'PLAYER', activeTurn: false }
        ];

        (prisma.campaign.findFirst as any).mockResolvedValue({
            name: 'Spectator Camp',
            characters: mockCharacters
        });

        const result = await getSpectatorCampaign();

        const calls = (prisma.campaign.findFirst as any).mock.calls;
        expect(calls.length).toBe(1);
        const args = calls[0][0];

        // Should NOT filter by type in the query (fetch all)
        expect(args.select.characters.where).toBeUndefined();

        // Should select type
        const charSelect = args.select.characters.select;
        expect(charSelect.type).toBe(true);

        // Verify processing logic
        expect(result?.characters.length).toBe(2); // Only players
        expect(result?.characters.find((c: any) => c.type === 'NPC')).toBeUndefined();
        expect(result?.activeContestant?.name).toBe('NPC1');
        expect(result?.activeContestant?.type).toBe('NPC');
    });
});

describe('Query Optimization: getPlayerDashboard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('fetches player data with conditions and logs', async () => {
        (prisma.character.findUnique as any).mockResolvedValue({ id: '1', campaign: { logs: [] } });

        await getPlayerDashboard('1');

        const calls = (prisma.character.findUnique as any).mock.calls;
        expect(calls.length).toBe(1);
        const args = calls[0][0];

        const select = args.select;

        // Verify conditions is added
        expect(select.conditions).toBe(true);

        // Verify other essential fields
        expect(select.hp).toBe(true);
        expect(select.activeTurn).toBe(true);

        // Verify heavy fields excluded
        expect(select.attributes).toBeUndefined();
        expect(select.inventory).toBeUndefined();

        // Verify log optimization
        const logSelect = select.campaign.select.logs;
        expect(logSelect.take).toBe(10);
        expect(logSelect.select.content).toBe(true);
    });
});
