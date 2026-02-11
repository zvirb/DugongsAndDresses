import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock react cache before importing queries
vi.mock('react', () => ({
  cache: (fn: any) => fn,
}));

import { getActiveCampaign } from './queries';
import { prisma } from './prisma';

vi.mock('./prisma', () => ({
  prisma: {
    campaign: {
      findFirst: vi.fn(),
    },
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
