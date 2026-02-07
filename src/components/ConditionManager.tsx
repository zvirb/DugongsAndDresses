'use client';

import { useState, useEffect, useRef } from 'react';
import { updateConditions } from '@/app/actions';
import { Badge } from '@/components/ui/Badge';

const DND_CONDITIONS = [
    'Blinded', 'Charmed', 'Deafened', 'Frightened', 'Grappled',
    'Incapacitated', 'Invisible', 'Paralyzed', 'Petrified',
    'Poisoned', 'Prone', 'Restrained', 'Stunned', 'Unconscious',
];

interface ConditionManagerProps {
    characterId: string;
    conditions: string[];
}

export default function ConditionManager({ characterId, conditions }: ConditionManagerProps) {
    const [showDropdown, setShowDropdown] = useState(false);
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

    const addCondition = async (condition: string) => {
        await updateConditions(characterId, [...conditions, condition]);
        setShowDropdown(false);
    };

    const removeCondition = async (condition: string) => {
        await updateConditions(characterId, conditions.filter(c => c !== condition));
    };

    return (
        <div className="space-y-1">
            <div className="flex flex-wrap gap-1">
                {conditions.length === 0 && (
                    <span className="text-xs text-neutral-500">Normal</span>
                )}
                {conditions.map(c => (
                    <button
                        key={c}
                        onClick={() => removeCondition(c)}
                        title={`Remove ${c}`}
                        className="cursor-pointer"
                    >
                        <Badge variant="destructive" className="text-[10px] hover:opacity-70 transition-opacity">
                            {c} &times;
                        </Badge>
                    </button>
                ))}
            </div>
            <div className="relative" ref={dropdownRef}>
                <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="text-[10px] text-agent-blue hover:text-blue-300 transition-colors"
                >
                    + condition
                </button>
                {showDropdown && available.length > 0 && (
                    <div className="absolute z-50 top-5 left-0 bg-neutral-900 border border-neutral-700 rounded-md shadow-lg max-h-40 overflow-y-auto w-36">
                        {available.map(c => (
                            <button
                                key={c}
                                onClick={() => addCondition(c)}
                                className="block w-full text-left px-3 py-1.5 text-xs text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors"
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
