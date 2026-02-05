import { prisma } from "./prisma";

/**
 * Example: Complex query with multiple inclusions and filtering
 */
export async function getCampaignSummary(campaignId: string) {
    return prisma.campaign.findUnique({
        where: { id: campaignId },
        include: {
            _count: {
                select: {
                    characters: true,
                    logs: true,
                    encounters: true
                }
            },
            characters: {
                where: { type: 'PLAYER' },
                orderBy: { level: 'desc' }
            }
        }
    });
}

/**
 * Example: Transaction for consistent state updates
 */
export async function resetCampaignState(campaignId: string) {
    return prisma.$transaction([
        // Reset all turns
        prisma.character.updateMany({
            where: { campaignId },
            data: { activeTurn: false, initiativeRoll: 0 }
        }),
        // Log the reset
        prisma.logEntry.create({
            data: {
                campaignId,
                content: "Session state has been reset.",
                type: "Story"
            }
        })
    ]);
}

/**
 * Example: Searching logs with filtering
 */
export async function searchCampaignLogs(campaignId: string, query: string) {
    return prisma.logEntry.findMany({
        where: {
            campaignId,
            content: {
                contains: query
            }
        },
        orderBy: { timestamp: 'desc' }
    });
}
