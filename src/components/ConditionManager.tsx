'use client';

import { useState, useEffect, useRef, useTransition } from 'react';
import { toggleCondition, updateConditions } from '@/app/actions';
import { Badge } from '@/components/ui/Badge';
import { DND_CONDITIONS } from '@/lib/schemas';

interface ConditionManagerProps {
    characterId: string;
    conditions: string[];
}

export default function ConditionManager({ characterId, conditions }: ConditionManagerProps) {
    const [showDropdown, setShowDropdown] = useState(false);
    const [isPending, startTransition] = useTransition();
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!showDropdown) return;
        const handleClick = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [showDropdown]);

    const available = DND_CONDITIONS.filter(c => !conditions.includes(c));

    const addCondition = (condition: string) => {
        startTransition(async () => {
            await toggleCondition(characterId, condition);
            setShowDropdown(false);
        });
    };

    const removeCondition = (condition: string) => {
        startTransition(async () => {
            await toggleCondition(characterId, condition);
        });
    };

    const clearAll = () => {
        startTransition(async () => {
            await updateConditions(characterId, []);
        });
    };

    return (
        <div className="space-y-1">
            <div className="flex flex-wrap gap-1 items-center">
                {conditions.length === 0 && (
                    <span className="text-[10px] text-agent-blue/40 font-mono uppercase tracking-wider">Status: Normal</span>
                )}
                {conditions.map(c => (
                    <button
                        key={c}
                        onClick={() => removeCondition(c)}
                        disabled={isPending}
                        title={`Remove ${c}`}
                        className="cursor-pointer disabled:opacity-50 group"
                    >
                        <Badge variant="destructive" className="text-[10px] group-hover:bg-red-900 group-hover:text-white transition-all shadow-[0_0_5px_rgba(220,38,38,0.3)] group-hover:shadow-[0_0_10px_rgba(220,38,38,0.6)]">
                            {c} <span className="ml-1 opacity-50 group-hover:opacity-100">&times;</span>
                        </Badge>
                    </button>
                ))}
                {conditions.length > 0 && (
                    <button
                        onClick={clearAll}
                        disabled={isPending}
                        className="text-[10px] font-bold text-red-400 hover:text-white transition-all ml-1 disabled:opacity-50 border border-red-900/50 bg-red-900/10 px-2 py-0.5 rounded hover:bg-red-900/60 shadow-[0_0_5px_rgba(220,38,38,0.2)] hover:shadow-[0_0_15px_rgba(220,38,38,0.5)] uppercase tracking-wider"
                        title="Clear All Conditions"
                    >
                        Clear
                    </button>
                )}
            </div>
            <div className="relative" ref={dropdownRef}>
                <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    disabled={isPending}
                    className="text-[10px] font-mono text-agent-blue/60 hover:text-agent-blue transition-colors disabled:opacity-50 flex items-center gap-1 uppercase tracking-wider border border-transparent hover:border-agent-blue/20 rounded px-1 -ml-1"
                >
                    <span className="text-lg leading-none mb-0.5">+</span> Add Condition
                </button>
                {showDropdown && available.length > 0 && (
                    <div className="absolute z-50 top-6 left-0 bg-agent-navy/95 backdrop-blur-md border border-agent-blue shadow-[0_0_30px_rgba(43,43,238,0.4)] rounded-md max-h-48 overflow-y-auto w-40 animate-in fade-in zoom-in-95 duration-100 scrollbar-thin scrollbar-thumb-agent-blue/30 scrollbar-track-transparent">
                        <div className="sticky top-0 bg-agent-navy/95 border-b border-agent-blue/20 p-1 mb-1 backdrop-blur-md z-10">
                            <div className="text-[8px] font-bold text-agent-blue/50 uppercase tracking-widest text-center">Select Condition</div>
                        </div>
                        {available.map(c => (
                            <button
                                key={c}
                                onClick={() => addCondition(c)}
                                disabled={isPending}
                                className="block w-full text-left px-3 py-1.5 text-xs font-mono text-agent-blue hover:bg-agent-blue/20 hover:text-white transition-all disabled:opacity-50 border-l-2 border-transparent hover:border-agent-blue focus:outline-none focus:bg-agent-blue/20"
                            >
                                {c}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
