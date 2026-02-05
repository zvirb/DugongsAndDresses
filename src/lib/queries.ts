import { prisma } from "./prisma";

/**
 * Fetches all campaigns ordered by creation date.
 */
export async function getCampaigns() {
  return prisma.campaign.findMany({
    select: { id: true, name: true, active: true },
    orderBy: { createdAt: 'desc' }
  });
}

/**
 * Fetches the currently active campaign including characters and recent logs.
 * If no campaign is explicitly active, it defaults to the most recent one.
 */
export async function getActiveCampaign() {
  const campaigns = await getCampaigns();
  const activeCampaignId = campaigns.find(c => c.active)?.id || campaigns[0]?.id;

  if (!activeCampaignId) return null;

  return prisma.campaign.findUnique({
    where: { id: activeCampaignId },
    include: {
      characters: {
        orderBy: { name: 'asc' }
      },
      logs: {
        take: 20,
        orderBy: { timestamp: 'desc' }
      }
    }
  });
}

/**
 * Fetches active campaign data for public display, filtering for PLAYER characters.
 */
export async function getPublicCampaign() {
  return prisma.campaign.findFirst({
    where: { active: true },
    include: {
      characters: {
        where: { type: 'PLAYER' },
        orderBy: { name: 'asc' }
      }
    }
  });
}

/**
 * Fetches a single character by ID with recent logs for their campaign.
 */
export async function getCharacterWithLogs(id: string) {
  const character = await prisma.character.findUnique({
    where: { id }
  });

  if (!character) return null;

  const logs = await prisma.logEntry.findMany({
    where: { campaignId: character.campaignId },
    take: 10,
    orderBy: { timestamp: 'desc' }
  });

  return { ...character, logs };
}
