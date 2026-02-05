'use client';

import { updateHP } from "@/app/actions";
import { useTransition } from "react";
import { Button } from "./ui/Button";

export default function PlayerHPControls({ characterId, currentHp, maxHp }: { characterId: string, currentHp: number, maxHp: number }) {
    const [isPending, startTransition] = useTransition();

    const handleUpdate = (amount: number) => {
        if (currentHp + amount < 0) return;
        if (currentHp + amount > maxHp * 2) return; // Cap at 2x max health for temporary HP etc, though simple for now
        
        startTransition(async () => {
            await updateHP(characterId, amount);
        });
    };

    return (
        <div className="flex flex-col gap-4 w-full">
            <div className="flex gap-4">
                <Button
                    variant="destructive"
                    size="lg"
                    onClick={() => handleUpdate(-1)}
                    disabled={isPending}
                    className="flex-1 h-20 text-2xl font-bold rounded-2xl border-b-4 border-red-950 active:translate-y-1 active:border-b-0"
                >
                    -1
                </Button>
                <Button
                    variant="success"
                    size="lg"
                    onClick={() => handleUpdate(1)}
                    disabled={isPending}
                    className="flex-1 h-20 text-2xl font-bold rounded-2xl border-b-4 border-emerald-950 active:translate-y-1 active:border-b-0"
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
                    className="flex-1 h-16 text-xl font-bold rounded-2xl border-b-4 border-red-950 active:translate-y-1 active:border-b-0 opacity-80"
                >
                    -5
                </Button>
                <Button
                    variant="success"
                    size="lg"
                    onClick={() => handleUpdate(5)}
                    disabled={isPending}
                    className="flex-1 h-16 text-xl font-bold rounded-2xl border-b-4 border-emerald-950 active:translate-y-1 active:border-b-0 opacity-80"
                >
                    +5
                </Button>
            </div>
        </div>
    );
}