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
  // Try to find an explicitly active campaign first
  let campaign = await prisma.campaign.findFirst({
    where: { active: true },
    select: {
      id: true,
      characters: {
        select: {
          id: true,
          name: true,
          type: true,
          hp: true,
          maxHp: true,
          armorClass: true,
          imageUrl: true,
          conditions: true,
          initiativeRoll: true,
          activeTurn: true
        },
        orderBy: { name: 'asc' }
      },
      logs: {
        take: 20,
        orderBy: { timestamp: 'desc' },
        select: {
          id: true,
          timestamp: true,
          content: true
        }
      }
    }
  });

  // Fallback to the most recent campaign if none are active
  if (!campaign) {
    campaign = await prisma.campaign.findFirst({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        characters: {
          select: {
            id: true,
            name: true,
            type: true,
            hp: true,
            maxHp: true,
            armorClass: true,
            imageUrl: true,
            conditions: true,
            initiativeRoll: true,
            activeTurn: true
          },
          orderBy: { name: 'asc' }
        },
        logs: {
          take: 20,
          orderBy: { timestamp: 'desc' },
          select: {
            id: true,
            timestamp: true,
            content: true
          }
        }
      }
    });
  }

  return campaign;
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
      name: true,
      race: true,
      class: true,
      level: true,
      activeTurn: true,
      imageUrl: true,
      hp: true,
      maxHp: true,
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
      timestamp: true,
      content: true
    }
  });

  return { ...character, logs };
}
