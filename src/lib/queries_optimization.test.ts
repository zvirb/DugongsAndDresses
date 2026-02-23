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
      findUnique: vi.fn(),
    },
    character: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    logEntry: {
      findMany: vi.fn(),
    }
  }
}));

import {
  getSpectatorCampaign,
  getActiveCampaign,
  getPlayerDashboard,
  getPlayerSkills,
  getPlayerInventory,
  getCampaignPulse,
  getCampaignTargets,
  getPublicCampaign
} from './queries';

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
        { id: 'npc1', name: 'Boss NPC', type: 'NPC', activeTurn: true, imageUrl: 'https://npc.png' }
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
      type: 'NPC',
      imageUrl: 'https://npc.png'
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

describe('General Query Optimizations', () => {
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
    expect(calls.length).toBeGreaterThan(0);
    const args = calls[0][0];
    const select = args.select;

    // Verify Character Selection
    expect(select.characters).toBeDefined();
    const charSelect = select.characters.select;

    expect(charSelect.id).toBe(true);
    expect(charSelect.name).toBe(true);
    expect(charSelect.hp).toBe(true);
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

    // Ensure targets are NOT selected
    expect(campaignSelect.characters).toBeUndefined();
  });

  it('getPlayerDashboard handles missing campaign gracefully', async () => {
    (prisma.character.findUnique as any).mockResolvedValue({
      id: '1',
      campaign: null // Simulate missing campaign
    });

    const result = await getPlayerDashboard('1');

    expect(result).toBeDefined();
    expect(result!.logs).toEqual([]);
  });

  it('getCampaignTargets selects minimal fields', async () => {
    const mockCampaignId = 'c1';
    (prisma.character.findMany as any).mockResolvedValue([
      { id: 'char-1', name: 'Hero' },
      { id: 'char-2', name: 'Ally' }
    ]);

    const result = await getCampaignTargets(mockCampaignId);

    const calls = (prisma.character.findMany as any).mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    const args = calls[0][0];

    // Verify query
    expect(args.where.campaignId).toBe(mockCampaignId);
    expect(args.orderBy.name).toBe('asc');

    // Verify select
    expect(args.select).toEqual({ id: true, name: true });

    // Verify result
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Hero');
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
    expect(select.hp).toBeUndefined();
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
    expect(charSelect.imageUrl).toBeUndefined();

    // Verify Log Selection
    expect(select.logs).toBeDefined();
    expect(select.logs.take).toBe(5);
  });

  it('getPublicCampaign selects minimal fields for player selection', async () => {
    (prisma.campaign.findFirst as any).mockResolvedValue({
      id: 'c1',
      name: 'Test Campaign',
      characters: []
    });

    await getPublicCampaign();

    const calls = (prisma.campaign.findFirst as any).mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    const args = calls[0][0];

    // Verify it filters for active campaign
    expect(args.where.active).toBe(true);

    // Verify it selects only name and characters
    expect(args.select.name).toBe(true);
    expect(args.select.characters).toBeDefined();

    const charSelect = args.select.characters.select;

    // Verify fields that SHOULD be selected (PLAYER_SELECTION_SELECT)
    expect(charSelect.id).toBe(true);
    expect(charSelect.name).toBe(true);
    expect(charSelect.imageUrl).toBe(true);
    expect(charSelect.level).toBe(true);
    expect(charSelect.race).toBe(true);
    expect(charSelect.class).toBe(true);

    // Verify fields that SHOULD NOT be selected (from PUBLIC_CHAR_SELECT)
    expect(charSelect.hp).toBeUndefined();
    expect(charSelect.maxHp).toBeUndefined();
    expect(charSelect.activeTurn).toBeUndefined();
    expect(charSelect.conditions).toBeUndefined();
    expect(charSelect.armorClass).toBeUndefined();
    expect(charSelect.type).toBeUndefined();
  });

});
