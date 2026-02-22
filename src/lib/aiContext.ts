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
// ## 2025-06-06 - [Context] Gap: [String attributes like '1st Level' coerced to 1] Fix: [Modified AttributesSchema to use strict Number() check for non-core stats]
// ## 2025-06-06 - [Context] Gap: [Inconsistent terminology and fluff] Fix: [Standardized ACTIVE marker, optimized instructions, cleaned up extra stats formatting]
// ## 2026-02-05 - [Context] Gap: [Buried active turn] Fix: [Added top-level == ACTIVE TURN == section]
// ## 2026-02-05 - [Context] Gap: [Duplicate initiative data] Fix: [Streamlined INITIATIVE list, enriched CHARACTERS list]
// ## 2026-02-05 - [Context] Gap: [Potential null/undefined values] Fix: [Added safe fallbacks for race, class, type, speed]
// ## 2026-02-06 - [Context] Gap: [Missing active details] Fix: [Added PP/Slots to active turn, denser stats, stricter instructions]

import { parseConditions, parseInventory, parseAttributes } from '@/lib/safe-json';
import { Character, LogEntry } from "@/types";

export function generateAIContext(
    logs: LogEntry[],
    characters: Character[],
    turnOrder: { name: string; init: number; current: boolean }[]
) {
    // 1. Identify Active Character
    const activeChar = characters.find(c => c.activeTurn);
    let activeTurnSection = "None";

    if (activeChar) {
        const conditions = parseConditions(activeChar.conditions);
        // Auto-detect downed state if HP <= 0
        if (activeChar.hp <= 0 && !conditions.some(cond => ['unconscious', 'down', 'dead', 'dying'].includes(cond.toLowerCase()))) {
            conditions.push('DOWN');
        }
        const conditionText = conditions.length > 0 ? `[${conditions.join(', ')}]` : 'Healthy';
        const hpPercent = activeChar.maxHp > 0 ? Math.floor((activeChar.hp / activeChar.maxHp) * 100) : 0;

        const type = activeChar.type || '?';
        const race = activeChar.race || '?';
        const cls = activeChar.class || '?';
        const speed = activeChar.speed !== null && activeChar.speed !== undefined ? activeChar.speed : '?';

        const attributes = parseAttributes(activeChar.attributes);
        // Passive Perception
        let wis = 10;
        if (typeof attributes['wis'] === 'number') wis = attributes['wis'];
        else if (typeof attributes['wis'] === 'string') wis = parseInt(attributes['wis']) || 10;
        // Fallback checks
        if (wis === 10) {
             if (typeof attributes['WIS'] === 'number') wis = attributes['WIS'];
             else if (typeof attributes['Wisdom'] === 'number') wis = attributes['Wisdom'];
        }
        const pp = 10 + Math.floor((wis - 10) / 2);

        // Extra Resources (Spell Slots, Ki, etc.)
        const extraStats = Object.entries(attributes)
            .filter(([k]) => !['str', 'dex', 'con', 'int', 'wis', 'cha'].includes(k.toLowerCase()))
            .filter(([_, v]) => typeof v === 'number' || (typeof v === 'string' && v.trim().length > 0))
            .map(([k, v]) => {
                const cleanKey = (k.charAt(0).toUpperCase() + k.slice(1)).replace(/_/g, ' ');
                return `${cleanKey}:${v}`;
            })
            .join(', ');

        activeTurnSection = `▶ ${activeChar.name} (${activeChar.level} ${race} ${cls})
HP: ${activeChar.hp}/${activeChar.maxHp} (${hpPercent}%) | AC: ${activeChar.armorClass} | PP: ${pp} | Spd: ${speed}
Conditions: ${conditionText}
${extraStats ? `Resources: [${extraStats}]` : ''}`.trim();
    }

    // 2. Initiative List (Concise)
    const initiativeList = turnOrder.map(t =>
        `${t.init.toString().padStart(2, '0')}: ${t.name}${t.current ? ' ◀ ACTIVE' : ''}`
    ).join('\n');

    // 3. Character Details (Dense)
    const charDetails = characters.map(c => {
        const conditions = parseConditions(c.conditions);
        if (c.hp <= 0 && !conditions.some(cond => ['unconscious', 'down', 'dead', 'dying'].includes(cond.toLowerCase()))) {
            conditions.push('DOWN');
        }
        const conditionText = conditions.length > 0 ? `Cond:[${conditions.join(',')}]` : 'Healthy';
        const attributes = parseAttributes(c.attributes);

        // Core Stats (Compressed)
        const coreStatsMap: Record<string, string> = { str: 'S', dex: 'D', con: 'C', int: 'I', wis: 'W', cha: 'Ch' };
        const coreStats = ['str', 'dex', 'con', 'int', 'wis', 'cha']
            .map(k => {
                const val = attributes[k as keyof typeof attributes];
                const numVal = typeof val === 'number' ? val : (parseInt(String(val)) || 10);
                return `${coreStatsMap[k]}:${numVal}`;
            })
            .join(' ');

        // Extra Resources
        const extraStats = Object.entries(attributes)
            .filter(([k]) => !['str', 'dex', 'con', 'int', 'wis', 'cha'].includes(k.toLowerCase()))
            .filter(([_, v]) => typeof v === 'number' || (typeof v === 'string' && v.trim().length > 0))
            .map(([k, v]) => {
                const cleanKey = (k.charAt(0).toUpperCase() + k.slice(1)).replace(/_/g, ' ');
                return `${cleanKey}:${v}`;
            })
            .join(' ');

        // Passive Perception
        let wis = 10;
        if (typeof attributes['wis'] === 'number') wis = attributes['wis'];
        else if (typeof attributes['wis'] === 'string') wis = parseInt(attributes['wis']) || 10;
        if (wis === 10) {
             if (typeof attributes['WIS'] === 'number') wis = attributes['WIS'];
             else if (typeof attributes['Wisdom'] === 'number') wis = attributes['Wisdom'];
        }
        const pp = 10 + Math.floor((wis - 10) / 2);

        // Inventory (First 5)
        const inventory = parseInventory(c.inventory);
        const invText = inventory.length > 0
            ? `Inv:[${inventory.slice(0, 5).join(',')}${inventory.length > 5 ? '...' : ''}]`
            : '';

        const hpPercent = c.maxHp > 0 ? Math.floor((c.hp / c.maxHp) * 100) : 0;
        const type = c.type || '?';

        // Single Line Format
        return `• ${c.name} (${type}) | HP:${c.hp}/${c.maxHp} (${hpPercent}%) AC:${c.armorClass} PP:${pp} | ${conditionText} | ${coreStats} | ${extraStats ? `Res:[${extraStats}] ` : ''}${invText}`;
    }).join('\n');

    // 4. Logs (Chronological)
    const filteredLogs = logs.filter(l => l.type !== 'DM_NOTE' && l.type !== 'HIDDEN');
    const logSummary = filteredLogs.slice(0, 5).reverse().map(l =>
        `[${new Date(l.timestamp).toLocaleTimeString('en-US', { hour12: false })}] ${l.content}`
    ).join('\n');

    return `== ACTIVE TURN ==
${activeTurnSection}

== INITIATIVE ==
${initiativeList}

== CHARACTERS ==
${charDetails}

== RECENT LOGS ==
${logSummary}

== INSTRUCTIONS ==
Role: Narrator. Task: Describe [ACTIVE]'s action based on Logs.
Context:
- [ACTIVE]: Current turn.
- HP%: <50% (Bloodied), 0% (Down/Unconscious).
- Logs: Truth. Do not hallucinate rolls.
Rules:
- Max 2 sentences. Present tense. Visceral.
- Mention mechanics (Attack/Damage/DC) naturally.
- Highlight condition changes (e.g. "Knocked prone").`;
}
