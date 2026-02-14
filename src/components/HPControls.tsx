'use client';

import { updateHP } from "@/app/actions";
import { useTransition, useState } from "react";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";

export default function HPControls({ characterId }: { characterId: string, currentHp: number }) {
    const [isPending, startTransition] = useTransition();
    const [amount, setAmount] = useState(1);

    const handleUpdate = (delta: number) => {
        startTransition(async () => {
            await updateHP(characterId, delta);
        });
    };

    return (
        <div className="flex flex-col gap-1 mt-1">
            <div className="flex gap-1">
                <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleUpdate(-amount)}
                    disabled={isPending}
                    className="flex-1 h-6 text-xs font-mono p-0"
                >
                    -{amount}
                </Button>
                <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="h-6 w-10 text-center px-0 text-xs bg-black/50 border-white/10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <Button
                    variant="success"
                    size="sm"
                    onClick={() => handleUpdate(amount)}
                    disabled={isPending}
                    className="flex-1 h-6 text-xs font-mono p-0"
                >
                    +{amount}
                </Button>
            </div>
            <div className="flex gap-1">
                <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleUpdate(-5)}
                    disabled={isPending}
                    className="flex-1 h-5 text-[10px] opacity-50 hover:opacity-100 p-0"
                >
                    -5
                </Button>
                <Button
                    variant="success"
                    size="sm"
                    onClick={() => handleUpdate(5)}
                    disabled={isPending}
                    className="flex-1 h-5 text-[10px] opacity-50 hover:opacity-100 p-0"
                >
                    +5
                </Button>
            </div>
        </div>
    );
}
