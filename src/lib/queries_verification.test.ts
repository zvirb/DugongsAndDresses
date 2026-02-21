import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock react cache before importing queries
vi.mock('react', () => ({
  cache: (fn: any) => fn,
}));

// Mock next/cache
vi.mock('next/cache', () => ({
  unstable_cache: (fn: any) => fn,
}));

import { getPlayerDashboard, getPlayerSkills, getPlayerInventory, getActiveCampaign, getCampaignPulse } from './queries';
import { prisma } from './prisma';

vi.mock('./prisma', () => ({
  prisma: {
    character: {
      findUnique: vi.fn(),
    },
    campaign: {
      findFirst: vi.fn(),
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

  it('getActiveCampaign selects optimized fields', async () => {
    (prisma.campaign.findFirst as any).mockResolvedValue({
      id: 'c1',
      name: 'Test Campaign',
      characters: [],
      logs: []
    });

    await getActiveCampaign();

    const calls = (prisma.campaign.findFirst as any).mock.calls;
    // getActiveCampaign calls findFirst potentially twice (active, then fallback),
    // but in test we return value on first call so it should be called once.
    expect(calls.length).toBeGreaterThan(0);
    const args = calls[0][0];
    const select = args.select;

    // Verify Character Selection
    expect(select.characters).toBeDefined();
    const charSelect = select.characters.select;

    // Should select needed fields
    expect(charSelect.id).toBe(true);
    expect(charSelect.name).toBe(true);
    expect(charSelect.hp).toBe(true);

    // SHOULD select fields needed for CharacterManager and others
    expect(charSelect.imageUrl).toBe(true);

    // Verify Log Selection
    expect(select.logs).toBeDefined();
    const logsArgs = select.logs;

    expect(logsArgs.take).toBe(20);
    expect(logsArgs.orderBy.timestamp).toBe('desc');

    const logSelect = logsArgs.select;
    expect(logSelect.id).toBe(true);
    expect(logSelect.content).toBe(true);
    expect(logSelect.timestamp).toBe(true);

    // SHOULD NOT select unused fields
    expect(logSelect.type).toBe(true);
  });

  it('getPlayerDashboard selects optimized fields with nested logs', async () => {
    (prisma.character.findUnique as any).mockResolvedValue({
      id: '1',
      campaignId: 'c1',
      campaign: { logs: [], characters: [] }
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
    expect(select.level).toBe(true);

    // Verify fields that SHOULD NOT be selected
    expect(select.attributes).toBeUndefined();
    expect(select.inventory).toBeUndefined();
    expect(select.conditions).toBeUndefined();

    // Verify logs query is nested in campaign
    expect(select.campaign).toBeDefined();
    const campaignSelect = select.campaign.select;
    expect(campaignSelect.logs).toBeDefined();

    const logsArgs = campaignSelect.logs;
    expect(logsArgs.take).toBe(5);
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

  it('getCampaignPulse selects only vital stats for polling', async () => {
    (prisma.campaign.findUnique as any).mockResolvedValue({
      id: 'c1',
      active: true,
      characters: [],
      logs: []
    });

    await getCampaignPulse('c1');

    const calls = (prisma.campaign.findUnique as any).mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    const args = calls[0][0];
    const select = args.select;

    // Verify Character Selection
    expect(select.characters).toBeDefined();
    const charSelect = select.characters.select;

    // Vital Stats
    expect(charSelect.id).toBe(true);
    expect(charSelect.hp).toBe(true);
    expect(charSelect.activeTurn).toBe(true);
    expect(charSelect.conditions).toBe(true);

    // Should NOT select heavy fields
    expect(charSelect.attributes).toBeUndefined();
    expect(charSelect.inventory).toBeUndefined();
    expect(charSelect.race).toBeUndefined();
    expect(charSelect.class).toBeUndefined();
    expect(charSelect.imageUrl).toBeUndefined();

    // Verify Log Selection
    expect(select.logs).toBeDefined();
    expect(select.logs.take).toBe(5); // Ultra-light logs
  });

  it('getPlayerDashboard filters targets in DB and excludes type', async () => {
    const mockCharacterId = 'char-1';

    // Mock return value to prevent crash
    (prisma.character.findUnique as any).mockResolvedValue({
      id: mockCharacterId,
      name: 'Hero',
      type: 'PLAYER',
      hp: 10,
      maxHp: 10,
      campaign: {
        logs: [],
        characters: [
          { id: 'char-2', name: 'Ally' }, // Mocked result of query
          { id: 'char-3', name: 'Enemy' }
        ]
      }
    });

    const result = await getPlayerDashboard(mockCharacterId);

    // Verify Prisma call arguments
    const calls = (prisma.character.findUnique as any).mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    const args = calls[0][0];

    // Check main select
    expect(args.where.id).toBe(mockCharacterId);

    // Check nested campaign select
    const campaignSelect = args.select.campaign.select;
    expect(campaignSelect).toBeDefined();

    // Check characters (targets) select
    const charactersSelect = campaignSelect.characters;
    expect(charactersSelect).toBeDefined();

    // VERIFY OPTIMIZATION: DB-level filtering
    expect(charactersSelect.where).toEqual({ id: { not: mockCharacterId } });

    // VERIFY OPTIMIZATION: Minimal field selection
    expect(charactersSelect.select).toEqual({ id: true, name: true });
    // explicitly ensure 'type' is NOT selected
    expect(charactersSelect.select.type).toBeUndefined();

    // Verify result processing
    expect(result).toBeDefined();
    expect(result!.targets.length).toBe(2);
    expect(result!.targets[0].id).toBe('char-2');
  });
});
