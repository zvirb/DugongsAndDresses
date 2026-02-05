'use client';

import { updateHP } from "@/app/actions";
import { useTransition } from "react";
import { Button } from "./ui/Button";

export default function HPControls({ characterId }: { characterId: string, currentHp: number }) {
    const [isPending, startTransition] = useTransition();

    const handleUpdate = (amount: number) => {
        startTransition(async () => {
            await updateHP(characterId, amount);
        });
    };

    return (
        <div className="flex items-center gap-1 mt-1">
            <Button
                variant="destructive"
                size="sm"
                onClick={() => handleUpdate(-1)}
                disabled={isPending}
                className="h-6 px-2 text-xs font-mono"
            >
                -1
            </Button>
            <Button
                variant="success"
                size="sm"
                onClick={() => handleUpdate(1)}
                disabled={isPending}
                className="h-6 px-2 text-xs font-mono"
            >
                +1
            </Button>
        </div>
    );
}