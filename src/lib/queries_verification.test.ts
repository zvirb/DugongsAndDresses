import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getPlayerDashboard, getPlayerSkills, getPlayerInventory } from './queries';
import { prisma } from './prisma';

vi.mock('./prisma', () => ({
  prisma: {
    character: {
      findUnique: vi.fn(),
    },
    logEntry: {
      findMany: vi.fn(),
    }
  }
}));

describe('Query Optimization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getPlayerDashboard selects optimized fields with nested logs', async () => {
    (prisma.character.findUnique as any).mockResolvedValue({
      id: '1',
      campaignId: 'c1',
      campaign: { logs: [] }
    });

    await getPlayerDashboard('1');

    const uniqueCalls = (prisma.character.findUnique as any).mock.calls;
    const uniqueArgs = uniqueCalls[0][0];
    const select = uniqueArgs.select;

    // Verify fields that SHOULD be selected
    expect(select.id).toBe(true);
    expect(select.hp).toBe(true);
    expect(select.activeTurn).toBe(true);
    expect(select.campaignId).toBe(true);

    // Verify fields that SHOULD NOT be selected
    expect(select.attributes).toBeUndefined();
    expect(select.inventory).toBeUndefined();
    expect(select.conditions).toBeUndefined();

    // Verify logs query is nested in campaign
    expect(select.campaign).toBeDefined();
    const campaignSelect = select.campaign.select;
    expect(campaignSelect.logs).toBeDefined();

    const logsArgs = campaignSelect.logs;
    expect(logsArgs.take).toBe(10);
    expect(logsArgs.orderBy.timestamp).toBe('desc');
    expect(logsArgs.select.id).toBe(true);
    expect(logsArgs.select.content).toBe(true);
    expect(logsArgs.select.timestamp).toBe(true);

    // Ensure no separate log query
    expect(prisma.logEntry.findMany).not.toHaveBeenCalled();
  });

  it('getPlayerDashboard handles missing campaign gracefully', async () => {
    (prisma.character.findUnique as any).mockResolvedValue({
      id: '1',
      campaign: null // Simulate missing campaign (though technically invalid schema)
    });

    const result = await getPlayerDashboard('1');

    expect(result).toBeDefined();
    expect(result!.logs).toEqual([]);
  });

  it('getPlayerSkills selects only attributes and stats', async () => {
    (prisma.character.findUnique as any).mockResolvedValue({ id: '1' });

    await getPlayerSkills('1');

    const calls = (prisma.character.findUnique as any).mock.calls;
    const select = calls[0][0].select;

    expect(select.attributes).toBe(true);
    expect(select.speed).toBe(true);
    expect(select.initiative).toBe(true);

    // Should NOT select heavy/unused fields
    expect(select.logs).toBeUndefined();
    expect(select.inventory).toBeUndefined();
    expect(select.hp).toBeUndefined(); // Skills page doesn't use HP
  });

  it('getPlayerInventory selects only inventory', async () => {
    (prisma.character.findUnique as any).mockResolvedValue({ id: '1' });

    await getPlayerInventory('1');

    const calls = (prisma.character.findUnique as any).mock.calls;
    const select = calls[0][0].select;

    expect(select.inventory).toBe(true);

    // Should NOT select heavy/unused fields
    expect(select.attributes).toBeUndefined();
    expect(select.logs).toBeUndefined();
    expect(select.hp).toBeUndefined();
  });
});
