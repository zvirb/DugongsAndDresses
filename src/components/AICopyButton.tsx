'use client';

import { useState } from 'react';
import { Button } from './ui/Button';
import { parseConditions, parseAttributes, parseInventory } from '@/lib/safe-json';

type Log = {
    id: string;
    content: string;
    timestamp: Date;
    type?: string;
};

type Character = {
    id: string;
    name: string;
    hp: number;
    maxHp: number;
    type: string; // "PLAYER" | "NPC"
    conditions: string;
    armorClass: number;
    level: number;
    class: string | null;
    race: string | null;
    attributes?: string; // JSON string
    speed?: number;
    inventory?: string; // JSON string
    activeTurn?: boolean;
    initiativeRoll?: number;
};

export default function AICopyButton({ logs, characters, turnOrder }: {
    logs: Log[];
    characters: Character[];
    turnOrder: { name: string; init: number; current: boolean }[];
}) {
    const [copied, setCopied] = useState(false);

    const generateContext = () => {
        const charSummary = characters.map(c => {
            const conditions = parseConditions(c.conditions);
            const conditionText = conditions.length > 0 ? conditions.join(', ') : 'Healthy';

            // Parse attributes if available
            const attributes = parseAttributes(c.attributes);
            const keyMap: Record<string, string> = {
                str: 'STR', dex: 'DEX', con: 'CON', int: 'INT', wis: 'WIS', cha: 'CHA'
            };
            const attrText = Object.entries(attributes)
                .map(([k, v]) => `${keyMap[k.toLowerCase()] || k}: ${v}`)
                .join(', ');

            // Parse inventory
            const inventory = parseInventory(c.inventory);
            const inventoryText = inventory.length > 0
                ? inventory.slice(0, 5).join(', ') + (inventory.length > 5 ? '...' : '')
                : null;

            // Construct line parts to avoid trailing spaces and ensure clean formatting
            // Format: ▶ [ACTIVE] Name [Type] (Race Class Lvl) | HP: X/Y | AC: Z | Init: N | Spd: S | Cond: ... | Attrs: ... | Inv: ...
            const parts = [
                `${c.activeTurn ? '▶ [ACTIVE] ' : ''}${c.name} [${c.type}] (${c.race || '?'} ${c.class || '?'} Lvl ${c.level})`,
                `HP: ${c.hp}/${c.maxHp}`,
                `AC: ${c.armorClass}`,
                c.initiativeRoll !== undefined ? `Init: ${c.initiativeRoll}` : null,
                c.speed !== undefined ? `Spd: ${c.speed}` : null,
                `Cond: ${conditionText}`,
                attrText ? `Attrs: ${attrText}` : null,
                inventoryText ? `Inv: ${inventoryText}` : null
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
            `- [${new Date(l.timestamp).toLocaleTimeString()}] ${l.content}`
        ).join('\n');

        return `== CURRENT GAME STATE ==
    
== INITIATIVE ==
${turnSummary}

== CHARACTERS ==
${charSummary}

== RECENT LOGS (Chronological) ==
${logSummary}

== INSTRUCTIONS ==
Analyze the Game State to generate the next DM narration.
1. Narrative Focus: Prioritize the [ACTIVE] character's action and the immediate consequences of RECENT LOGS.
2. Tone: Technical Fantasy (grit, tactical, sensory details).
3. Mechanics: Use HP, AC, and Conditions to describe damage or status effects (e.g., "bloodied", "staggering").
4. Output: A concise, punchy paragraph (2-3 sentences max) driving the action forward. Do not resolve actions that require a roll unless the result is in the logs.`;
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
