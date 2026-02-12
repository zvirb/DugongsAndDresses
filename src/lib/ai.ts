
import { prisma } from "@/lib/prisma";

export async function generateStory(campaignId: string) {
    try {
        const settings = await prisma.settings.findFirst();
        if (!settings || !settings.enableStoryGen) return;

        // Fetch recent logs to generate context
        const recentLogs = await prisma.logEntry.findMany({
            where: { campaignId },
            orderBy: { timestamp: 'desc' },
            take: 10
        });

        if (recentLogs.length === 0) return;

        const lastLog = recentLogs[0];
        // Prevent infinite loop if the last log was already AI generated
        if (lastLog.type === 'AI') return;

        // Construct prompt
        const logContext = recentLogs.reverse().map(l => `[${l.type}] ${l.content}`).join('\n');
        const prompt = `You are the Dungeon Master narrator. Based on these recent game logs, describe the scene in one or two sentences. Focus on the action and atmosphere. Do not use game mechanics terms like "HP" or "Roll". Keep it brief.\n\nLogs:\n${logContext}\n\nNarrative:`;

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

            let response;
            try {
                // Default to localhost, but could be configurable in future
                response = await fetch("http://127.0.0.1:11434/api/generate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        model: settings.ollamaModel,
                        prompt: prompt,
                        stream: false,
                        options: {
                            temperature: 0.7,
                            num_predict: 100 // Limit output length
                        }
                    }),
                    signal: controller.signal
                });
            } finally {
                clearTimeout(timeoutId);
            }

            if (!response || !response.ok) {
                throw new Error(`Ollama API error: ${response?.statusText || 'Unknown error'}`);
            }

            const data = await response.json();
            const storyContent = data.response.trim();

            if (storyContent) {
                 await prisma.logEntry.create({
                    data: {
                        campaignId,
                        content: `[AI] ${storyContent}`,
                        type: 'AI'
                    }
                });
            }

        } catch (fetchError) {
            // Silently fail if AI service is offline, but log for debugging
            console.error("Ollama connection failed/timed out. Ensure Ollama is running on port 11434.");
        }

    } catch (e) {
        console.error("AI Story Generation failed:", e);
    }
}
