'use client';

// PROPHET'S JOURNAL - CRITICAL LEARNINGS ONLY
// Format: ## YYYY-MM-DD - [Context] Gap: [Issue] Fix: [Solution]
// ## 2024-05-24 - [Context] Gap: [AI inventing rolls] Fix: [Added explicit TRUTH constraint]
// ## 2024-05-24 - [Context] Gap: [AI ignoring low HP] Fix: [Added MECHANICS instruction for flavor]
// ## 2024-05-24 - [Context] Gap: [AI missing NPC type] Fix: [Added [Type] to character summary]

import { useState } from 'react';
import { Button } from './ui/Button';
import { Character, LogEntry } from "@/types";
import { generateAIContext } from '@/lib/aiContext';

export default function AICopyButton({ logs, characters, turnOrder }: {
    logs: LogEntry[];
    characters: Character[];
    turnOrder: { name: string; init: number; current: boolean }[];
}) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        const text = generateAIContext(logs, characters, turnOrder);
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
