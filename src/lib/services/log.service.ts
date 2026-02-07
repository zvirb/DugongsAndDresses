import { prisma } from "../prisma";

/**
 * Service for managing campaign log entries.
 */
export const LogService = {
  /**
   * Creates a new log entry.
   * @param campaignId The ID of the campaign the log belongs to.
   * @param content The text content of the log.
   * @param type The type of log (e.g., "Story", "Combat", "Roll").
   * @returns The created log entry.
   */
  async create(campaignId: string, content: string, type: string = "Story") {
    if (!campaignId) throw new Error("Campaign ID is required");
    if (!content) throw new Error("Content is required");

    return prisma.logEntry.create({
      data: { campaignId, content, type }
    });
  }
};
