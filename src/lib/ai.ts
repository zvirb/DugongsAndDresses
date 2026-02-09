
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

        // Simple rules-based generation
        if (lastLog.content.includes("attacks")) {
            storyContent = "The clash of steel rings out as the battle intensifies.";
        } else if (lastLog.content.includes("enters the fray")) {
            storyContent = "A new challenger approaches, changing the dynamic of the encounter.";
        } else if (lastLog.content.includes("fallen")) {
            storyContent = "A heavy silence falls over the battlefield as a combatant is defeated.";
        } else if (lastLog.content.includes("invokes")) {
            storyContent = "Magic crackles in the air, distorting reality around the caster.";
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
