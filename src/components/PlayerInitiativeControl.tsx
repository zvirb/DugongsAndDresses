'use client';

import { useTransition } from 'react';
import { updateInitiative } from '@/app/actions';
import { secureRoll } from '@/lib/dice';
import { Button } from '@/components/ui/Button';

interface PlayerInitiativeControlProps {
    characterId: string;
    characterName: string;
    initiativeRoll: number;
    initiativeBonus: number;
}

export default function PlayerInitiativeControl({ characterId, characterName, initiativeRoll, initiativeBonus }: PlayerInitiativeControlProps) {
    const [isPending, startTransition] = useTransition();

    const handleRoll = () => {
        // Simulate roll delay? Maybe not for initiative, people want it fast.
        const die = secureRoll(20);
        const total = die + initiativeBonus;

        startTransition(async () => {
            try {
                await updateInitiative(characterId, total);
            } catch (e) {
                console.error("Failed to roll initiative:", e);
            }
        });
    };

    if (initiativeRoll > 0) {
        return (
            <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex items-center justify-between shadow-[0_0_15px_rgba(43,43,238,0.1)]">
                <span className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest">Initiative</span>
                <div className="text-right">
                    <span className="text-2xl font-black text-agent-blue">{initiativeRoll}</span>
                    <span className="text-xs text-neutral-500 ml-1">(Rolled)</span>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-agent-navy/40 rounded-2xl p-4 border border-agent-blue/30 shadow-[0_0_20px_rgba(43,43,238,0.2)] animate-pulse">
            <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-agent-blue uppercase font-bold tracking-widest">Combat Status</span>
                <span className="text-[10px] text-white font-mono uppercase">Awaiting Input</span>
            </div>
            <Button
                onClick={handleRoll}
                disabled={isPending}
                variant="agent"
                className="w-full font-black uppercase tracking-widest h-12 text-lg"
            >
                {isPending ? 'Rolling...' : 'Roll Initiative'}
            </Button>
        </div>
    );
}
