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
  const activeCampaign = await prisma.campaign.findFirst({
    where: { active: true },
    select: {
      id: true,
      name: true,
      characters: {
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          initiativeRoll: true,
          activeTurn: true,
          hp: true,
          maxHp: true,
          type: true,
          conditions: true,
          armorClass: true,
          imageUrl: true,
          level: true,
          class: true,
          race: true
        }
      },
      logs: {
        take: 20,
        orderBy: { timestamp: 'desc' },
        select: {
          id: true,
          timestamp: true,
          content: true,
          type: true
        }
      }
    }
  });

  if (activeCampaign) return activeCampaign;

  return prisma.campaign.findFirst({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      characters: {
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          initiativeRoll: true,
          activeTurn: true,
          hp: true,
          maxHp: true,
          type: true,
          conditions: true,
          armorClass: true,
          imageUrl: true,
          level: true,
          class: true,
          race: true
        }
      },
      logs: {
        take: 20,
        orderBy: { timestamp: 'desc' },
        select: {
          id: true,
          timestamp: true,
          content: true,
          type: true
        }
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
    select: {
      name: true,
      characters: {
        where: { type: 'PLAYER' },
        orderBy: { name: 'asc' },
        select: {
          id: true,
          activeTurn: true,
          imageUrl: true,
          level: true,
          armorClass: true,
          name: true,
          race: true,
          class: true,
          hp: true,
          maxHp: true
        }
      }
    }
  });
}

/**
 * Fetches a single character by ID with recent logs for their campaign.
 */
export async function getCharacterWithLogs(id: string) {
  const character = await prisma.character.findUnique({
    where: { id },
    select: {
      id: true,
      type: true,
      hp: true,
      maxHp: true,
      name: true,
      race: true,
      class: true,
      level: true,
      activeTurn: true,
      imageUrl: true,
      armorClass: true,
      campaignId: true,
      speed: true,
      initiative: true
    }
  });

  if (!character) return null;

  const logs = await prisma.logEntry.findMany({
    where: { campaignId: character.campaignId },
    take: 10,
    orderBy: { timestamp: 'desc' },
    select: {
      id: true,
      content: true,
      timestamp: true
    }
  });

  return { ...character, logs };
}
