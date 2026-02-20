// PROPHET'S JOURNAL - CRITICAL LEARNINGS ONLY
// Format: ## YYYY-MM-DD - [Context] Gap: [Issue] Fix: [Solution]
// ## 2024-05-24 - [Context] Gap: [AI inventing rolls] Fix: [Added explicit TRUTH constraint]
// ## 2024-05-24 - [Context] Gap: [AI ignoring low HP] Fix: [Added MECHANICS instruction for flavor]
// ## 2024-05-24 - [Context] Gap: [AI missing NPC type] Fix: [Added [Type] to character summary]
// ## 2025-02-14 - [Context] Gap: [Missing Passive Perception] Fix: [Added PP:X to stats]
// ## 2025-05-21 - [Context] Gap: [AI missed active turn] Fix: [Added 'CURRENT' marker and extra attributes]
// ## 2025-05-27 - [Context] Gap: [AI missed downed status] Fix: [Added 'DOWN' marker to conditions and optimized timestamp]
// ## 2025-05-29 - [Context] Gap: [Missing HP Context, Crowded Stats] Fix: [Added HP%, Separated Resources, Refined Instructions]
// ## 2025-05-30 - [Context] Gap: [Verbose context, unstructured data] Fix: [Condensed stats/res into brackets, optimized instructions for density]
// ## 2025-06-05 - [Context] Gap: [Missing string attributes] Fix: [Switched to raw JSON parsing to include textual traits]
// ## 2025-06-05 - [Context] Gap: [Verbose Instructions] Fix: [Tightened instructions for better token efficiency]

import { parseConditions, parseInventory, parseAttributes } from '@/lib/safe-json';
import { Character, LogEntry } from "@/types";

export function generateAIContext(
    logs: LogEntry[],
    characters: Character[],
    turnOrder: { name: string; init: number; current: boolean }[]
) {
    const charSummary = characters.map(c => {
        const conditions = parseConditions(c.conditions);

        // Auto-detect downed state if HP <= 0
        if (c.hp <= 0 && !conditions.some(cond => ['unconscious', 'down', 'dead', 'dying'].includes(cond.toLowerCase()))) {
            conditions.push('DOWN');
        }

        // Wrap conditions in brackets for density and parsing clarity
        const conditionText = conditions.length > 0 ? `[${conditions.join(', ')}]` : 'Healthy';

        // Use parseAttributes which now supports string values in catchall
        const attributes = parseAttributes(c.attributes);

        const keyMap: Record<string, string> = {
            str: 'STR', dex: 'DEX', con: 'CON', int: 'INT', wis: 'WIS', cha: 'CHA'
        };

        const standardStats = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

        // Standard stats first (using default 10 if missing/invalid)
        const standardAttrText = standardStats
            .map(k => {
                const val = attributes[k as keyof typeof attributes];
                const numVal = typeof val === 'number' ? val : (parseInt(String(val)) || 10);
                return `${keyMap[k]}:${numVal}`;
            })
            .join(' ');

        // Extra stats (Spell Slots, Ki, Class Features, etc)
        // Now includes strings as well as numbers
        const extraStats = Object.entries(attributes)
            .filter(([k]) => !standardStats.includes(k.toLowerCase()))
            .filter(([_, v]) => typeof v === 'number' || (typeof v === 'string' && v.trim().length > 0))
            .map(([k, v]) => {
                // Capitalize first letter of key (e.g. spellSlots -> SpellSlots)
                const cleanKey = k.charAt(0).toUpperCase() + k.slice(1);
                return `${cleanKey}:${v}`;
            })
            .join(' ');

        // Calculate Passive Perception
        let wis = 10;
        if (typeof attributes['wis'] === 'number') wis = attributes['wis'];
        else if (typeof attributes['wis'] === 'string') wis = parseInt(attributes['wis']) || 10;

        // Check for uppercase keys if default is returned (to handle case-sensitive JSON parsing edge cases)
        if (wis === 10) {
             if (typeof attributes['WIS'] === 'number') wis = attributes['WIS'];
             else if (typeof attributes['Wisdom'] === 'number') wis = attributes['Wisdom'];
        }
        const pp = 10 + Math.floor((wis - 10) / 2);

        // Parse inventory
        const inventory = parseInventory(c.inventory);
        const inventoryText = inventory.length > 0
            ? `[${inventory.slice(0, 5).join(', ')}${inventory.length > 5 ? '...' : ''}]`
            : null;

        // HP Percentage
        const hpPercent = c.maxHp > 0 ? Math.floor((c.hp / c.maxHp) * 100) : 0;

        // Combat stats group: HP:X/Y (Z%) AC:Z Spd:S Init:N PP:P
        const combatStats = [
            `HP:${c.hp}/${c.maxHp} (${hpPercent}%)`,
            `AC:${c.armorClass}`,
            c.speed !== undefined ? `Spd:${c.speed}` : null,
            c.initiativeRoll !== undefined ? `Init:${c.initiativeRoll}` : null,
            `PP:${pp}`
        ].filter(Boolean).join(' ');

        // Construct line parts
        // Format: ▶ [ACTIVE] Name [Type] (Race Class Lvl X) | HP:X/Y (Z%) AC:Z Spd:S Init:N PP:P | Cond:[...] | Stats:[STR:X ...] | Res:[SpellSlots:N ...] | Inv:[...]
        const parts = [
            `${c.activeTurn ? '▶ [ACTIVE] ' : ''}${c.name} [${c.type || '?'}] (${c.race || '?'} ${c.class || '?'} Lvl ${c.level})`,
            combatStats,
            `Cond:${conditionText}`,
            `Stats:[${standardAttrText}]`,
            extraStats ? `Res:[${extraStats}]` : null,
            inventoryText ? `Inv:${inventoryText}` : null
        ].filter(item => item !== null && item !== undefined && item !== '');

        return parts.join(' | ');
    }).join('\n');

    const turnSummary = turnOrder.map(t =>
        `${t.current ? '▶ [CURRENT] ' : '  '}${t.name} (Init: ${t.init})`
    ).join('\n');

    // Filter out hidden/private logs and take 5 most recent
    const filteredLogs = logs.filter(l => l.type !== 'DM_NOTE' && l.type !== 'HIDDEN');

    // Take 5 most recent logs, then reverse to show chronological order (Old -> New)
    const logSummary = filteredLogs.slice(0, 5).reverse().map(l =>
        `[${new Date(l.timestamp).toLocaleTimeString('en-US', { hour12: false })}] ${l.content}`
    ).join('\n');

    return `== CURRENT GAME STATE ==

== INITIATIVE ==
${turnSummary}

== CHARACTERS ==
${charSummary}

== RECENT LOGS (Chronological) ==
${logSummary}

== INSTRUCTIONS ==
Role: Fantasy Combat Narrator.
Objective: Narrate the latest action of the [ACTIVE] character using the RECENT LOGS.
Context:
- [ACTIVE]: The character currently acting.
- HP%: <50% is "bloodied", 0% is "down/dying".
- Logs: The source of truth for actions/rolls.
Guidelines:
- Brevity: Max 2 sentences. Punchy.
- Style: Visceral, sensory, present-tense.
- Accuracy: Reflect the mechanics (Attack/Damage/Save) in the logs. Do not hallucinate extra attacks.
- Status: Mention condition changes (e.g. falling unconscious) if they appear in logs.`;
}
