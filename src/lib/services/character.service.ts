import { prisma } from "../prisma";

/**
 * Service for managing characters.
 */
export const CharacterService = {
  /**
   * Fetches a character by ID including recent logs from their campaign.
   * @param id The character ID.
   * @returns The character with logs, or null if not found.
   */
  async getWithLogs(id: string) {
    const character = await prisma.character.findUnique({
      where: { id },
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

    if (!character) return null;

    const { campaign, ...charData } = character;
    const logs = campaign?.logs || [];

    return { ...charData, logs };
  },

  /**
   * Updates a character's current HP.
   * @param id The character ID.
   * @param delta The amount to change HP by (positive for healing, negative for damage).
   * @returns The updated character.
   */
  async updateHP(id: string, delta: number) {
    if (!id) throw new Error("Character ID is required");

    return prisma.character.update({
      where: { id },
      data: { hp: { increment: delta } }
    });
  },

  /**
   * Updates a character's initiative roll for the current combat.
   * @param id The character ID.
   * @param roll The initiative roll value.
   * @returns The updated character.
   */
  async updateInitiative(id: string, roll: number) {
    if (!id) throw new Error("Character ID is required");

    return prisma.character.update({
      where: { id },
      data: { initiativeRoll: roll }
    });
  },

  /**
   * Updates a character's avatar image URL.
   * @param id The character ID.
   * @param imageUrl The new image URL.
   * @returns The updated character.
   */
  async updateImageUrl(id: string, imageUrl: string) {
    if (!id) throw new Error("Character ID is required");
    if (!imageUrl) throw new Error("Image URL is required");

    return prisma.character.update({
      where: { id },
      data: { imageUrl }
    });
  },

  /**
   * Sets the turn to a specific character and unsets all other characters in the campaign.
   * @param campaignId The campaign ID.
   * @param characterId The character ID whose turn it is.
   * @returns The updated character.
   */
  async setNextTurn(campaignId: string, characterId: string) {
    if (!campaignId) throw new Error("Campaign ID is required");
    if (!characterId) throw new Error("Character ID is required");

    // 1. Unset current turn
    await prisma.character.updateMany({
      where: { campaignId, activeTurn: true },
      data: { activeTurn: false }
    });

    // 2. Set new turn
    return prisma.character.update({
      where: { id: characterId },
      data: { activeTurn: true }
    });
  }
};
