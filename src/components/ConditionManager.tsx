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
                    <span className="text-xs text-neutral-500">Normal</span>
                )}
                {conditions.map(c => (
                    <button
                        key={c}
                        onClick={() => removeCondition(c)}
                        disabled={isPending}
                        title={`Remove ${c}`}
                        className="cursor-pointer disabled:opacity-50"
                    >
                        <Badge variant="destructive" className="text-[10px] hover:opacity-70 transition-opacity">
                            {c} &times;
                        </Badge>
                    </button>
                ))}
                {conditions.length > 0 && (
                    <button
                        onClick={clearAll}
                        disabled={isPending}
                        className="text-[10px] text-red-400 hover:text-red-300 transition-colors ml-1 disabled:opacity-50 border border-red-900/50 bg-red-900/20 px-1.5 py-0.5 rounded hover:bg-red-900/40"
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
                    className="text-[10px] text-agent-blue hover:text-blue-300 transition-colors disabled:opacity-50"
                >
                    + condition
                </button>
                {showDropdown && available.length > 0 && (
                    <div className="absolute z-50 top-5 left-0 bg-neutral-900 border border-neutral-700 rounded-md shadow-lg max-h-40 overflow-y-auto w-36">
                        {available.map(c => (
                            <button
                                key={c}
                                onClick={() => addCondition(c)}
                                disabled={isPending}
                                className="block w-full text-left px-3 py-1.5 text-xs text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors disabled:opacity-50"
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
