// PROPHET'S JOURNAL - CRITICAL LEARNINGS ONLY
// Format: ## YYYY-MM-DD - [Context] Gap: [Issue] Fix: [Solution]
// ## 2024-05-24 - [Context] Gap: [AI inventing rolls] Fix: [Added explicit TRUTH constraint]
// ## 2024-05-24 - [Context] Gap: [AI ignoring low HP] Fix: [Added MECHANICS instruction for flavor]
// ## 2024-05-24 - [Context] Gap: [AI missing NPC type] Fix: [Added [Type] to character summary]
// ## 2025-02-14 - [Context] Gap: [Missing Passive Perception] Fix: [Added PP:X to stats]

import { parseConditions, parseAttributes, parseInventory } from '@/lib/safe-json';
import { Character, LogEntry } from "@/types";

export function generateAIContext(
    logs: LogEntry[],
    characters: Character[],
    turnOrder: { name: string; init: number; current: boolean }[]
) {
    const charSummary = characters.map(c => {
        const conditions = parseConditions(c.conditions);
        // Wrap conditions in brackets for density and parsing clarity
        const conditionText = conditions.length > 0 ? `[${conditions.join(', ')}]` : 'Healthy';

        // Parse attributes if available
        const attributes = parseAttributes(c.attributes);
        const keyMap: Record<string, string> = {
            str: 'STR', dex: 'DEX', con: 'CON', int: 'INT', wis: 'WIS', cha: 'CHA'
        };
        // Dense attribute format: STR:18 DEX:12
        const attrText = Object.entries(attributes)
            .map(([k, v]) => `${keyMap[k.toLowerCase()] || k}:${v}`)
            .join(' ');

        // Calculate Passive Perception
        let wis = attributes.wis || 10;
        // Check for uppercase keys if default is returned (to handle case-sensitive JSON parsing edge cases)
        if (wis === 10) {
            const raw = attributes as Record<string, any>;
            if (typeof raw['WIS'] === 'number') wis = raw['WIS'];
            else if (typeof raw['Wisdom'] === 'number') wis = raw['Wisdom'];
        }
        const pp = 10 + Math.floor((wis - 10) / 2);

        // Parse inventory
        const inventory = parseInventory(c.inventory);
        const inventoryText = inventory.length > 0
            ? `[${inventory.slice(0, 5).join(', ')}${inventory.length > 5 ? '...' : ''}]`
            : null;

        // Combat stats group: HP:X/Y AC:Z Spd:S Init:N PP:P
        const combatStats = [
            `HP:${c.hp}/${c.maxHp}`,
            `AC:${c.armorClass}`,
            c.speed !== undefined ? `Spd:${c.speed}` : null,
            c.initiativeRoll !== undefined ? `Init:${c.initiativeRoll}` : null,
            `PP:${pp}`
        ].filter(Boolean).join(' ');

        // Construct line parts
        // Format: ▶ [ACTIVE] Name [Type] (Race Class Lvl X) | HP:X/Y AC:Z Spd:S Init:N PP:P | Cond:[...] | STR:X DEX:Y ... | Inv:[...]
        const parts = [
            `${c.activeTurn ? '▶ [ACTIVE] ' : ''}${c.name} [${c.type || '?'}] (${c.race || '?'} ${c.class || '?'} Lvl ${c.level})`,
            combatStats,
            `Cond:${conditionText}`,
            attrText ? `${attrText}` : null,
            inventoryText ? `Inv:${inventoryText}` : null
        ].filter(item => item !== null && item !== undefined && item !== '');

        return parts.join(' | ');
    }).join('\n');

    const turnSummary = turnOrder.map(t =>
        `${t.current ? '▶ ACTIVE: ' : '  '}${t.name} (Init: ${t.init})`
    ).join('\n');

    // Filter out hidden/private logs and take 5 most recent
    const filteredLogs = logs.filter(l => l.type !== 'DM_NOTE' && l.type !== 'HIDDEN');

    // Take 5 most recent logs, then reverse to show chronological order (Old -> New)
    const logSummary = filteredLogs.slice(0, 5).reverse().map(l =>
        `[${new Date(l.timestamp).toLocaleTimeString()}] ${l.content}`
    ).join('\n');

    return `== CURRENT GAME STATE ==

== INITIATIVE ==
${turnSummary}

== CHARACTERS ==
${charSummary}

== RECENT LOGS (Chronological) ==
${logSummary}

== INSTRUCTIONS ==
Role: Dungeon Master's Narrator.
Task: Narrate the [ACTIVE] character's action based on RECENT LOGS.
Context:
- [ACTIVE] = Current turn taker.
- HP/Conditions = Physical state (e.g. <50% HP is "bloodied").
- Logs = The absolute truth.
Constraints:
- Length: Max 2 sentences.
- Tone: Gritty, sensory, immediate.
- Truth: Strict adherence to logs. Do NOT invent rolls, outcomes, or dialogue not in logs.
- Focus: Describe the ACTION and its IMMEDIATE IMPACT.`;
}
