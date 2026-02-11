import { cache } from "react";
import { prisma } from "./prisma";

// Reusable select constants for consistency and optimization
const DM_CHAR_SELECT = {
  id: true,
  name: true,
  initiativeRoll: true,
  activeTurn: true,
  hp: true,
  maxHp: true,
  type: true,
  conditions: true,
  armorClass: true,
  level: true,
  class: true,
  race: true,
  attributes: true,
  inventory: true,
  speed: true,
  initiative: true,
  createdAt: true,
  updatedAt: true,
  sourceId: true,
  imageUrl: true,
  campaignId: true
} as const;

const DM_LOG_SELECT = {
  id: true,
  timestamp: true,
  content: true,
  type: true,
  campaignId: true
} as const;

const PULSE_CHAR_SELECT = {
  id: true,
  name: true,
  hp: true,
  maxHp: true,
  activeTurn: true,
  initiativeRoll: true,
  conditions: true,
  type: true
} as const;

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
 * Fetches detailed campaign data by ID.
 * Intended to be used when the ID is already known (e.g. from getCampaigns list).
 */
export async function getCampaignDetails(id: string) {
  return prisma.campaign.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      characters: {
        orderBy: { name: 'asc' },
        select: DM_CHAR_SELECT
      },
      logs: {
        take: 20,
        orderBy: { timestamp: 'desc' },
        select: DM_LOG_SELECT
      }
    }
  });
}

/**
 * Fetches the currently active campaign including characters and recent logs.
 * If no campaign is explicitly active, it defaults to the most recent one.
 */
export async function getActiveCampaign() {
  return prisma.campaign.findFirst({
    orderBy: [
      { active: 'desc' },
      { createdAt: 'desc' }
    ],
    select: {
      id: true,
      name: true,
      characters: {
        orderBy: { name: 'asc' },
        select: DM_CHAR_SELECT
      },
      logs: {
        take: 20,
        orderBy: { timestamp: 'desc' },
        select: DM_LOG_SELECT
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
          maxHp: true,
          conditions: true
        }
      }
    }
  });
}

/**
 * Optimized fetch for polling updates.
 * Selects only vital stats and recent logs to reduce database load.
 */
export async function getCampaignPulse(campaignId: string) {
  return prisma.campaign.findUnique({
    where: { id: campaignId },
    select: {
      id: true,
      active: true,
      characters: {
        select: PULSE_CHAR_SELECT
      },
      logs: {
        take: 5,
        orderBy: { timestamp: 'desc' },
        select: DM_LOG_SELECT
      }
    }
  });
}

/**
 * Optimized fetch for the Player Dashboard (Status Page).
 * Selects only fields needed for the main view + logs.
 * Excludes heavy JSON fields (attributes, inventory, conditions).
 */
export const getPlayerDashboard = cache(async function getPlayerDashboard(id: string) {
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
      initiative: true,
      initiativeRoll: true,
      campaign: {
        select: {
          logs: {
            take: 10,
            orderBy: { timestamp: 'desc' },
            select: {
              id: true,
              content: true,
              timestamp: true
            }
          }
        }
      }
    }
  });

  if (!character) return null;

  const { campaign, ...charData } = character;
  // Although campaign is required by schema, we safely access logs just in case
  const logs = campaign?.logs || [];
  return { ...charData, logs };
});

/**
 * Optimized fetch for the Skills Page.
 * Selects attributes and stats, excludes logs and inventory.
 */
export const getPlayerSkills = cache(async function getPlayerSkills(id: string) {
  return prisma.character.findUnique({
    where: { id },
    select: {
      id: true,
      type: true,
      name: true,
      race: true,
      class: true,
      level: true,
      attributes: true,
      speed: true,
      initiative: true
    }
  });
});

/**
 * Optimized fetch for the Inventory Page.
 * Selects inventory, excludes attributes and logs.
 */
export const getPlayerInventory = cache(async function getPlayerInventory(id: string) {
  return prisma.character.findUnique({
    where: { id },
    select: {
      id: true,
      type: true,
      name: true,
      inventory: true,
      campaignId: true
    }
  });
});
