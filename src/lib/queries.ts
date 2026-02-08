import { cache } from "react";
import { prisma } from "./prisma";

/**
 * Common selection logic for detailed campaign views (DM view).
 */
const CAMPAIGN_DETAILS_SELECT = {
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
      race: true,
      attributes: true,
      inventory: true,
      speed: true,
      initiative: true
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
 * Fetches detailed data for a specific campaign by ID.
 */
export async function getCampaignDetails(id: string) {
  return prisma.campaign.findUnique({
    where: { id },
    select: CAMPAIGN_DETAILS_SELECT
  });
}

/**
 * Fetches the currently active campaign including characters and recent logs.
 * If no campaign is explicitly active, it defaults to the most recent one.
 */
export async function getActiveCampaign() {
  const activeCampaign = await prisma.campaign.findFirst({
    where: { active: true },
    select: CAMPAIGN_DETAILS_SELECT
  });

  if (activeCampaign) return activeCampaign;

  return prisma.campaign.findFirst({
    orderBy: { createdAt: 'desc' },
    select: CAMPAIGN_DETAILS_SELECT
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
      inventory: true
    }
  });
});
