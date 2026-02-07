'use client';

import { useState } from 'react';
import { Button } from './ui/Button';

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
            const conditionText = c.conditions === '[]' ? 'Healthy' : c.conditions;
            const details = [
                `AC ${c.armorClass}`,
                `${c.race || 'Unknown'} ${c.class || 'Unknown'} Lvl ${c.level}`
            ].join(' | ');

            return `- ${c.name} (${c.type}): ${c.hp}/${c.maxHp} HP | ${details} | [${conditionText}]`;
        }).join('\n');

        const turnSummary = turnOrder.map(t =>
            `${t.current ? '-> ' : '   '}${t.name} (Init: ${t.init})`
        ).join('\n');

        const logSummary = logs.slice(0, 5).map(l =>
            `- [${new Date(l.timestamp).toLocaleTimeString()}] ${l.content}`
        ).join('\n');

        return `Current Game State:
    
== INITIATIVE ORDER ==
${turnSummary}

== CHARACTERS ==
${charSummary}

== RECENT LOGS ==
${logSummary}

== INSTRUCTIONS ==
Given the above context, suggest the next narrative beat or DM response.`;
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