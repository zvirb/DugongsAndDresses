'use client';

import { updateHP } from "@/app/actions";
import { useTransition } from "react";

export default function HPControls({ characterId, currentHp }: { characterId: string, currentHp: number }) {
    const [isPending, startTransition] = useTransition();

    const handleUpdate = (amount: number) => {
        startTransition(async () => {
            await updateHP(characterId, amount);
        });
    };

    return (
        <div className="flex items-center gap-1 mt-1">
            <button
                onClick={() => handleUpdate(-1)}
                disabled={isPending}
                className="px-2 py-0.5 bg-red-900/50 hover:bg-red-900 rounded text-red-200 text-xs font-mono"
            >
                -1
            </button>
            <button
                onClick={() => handleUpdate(1)}
                disabled={isPending}
                className="px-2 py-0.5 bg-green-900/50 hover:bg-green-900 rounded text-green-200 text-xs font-mono"
            >
                +1
            </button>
        </div>
    );
}
