import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "./prisma";

/**
 * ORACLE'S JOURNAL - CRITICAL LEARNINGS ONLY
 *
 * ## 2025-02-18 - [getPublicCampaign] Slow: [Potential repeated reads] Sight: [Added React cache, Standardized Select: PUBLIC_CHAR_SELECT]
 * ## 2025-02-18 - [getPlayerDashboard] Slow: [Missing conditions, potential heavy logs] Sight: [Added conditions, Standardized Select: PLAYER_DASHBOARD_SELECT]
 * ## 2025-05-25 - [getPublicCampaign] Slow: [AutoRefresh polling] Sight: [Wrapped in unstable_cache to deduplicate across requests]
 * ## 2025-05-25 - [getPlayerDashboard] Slow: [Player polling] Sight: [Wrapped in unstable_cache for protection]
 * ## 2025-05-25 - [getSpectatorCampaign] Slow: [Fetched all characters] Sight: [Split into Players/Active queries]
 */

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
  imageUrl: true
} as const;

const DM_LOG_SELECT = {
  id: true,
  timestamp: true,
  content: true,
  type: true
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

const PUBLIC_CHAR_SELECT = {
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
  conditions: true,
  type: true
} as const;

const PLAYER_DASHBOARD_SELECT = {
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
  conditions: true
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
 * Cached with unstable_cache for polling performance (revalidate: 1s).
 */
export const getPublicCampaign = unstable_cache(
  async function getPublicCampaign() {
    return prisma.campaign.findFirst({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
      select: {
        name: true,
        characters: {
          where: { type: 'PLAYER' },
          orderBy: { name: 'asc' },
          select: PUBLIC_CHAR_SELECT
        }
      }
    });
  },
  ['public-campaign'],
  { revalidate: 1, tags: ['public-campaign'] }
);

/**
 * Fetches active campaign data for the Spectator view (Public Display).
 * Includes ALL characters to determine active turn, but filters displayed list to PLAYERS only.
 * Cached with unstable_cache for polling performance (revalidate: 1s).
 */
export const getSpectatorCampaign = unstable_cache(
  async function getSpectatorCampaign() {
    const campaign = await prisma.campaign.findFirst({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true
      }
    });

    if (!campaign) return null;

    const [players, activeContestant] = await Promise.all([
      prisma.character.findMany({
        where: { campaignId: campaign.id, type: 'PLAYER' },
        orderBy: { name: 'asc' },
        select: PUBLIC_CHAR_SELECT
      }),
      prisma.character.findFirst({
        where: { campaignId: campaign.id, activeTurn: true },
        select: { name: true, type: true }
      })
    ]);

    return {
      name: campaign.name,
      characters: players,
      activeContestant: activeContestant
    };
  },
  ['spectator-campaign'],
  { revalidate: 1, tags: ['spectator-campaign'] }
);

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
        orderBy: { name: 'asc' },
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
 * Excludes heavy JSON fields (attributes, inventory).
 * Cached with unstable_cache for polling performance (revalidate: 1s).
 */
export const getPlayerDashboard = unstable_cache(
  async function getPlayerDashboard(id: string) {
    const character = await prisma.character.findUnique({
      where: { id },
      select: {
        ...PLAYER_DASHBOARD_SELECT,
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
  },
  ['player-dashboard'],
  { revalidate: 1, tags: ['player-dashboard'] }
);

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
