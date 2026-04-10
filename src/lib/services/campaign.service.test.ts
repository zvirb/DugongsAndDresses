import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CampaignService } from './campaign.service';
import { prisma } from '../prisma';

vi.mock('../prisma', () => ({
  prisma: {
    campaign: {
      updateMany: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn((promises) => Promise.all(promises)),
  }
}));

describe('CampaignService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('activate', () => {
    it('should deactivate all campaigns and then activate the target campaign in a transaction', async () => {
      const mockId = 'campaign-123';
      const mockResult = { id: mockId, active: true };

      (prisma.campaign.updateMany as any).mockResolvedValue({ count: 5 });
      (prisma.campaign.update as any).mockResolvedValue(mockResult);

      const result = await CampaignService.activate(mockId);

      expect(prisma.$transaction).toHaveBeenCalled();

      const calls = (prisma.$transaction as any).mock.calls[0][0];
      expect(calls).toHaveLength(2);

      expect(prisma.campaign.updateMany).toHaveBeenCalledWith({
        data: { active: false }
      });
      expect(prisma.campaign.update).toHaveBeenCalledWith({
        where: { id: mockId },
        data: { active: true }
      });
      expect(result).toEqual(mockResult);
    });

    it('should throw an error if no ID is provided', async () => {
      await expect(CampaignService.activate('')).rejects.toThrow("Campaign ID is required");
    });
  });
});
