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
                    className="flex-1 h-6 text-xs font-mono p-0 shadow-[0_0_10px_rgba(220,38,38,0.2)] hover:shadow-[0_0_15px_rgba(220,38,38,0.5)]"
                >
                    -{amount}
                </Button>
                <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="h-6 w-10 text-center px-0 text-xs bg-agent-navy/50 border-agent-blue/30 text-agent-blue [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none hover:border-agent-blue/60 focus:bg-agent-navy/80 transition-all font-mono font-bold"
                />
                <Button
                    variant="success"
                    size="sm"
                    onClick={() => handleUpdate(amount)}
                    disabled={isPending}
                    className="flex-1 h-6 text-xs font-mono p-0 shadow-[0_0_10px_rgba(16,185,129,0.2)] hover:shadow-[0_0_15px_rgba(16,185,129,0.5)]"
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
                    className="flex-1 h-5 text-[10px] opacity-50 hover:opacity-100 p-0 border-red-900/50 bg-red-950/30 text-red-400 hover:bg-red-900/60"
                >
                    -5
                </Button>
                <Button
                    variant="success"
                    size="sm"
                    onClick={() => handleUpdate(5)}
                    disabled={isPending}
                    className="flex-1 h-5 text-[10px] opacity-50 hover:opacity-100 p-0 border-emerald-900/50 bg-emerald-950/30 text-emerald-400 hover:bg-emerald-900/60"
                >
                    +5
                </Button>
            </div>
        </div>
    );
}
