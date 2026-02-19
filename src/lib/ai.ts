
import { prisma } from "@/lib/prisma";

export async function generateStory(campaignId: string) {
    try {
        const settings = await prisma.settings.findFirst();
        if (!settings || !settings.enableStoryGen) return;

        // Fetch recent logs to generate context
        const recentLogs = await prisma.logEntry.findMany({
            where: { campaignId },
            orderBy: { timestamp: 'desc' },
            take: 5
        });

        if (recentLogs.length === 0) return;

        // Mock AI Generation Logic
        // In a real implementation, we would call Ollama or OpenAI here.
        // For now, we use a simple heuristic to generate a "story" log.

        const lastLog = recentLogs[0];

        // Prevent infinite loop if the last log was already AI generated
        if (lastLog.type === 'AI') return;

        let storyContent = "";

        const contentLower = lastLog.content.toLowerCase();

        // Enhanced rules-based generation
        if (contentLower.includes("attacks") || contentLower.includes("strikes") || contentLower.includes("damage")) {
            storyContent = "The clash of steel rings out as the battle intensifies.";
        } else if (contentLower.includes("enters the fray") || contentLower.includes("approaches")) {
            storyContent = "A new challenger approaches, changing the dynamic of the encounter.";
        } else if (contentLower.includes("fallen") || contentLower.includes("unconscious")) {
            storyContent = "A heavy silence falls over the battlefield as a combatant is defeated.";
        } else if (contentLower.includes("invokes") || contentLower.includes("cast")) {
            storyContent = "Magic crackles in the air, distorting reality around the caster.";
        } else if (contentLower.includes("rest")) {
            storyContent = "The party takes a moment to catch their breath, tending to wounds and preparing for the next challenge.";
        } else if (contentLower.includes("finds") || contentLower.includes("loot")) {
            storyContent = "Fortune smiles upon the adventurers as they discover something of value.";
        } else {
            // Generic fallback
             storyContent = "The situation evolves, and the adventurers must react quickly.";
        }

        // Add a bit of randomness to avoid repetitive logs
        const variations = [
            " The tension is palpable.",
            " Every moment counts.",
            " Fate hangs in the balance.",
            ""
        ];
        storyContent += variations[Math.floor(Math.random() * variations.length)];

        await prisma.logEntry.create({
            data: {
                campaignId,
                content: `[AI] ${storyContent}`,
                type: 'AI'
            }
        });

    } catch (e) {
        console.error("AI Story Generation failed:", e);
    }
}
