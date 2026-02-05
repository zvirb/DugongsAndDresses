'use client';

import { useState } from 'react';

type Log = {
    id: string;
    content: string;
    timestamp: Date;
};

type Character = {
    id: string;
    name: string;
    hp: number;
    maxHp: number;
    type: string; // "PLAYER" | "NPC"
    conditions: string;
};

export default function AICopyButton({ logs, characters, turnOrder }: {
    logs: Log[];
    characters: Character[];
    turnOrder: { name: string; init: number; current: boolean }[];
}) {
    const [copied, setCopied] = useState(false);

    const generateContext = () => {
        const charSummary = characters.map(c =>
            `- ${c.name} (${c.type}): ${c.hp}/${c.maxHp} HP [${c.conditions === '[]' ? 'Healthy' : c.conditions}]`
        ).join('\n');

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
        <button
            onClick={handleCopy}
            className={`text-xs px-3 py-1 rounded font-bold transition-all ${copied
                ? 'bg-green-600 text-white'
                : 'bg-indigo-600 hover:bg-indigo-500 text-indigo-100'
                }`}
        >
            {copied ? 'Copied Context!' : 'Copy AI Context'}
        </button>
    );
}
