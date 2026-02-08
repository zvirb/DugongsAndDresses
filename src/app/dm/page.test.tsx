import { vi, describe, it, expect, beforeEach, type Mock } from 'vitest';
import DMPage from './page';
import React from 'react';

// Mock the prisma client
vi.mock('@/lib/prisma', () => ({
  prisma: {
    campaign: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
    logEntry: {
      findMany: vi.fn(),
    }
  }
}));

// Mock child components to avoid rendering issues
vi.mock('@/components/DiceRoller', () => ({ default: () => null }));
vi.mock('@/components/TurnTracker', () => ({ default: () => null }));
vi.mock('@/components/AICopyButton', () => ({ default: () => null }));
vi.mock('@/components/CharacterManager', () => ({ default: () => null }));
vi.mock('@/components/CampaignSelector', () => ({ default: () => null }));
vi.mock('@/components/CampaignWizard', () => ({ default: () => null }));
vi.mock('@/components/QuickActions', () => ({ default: () => null }));
vi.mock('@/components/ui/Card', () => ({
    Card: ({children}: {children: React.ReactNode}) => <div>{children}</div>,
    CardContent: ({children}: {children: React.ReactNode}) => <div>{children}</div>,
    CardHeader: ({children}: {children: React.ReactNode}) => <div>{children}</div>,
    CardTitle: ({children}: {children: React.ReactNode}) => <div>{children}</div>
}));

import { prisma } from '@/lib/prisma';

describe('DMPage Performance', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('uses getCampaignDetails (findUnique) instead of findFirst', async () => {
        // Setup mock return values
        const mockCampaigns = [
            { id: 'c1', name: 'Campaign 1', active: true, createdAt: new Date() },
            { id: 'c2', name: 'Campaign 2', active: false, createdAt: new Date() }
        ];

        const mockActiveCampaign = {
            id: 'c1',
            name: 'Campaign 1',
            characters: [],
            logs: []
        };

        (prisma.campaign.findMany as Mock).mockResolvedValue(mockCampaigns);
        (prisma.campaign.findUnique as Mock).mockResolvedValue(mockActiveCampaign);
        // We ensure findFirst is NOT called
        (prisma.campaign.findFirst as Mock).mockResolvedValue(null);

        await DMPage();

        // Verify calls
        expect(prisma.campaign.findMany).toHaveBeenCalledTimes(1);

        // Should use findUnique now (which is generally faster and uses PK)
        expect(prisma.campaign.findUnique).toHaveBeenCalledTimes(1);
        expect(prisma.campaign.findUnique).toHaveBeenCalledWith(expect.objectContaining({
            where: { id: 'c1' }
        }));

        // Should NOT use findFirst anymore
        expect(prisma.campaign.findFirst).not.toHaveBeenCalled();
    });

    it('uses fallback to first campaign if no active one found', async () => {
        const mockCampaigns = [
            { id: 'c2', name: 'Campaign 2', active: false, createdAt: new Date() }
        ];

        const mockActiveCampaign = {
            id: 'c2',
            name: 'Campaign 2',
            characters: [],
            logs: []
        };

        (prisma.campaign.findMany as Mock).mockResolvedValue(mockCampaigns);
        (prisma.campaign.findUnique as Mock).mockResolvedValue(mockActiveCampaign);

        await DMPage();

        expect(prisma.campaign.findMany).toHaveBeenCalledTimes(1);
        expect(prisma.campaign.findUnique).toHaveBeenCalledWith(expect.objectContaining({
            where: { id: 'c2' }
        }));
    });
});
