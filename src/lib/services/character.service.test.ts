import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CharacterService } from './character.service';
import { prisma } from '../prisma';

vi.mock('../prisma', () => ({
  prisma: {
    character: {
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  $transaction: vi.fn((ops) => Promise.all(ops)),
    logEntry: {
      findMany: vi.fn(),
    }
  }
}));

describe('CharacterService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getWithLogs fetches character and logs in a single query (optimized)', async () => {
    const mockLogs = [{ id: 'log1', content: 'Test Log', timestamp: new Date() }];
    const mockCharacter = {
      id: 'char1',
      campaignId: 'camp1',
      name: 'Test Char',
      campaign: { logs: mockLogs }
    };

    (prisma.character.findUnique as any).mockResolvedValue(mockCharacter);

    const result = await CharacterService.getWithLogs('char1');

    // Verify character fetch with include
    expect(prisma.character.findUnique).toHaveBeenCalledWith({
      where: { id: 'char1' },
      include: {
        campaign: {
          select: {
            logs: {
              take: 10,
              orderBy: { timestamp: 'desc' }
            }
          }
        }
      }
    });

    // Verify no separate logs fetch
    expect(prisma.logEntry.findMany).not.toHaveBeenCalled();

    const { campaign, ...expectedChar } = mockCharacter;
    expect(result).toEqual({ ...expectedChar, logs: mockLogs });
  });

  it('getWithLogs handles missing campaign or logs gracefully', async () => {
    const mockCharacter = {
      id: 'char2',
      campaignId: 'camp2',
      name: 'Test Char 2',
      // Simulate missing campaign (or just logs)
    };

    (prisma.character.findUnique as any).mockResolvedValue(mockCharacter);

    const result = await CharacterService.getWithLogs('char2');

    expect(prisma.logEntry.findMany).not.toHaveBeenCalled();
    expect(result).toEqual({ ...mockCharacter, logs: [] });
  });

  it('setNextTurn utilizes $transaction for atomic turn updates', async () => {
    const mockCharacter = { id: 'char1', name: 'Next Actor', activeTurn: true };
    (prisma.character.update as any).mockReturnValue('update_op');
    (prisma.character.updateMany as any).mockReturnValue('updateMany_op');
    (prisma.$transaction as any).mockResolvedValue([ { count: 1 }, mockCharacter ]);

    const result = await CharacterService.setNextTurn('camp1', 'char1');

    expect(prisma.$transaction).toHaveBeenCalledWith([
      'updateMany_op',
      'update_op'
    ]);
    expect(prisma.character.updateMany).toHaveBeenCalledWith({
      where: { campaignId: 'camp1', activeTurn: true },
      data: { activeTurn: false }
    });
    expect(prisma.character.update).toHaveBeenCalledWith({
      where: { id: 'char1' },
      data: { activeTurn: true }
    });
    expect(result).toEqual(mockCharacter);
  });
});
