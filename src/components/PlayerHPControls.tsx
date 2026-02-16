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
        if (newHp < 0) return;
        if (newHp > maxHp * 2) return;

        const previousHp = optimisticHp;
        setOptimisticHp(newHp);
        
        startTransition(async () => {
            try {
                const result = await updateHP(characterId, amount);
                if (!result.success) {
                    setOptimisticHp(previousHp);
                    console.error("Failed to update HP:", result.error);
                }
            } catch (error) {
                setOptimisticHp(previousHp);
                console.error("Unexpected error updating HP:", error);
            }
        });
    };

    const hpPercentage = (optimisticHp / maxHp) * 100;
    const hpColorClass = optimisticHp <= maxHp * 0.2
        ? 'bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.6)]'
        : optimisticHp <= maxHp * 0.5
            ? 'bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.6)]'
            : 'bg-agent-blue shadow-[0_0_20px_rgba(43,43,238,0.6)]';

    return (
        <div className="space-y-6">
            {/* Vitality Display (Optimistic) */}
            <div className="space-y-4">
                <div className="flex justify-between items-baseline mb-2">
                    <span className="text-xs font-black text-agent-blue uppercase tracking-[0.2em] flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full animate-pulse ${optimisticHp <= maxHp * 0.2 ? 'bg-red-500' : 'bg-agent-blue'}`} />
                        Vitality Status
                    </span>
                    <div className="text-right flex items-baseline gap-2">
                        <span className={`text-6xl font-black italic tracking-tighter ${optimisticHp <= maxHp * 0.2 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                            {optimisticHp}
                        </span>
                        <span className="text-xl text-neutral-500 font-bold">/ {maxHp}</span>
                    </div>
                </div>

                {/* Technical Health Bar */}
                <div className="h-6 bg-black/60 border border-white/10 rounded-sm overflow-hidden relative p-0.5">
                    {/* Tick Marks */}
                    <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent,transparent_19%,rgba(255,255,255,0.1)_20%)] z-10 pointer-events-none" />

                    <div
                        className={`h-full transition-all duration-500 ease-out relative ${hpColorClass}`}
                        style={{ width: `${Math.min(100, Math.max(0, hpPercentage))}%` }}
                    >
                        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:10px_10px]" />
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col gap-4 w-full">
                <div className="flex gap-4">
                    <Button
                        variant="destructive"
                        size="lg"
                        onClick={() => handleUpdate(-1)}
                        disabled={isPending}
                        className="flex-1 h-32 p-6 text-6xl font-black rounded-xl border-b-8 border-red-900 active:translate-y-2 active:border-b-0 active:scale-95 active:brightness-90 transition-all touch-manipulation shadow-[0_10px_0_rgba(127,29,29,0.5)] active:shadow-none bg-gradient-to-br from-red-600 to-red-800 hover:from-red-500 hover:to-red-700"
                    >
                        -1
                    </Button>
                    <Button
                        variant="success"
                        size="lg"
                        onClick={() => handleUpdate(1)}
                        disabled={isPending}
                        className="flex-1 h-32 p-6 text-6xl font-black rounded-xl border-b-8 border-emerald-900 active:translate-y-2 active:border-b-0 active:scale-95 active:brightness-90 transition-all touch-manipulation shadow-[0_10px_0_rgba(6,78,59,0.5)] active:shadow-none bg-gradient-to-br from-emerald-600 to-emerald-800 hover:from-emerald-500 hover:to-emerald-700"
                    >
                        +1
                    </Button>
                </div>
                <div className="flex gap-4">
                    <Button
                        variant="destructive"
                        size="lg"
                        onClick={() => handleUpdate(-5)}
                        disabled={isPending}
                        className="flex-1 h-20 text-3xl font-bold rounded-xl border-b-4 border-red-900 active:translate-y-1 active:border-b-0 active:scale-95 active:brightness-90 transition-all touch-manipulation bg-red-900/50 hover:bg-red-800/80 text-red-100"
                    >
                        -5
                    </Button>
                    <Button
                        variant="success"
                        size="lg"
                        onClick={() => handleUpdate(5)}
                        disabled={isPending}
                        className="flex-1 h-20 text-3xl font-bold rounded-xl border-b-4 border-emerald-900 active:translate-y-1 active:border-b-0 active:scale-95 active:brightness-90 transition-all touch-manipulation bg-emerald-900/50 hover:bg-emerald-800/80 text-emerald-100"
                    >
                        +5
                    </Button>
                </div>
            </div>
        </div>
    );
}
