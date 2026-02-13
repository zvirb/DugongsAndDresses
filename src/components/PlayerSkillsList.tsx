'use client';

import { useTransition, useState } from 'react';
import { performSkillCheck } from '@/app/actions';
import { secureRoll } from '@/lib/dice';
import { calcModifier, formatModifier } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/Card';
import { Attributes } from '@/lib/schemas';
import { ATTRIBUTE_KEYS } from '@/lib/safe-json';

const ABILITY_NAMES: Record<string, string> = {
    str: 'Strength',
    dex: 'Dexterity',
    con: 'Constitution',
    int: 'Intelligence',
    wis: 'Wisdom',
    cha: 'Charisma',
};

interface PlayerSkillsListProps {
    characterId: string;
    attributes: Attributes;
}

export default function PlayerSkillsList({ characterId, attributes }: PlayerSkillsListProps) {
    const [isPending, startTransition] = useTransition();
    const [rolling, setRolling] = useState<keyof Attributes | null>(null);

    const handleRoll = (key: keyof Attributes) => {
        if (rolling || isPending) return;
        setRolling(key);

        const score = attributes[key] ?? 10;
        const mod = calcModifier(score);
        const name = ABILITY_NAMES[key] || key.toUpperCase();

        // Simulate roll delay
        setTimeout(() => {
            const die = secureRoll(20);
            const total = die + mod;

            startTransition(async () => {
                try {
                    await performSkillCheck(characterId, name, undefined, total);
                } catch (e) {
                    console.error("Skill check failed:", e);
                } finally {
                    setRolling(null);
                }
            });
        }, 600);
    };

    return (
        <div className="grid grid-cols-2 gap-4">
            {ATTRIBUTE_KEYS.map(key => {
                const score = attributes[key] ?? 10;
                const mod = calcModifier(score);
                const formattedMod = formatModifier(mod);
                const name = ABILITY_NAMES[key] || key.toUpperCase();
                const isRolling = rolling === key;

                return (
                    <button
                        key={key}
                        onClick={() => handleRoll(key)}
                        disabled={rolling !== null || isPending}
                        className="text-left w-full touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-agent-blue rounded-xl"
                    >
                        <Card variant="agent" className={`bg-agent-navy/40 border-white/5 overflow-hidden transition-all duration-200 ${isRolling ? 'border-agent-blue shadow-[0_0_15px_rgba(43,43,238,0.3)] scale-[0.98]' : 'hover:border-white/20 hover:bg-agent-navy/60 active:scale-[0.98]'}`}>
                            <CardContent className="p-4 text-center">
                                <span className="block text-[10px] text-neutral-500 uppercase font-bold tracking-widest mb-2">{name}</span>
                                {isRolling ? (
                                    <span className="block text-4xl font-black text-agent-blue animate-pulse">...</span>
                                ) : (
                                    <span className="block text-4xl font-black text-white">{score}</span>
                                )}
                                <span className={`block text-lg font-bold mt-1 ${formattedMod.startsWith('+') ? 'text-agent-blue' : 'text-red-400'}`}>
                                    {formattedMod}
                                </span>
                            </CardContent>
                        </Card>
                    </button>
                );
            })}
        </div>
    );
}
