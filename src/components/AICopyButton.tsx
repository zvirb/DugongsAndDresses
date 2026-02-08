'use client';

import { useState } from 'react';
import { Button } from './ui/Button';
import { parseConditions, parseAttributes } from '@/lib/safe-json';

type Log = {
    id: string;
    content: string;
    timestamp: Date;
    type: string;
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
            const attrText = Object.entries(attributes)
                .map(([k, v]) => `${k.toUpperCase().slice(0, 3)}:${v}`)
                .join(' ');

            // Construct line parts to avoid trailing spaces and ensure clean formatting
            const parts = [
                `- ${c.name} [${c.type}]`,
                `HP: ${c.hp}/${c.maxHp}`,
                `AC: ${c.armorClass}`,
                c.speed !== undefined ? `Spd: ${c.speed}` : null,
                `${c.race || '?'} ${c.class || '?'} (Lvl ${c.level})`,
                `Status: ${conditionText}`,
                attrText ? `[${attrText}]` : null
            ].filter(item => item !== null && item !== undefined && item !== '');

            return parts.join(' | ');
        }).join('\n');

        const turnSummary = turnOrder.map(t =>
            `${t.current ? '▶ ACTIVE: ' : '  '}${t.name} (Init: ${t.init})`
        ).join('\n');

        // Take 5 most recent logs, then reverse to show chronological order (Old -> New)
        const logSummary = logs.slice(0, 5).reverse().map(l =>
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
Based on the current state, suggest a brief narrative description of the scene or the next DM prompt.
Tone: Technical Fantasy (concise, action-oriented).
Focus on the ACTIVE turn and recent events.`;
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
