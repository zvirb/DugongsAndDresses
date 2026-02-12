'use client';

// PROPHET'S JOURNAL - CRITICAL LEARNINGS ONLY
// Format: ## YYYY-MM-DD - [Context] Gap: [Issue] Fix: [Solution]
// ## 2024-05-24 - [Context] Gap: [AI inventing rolls] Fix: [Added explicit TRUTH constraint]
// ## 2024-05-24 - [Context] Gap: [AI ignoring low HP] Fix: [Added MECHANICS instruction for flavor]

import { useState } from 'react';
import { Button } from './ui/Button';
import { parseConditions, parseAttributes, parseInventory } from '@/lib/safe-json';
import { Character, LogEntry } from "@/types";

export default function AICopyButton({ logs, characters, turnOrder }: {
    logs: LogEntry[];
    characters: Character[];
    turnOrder: { name: string; init: number; current: boolean }[];
}) {
    const [copied, setCopied] = useState(false);

    const generateContext = () => {
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

            // Parse inventory
            const inventory = parseInventory(c.inventory);
            const inventoryText = inventory.length > 0
                ? `[${inventory.slice(0, 5).join(', ')}${inventory.length > 5 ? '...' : ''}]`
                : null;

            // Combat stats group: HP:X/Y AC:Z Spd:S Init:N
            const combatStats = [
                `HP:${c.hp}/${c.maxHp}`,
                `AC:${c.armorClass}`,
                c.speed !== undefined ? `Spd:${c.speed}` : null,
                c.initiativeRoll !== undefined ? `Init:${c.initiativeRoll}` : null,
            ].filter(Boolean).join(' ');

            // Construct line parts
            // Format: ▶ [ACTIVE] Name (Race Class Lvl X) | HP:X/Y AC:Z Spd:S Init:N | Cond:[...] | STR:X DEX:Y ... | Inv:[...]
            const parts = [
                `${c.activeTurn ? '▶ [ACTIVE] ' : ''}${c.name} (${c.race || '?'} ${c.class || '?'} Lvl ${c.level})`,
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
Task: Narrate the immediate action or reaction of the [ACTIVE] character based on the RECENT LOGS.
Constraints:
- Length: 2 sentences maximum.
- Style: Gritty, sensory, present tense.
- Mechanics: Interpret HP/Conditions (e.g., low HP = "winces", "favors left leg").
- Privacy: Do NOT mention "DM Note" or hidden information.
- Truth: Do NOT invent dice rolls. Only describe outcomes visible in logs.`;
    };

    const handleCopy = async () => {
        const text = generateContext();
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Button
            variant={copied ? "success" : "primary"}
            size="sm"
            onClick={handleCopy}
            className="text-xs font-bold transition-all"
        >
            {copied ? 'Copied Context!' : 'Copy AI Context'}
        </Button>
    );
}
