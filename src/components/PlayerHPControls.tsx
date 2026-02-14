'use client';

import { updateHP } from "@/app/actions";
import { useTransition, useState, useEffect } from "react";
import { Button } from "./ui/Button";

export default function PlayerHPControls({ characterId, currentHp, maxHp }: { characterId: string, currentHp: number, maxHp: number }) {
    const [isPending, startTransition] = useTransition();
    const [optimisticHp, setOptimisticHp] = useState(currentHp);

    useEffect(() => {
        setOptimisticHp(currentHp);
    }, [currentHp]);

    const handleUpdate = (amount: number) => {
        const newHp = optimisticHp + amount;
        // Allow dropping below 0 locally for feedback, though server might restrict or logic might differ.
        // But usually HP stops at 0. Let's clamp at 0 for display safety.
        // Actually D&D allows negative for death saves context, but here let's stick to 0 min for bar.
        // The previous code had `if (currentHp + amount < 0) return;`.
        if (newHp < 0) return;
        if (newHp > maxHp * 2) return; // Cap at 2x max health

        const previousHp = optimisticHp;
        setOptimisticHp(newHp);
        
        startTransition(async () => {
            try {
                const result = await updateHP(characterId, amount);
                if (!result.success) {
                    // Revert on server error
                    setOptimisticHp(previousHp);
                    console.error("Failed to update HP:", result.error);
                }
            } catch (error) {
                // Revert on network/unexpected error
                setOptimisticHp(previousHp);
                console.error("Unexpected error updating HP:", error);
            }
        });
    };

    const hpPercentage = (optimisticHp / maxHp) * 100;
    const hpColorClass = optimisticHp <= maxHp * 0.2
        ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]'
        : optimisticHp <= maxHp * 0.5
            ? 'bg-amber-500'
            : 'bg-agent-blue';

    return (
        <div className="space-y-6">
            {/* Vitality Display (Optimistic) */}
            <div className="space-y-4">
                <div className="flex justify-between items-baseline mb-2">
                    <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Vitality</span>
                    <div className="text-right">
                        <span className="text-5xl font-black italic tracking-tighter">{optimisticHp}</span>
                        <span className="text-xl text-neutral-600 font-medium ml-1">/ {maxHp}</span>
                    </div>
                </div>

                {/* Health Bar */}
                <div className="h-4 bg-white/5 rounded-full overflow-hidden p-1 border border-white/10">
                    <div
                        className={`h-full rounded-full transition-all duration-500 ${hpColorClass}`}
                        style={{ width: `${Math.min(100, Math.max(0, hpPercentage))}%` }}
                    />
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col gap-6 w-full">
                <div className="flex gap-6">
                    <Button
                        variant="destructive"
                        size="lg"
                        onClick={() => handleUpdate(-1)}
                        disabled={isPending}
                        className="flex-1 h-24 p-8 text-4xl font-bold rounded-2xl border-b-4 border-red-950 active:translate-y-1 active:border-b-0 active:scale-[0.98] transition-all touch-manipulation"
                    >
                        -1
                    </Button>
                    <Button
                        variant="success"
                        size="lg"
                        onClick={() => handleUpdate(1)}
                        disabled={isPending}
                        className="flex-1 h-24 p-8 text-4xl font-bold rounded-2xl border-b-4 border-emerald-950 active:translate-y-1 active:border-b-0 active:scale-[0.98] transition-all touch-manipulation"
                    >
                        +1
                    </Button>
                </div>
                <div className="flex gap-6">
                    <Button
                        variant="destructive"
                        size="lg"
                        onClick={() => handleUpdate(-5)}
                        disabled={isPending}
                        className="flex-1 h-20 p-8 text-3xl font-bold rounded-2xl border-b-4 border-red-950 active:translate-y-1 active:border-b-0 active:scale-[0.98] opacity-90 transition-all touch-manipulation"
                    >
                        -5
                    </Button>
                    <Button
                        variant="success"
                        size="lg"
                        onClick={() => handleUpdate(5)}
                        disabled={isPending}
                        className="flex-1 h-20 p-8 text-3xl font-bold rounded-2xl border-b-4 border-emerald-950 active:translate-y-1 active:border-b-0 active:scale-[0.98] opacity-90 transition-all touch-manipulation"
                    >
                        +5
                    </Button>
                </div>
            </div>
        </div>
    );
}
