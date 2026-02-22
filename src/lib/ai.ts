
import { prisma } from "@/lib/prisma";

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";

async function callOllama(model: string, prompt: string): Promise<string | null> {
    try {
        // Timeout handling to prevent hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

        const response = await fetch(`${OLLAMA_URL}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model,
                prompt,
                stream: false,
                options: {
                    temperature: 0.7,
                    num_predict: 50 // Keep response short
                }
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            console.warn(`[AI] Ollama responded with ${response.status}: ${response.statusText}`);
            return null;
        }

        const data = await response.json();
        return data.response;
    } catch (e) {
        console.warn("[AI] Failed to connect to Ollama:", e);
        return null;
    }
}

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

        let storyContent = "";
        let usedMock = false;

        // Try Ollama first
        if (settings.ollamaModel && settings.ollamaModel !== 'mock') {
             const context = recentLogs.slice().reverse().map(l => `[${l.type}] ${l.content}`).join('\n');
            const prompt = `
You are the Dungeon Master narrator. Based on the following recent event logs from a D&D session, write a SHORT, dramatic, single-sentence narrative description of the current situation. Focus on the very last event. Do not use game mechanics terms like "roll" or "hit points" unless necessary for flavor. Keep it under 30 words.

Logs:
${context}

Narrative:
`;
            const result = await callOllama(settings.ollamaModel, prompt);
            if (result) {
                storyContent = result.trim();
            } else {
                usedMock = true;
            }
        } else {
            usedMock = true;
        }

        // Fallback to Mock Logic
        if (usedMock || !storyContent) {
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
        }

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
