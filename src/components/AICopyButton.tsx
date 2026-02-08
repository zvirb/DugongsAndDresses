'use client';

import { useState } from 'react';
import { Button } from './ui/Button';
import { parseConditions } from '@/lib/safe-json';

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

            const details = [
                `AC: ${c.armorClass}`,
                `${c.race || '?'} ${c.class || '?'} (Lvl ${c.level})`
            ].join(' | ');

            return `- ${c.name} [${c.type}] | HP: ${c.hp}/${c.maxHp} | ${details} | Status: ${conditionText}`;
        }).join('\n');

        const turnSummary = turnOrder.map(t =>
            `${t.current ? '▶ ACTIVE: ' : '  '}${t.name} (Init: ${t.init})`
        ).join('\n');

        const logSummary = logs.slice(0, 5).map(l =>
            `- [${new Date(l.timestamp).toLocaleTimeString()}] ${l.content}`
        ).join('\n');

        return `Current Game State:
    
== INITIATIVE ORDER ==
${turnSummary}

== CHARACTERS ==
${charSummary}

== RECENT LOGS (Newest Last) ==
${logSummary}

== INSTRUCTIONS ==
Based on the current state, suggest a brief narrative description of the scene or the next DM prompt. Keep it concise.`;
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
