import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock react cache before importing queries
vi.mock('react', () => ({
  cache: (fn: any) => fn,
}));

import { getActiveCampaign, getPublicCampaign, getPlayerDashboard } from './queries';
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

        // Should NOT select heavy internal fields
        expect(charSelect.attributes).toBeUndefined();
        expect(charSelect.inventory).toBeUndefined();
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
