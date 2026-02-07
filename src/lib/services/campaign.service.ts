import { prisma } from "../prisma";

/**
 * Service for managing campaigns.
 */
export const CampaignService = {
  /**
   * Fetches all campaigns from the database.
   * @returns A list of campaigns with id, name, and active status.
   */
  async getAll() {
    return prisma.campaign.findMany({
      select: { id: true, name: true, active: true },
      orderBy: { createdAt: 'desc' }
    });
  },

  /**
   * Fetches the currently active campaign.
   * If no campaign is marked as active, returns the most recently created one.
   * @returns The active campaign with its characters and recent logs, or null if no campaigns exist.
   */
  async getActive() {
    const campaigns = await this.getAll();
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
  },

  /**
   * Fetches an active campaign for public view (only player characters).
   * @returns The active campaign with player characters, or null if none active.
   */
  async getPublic() {
    return prisma.campaign.findFirst({
      where: { active: true },
      include: {
        characters: {
          where: { type: 'PLAYER' },
          orderBy: { name: 'asc' }
        }
      }
    });
  },

  /**
   * Creates a new campaign, optionally with characters.
   * @param name The name of the new campaign.
   * @param characters Optional array of character data to create with the campaign.
   * @returns The created campaign.
   * @throws Error if name is empty.
   */
  async create(name: string, characters?: Array<{
    name: string; type: string; race?: string; class?: string; level?: number;
    hp: number; maxHp: number; armorClass: number; speed?: number; initiative?: number;
    attributes?: string;
  }>) {
    if (!name || name.trim().length === 0) {
      throw new Error("Campaign name is required");
    }

    return prisma.campaign.create({
      data: {
        name: name.trim(),
        active: true,
        ...(characters && characters.length > 0 ? {
          characters: {
            create: characters.map(c => ({
              name: c.name,
              type: c.type || "PLAYER",
              race: c.race || null,
              class: c.class || null,
              level: c.level || 1,
              hp: c.hp,
              maxHp: c.maxHp,
              armorClass: c.armorClass,
              speed: c.speed || 30,
              initiative: c.initiative || 0,
              attributes: c.attributes || "{}",
              initiativeRoll: 0,
            }))
          }
        } : {})
      }
    });
  },

  /**
   * Activates a campaign and deactivates all others.
   * @param id The ID of the campaign to activate.
   * @returns The updated campaign.
   */
  async activate(id: string) {
    if (!id) throw new Error("Campaign ID is required");

    // Deactivate all
    await prisma.campaign.updateMany({
      data: { active: false }
    });

    // Activate target
    return prisma.campaign.update({
      where: { id },
      data: { active: true }
    });
  }
};
