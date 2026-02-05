'use client';

import { setNextTurn, updateInitiative } from "@/app/actions";
import { useTransition } from "react";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { cn } from "@/lib/utils";

type Participant = {
    id: string;
    name: string;
    initiativeRoll: number;
    type: string;
    activeTurn: boolean;
};

export default function TurnTracker({ initialParticipants, campaignId }: { initialParticipants: Participant[], campaignId: string }) {
    const [isPending, startTransition] = useTransition();

    // Sort by initiative desc
    const sortedParticipants = [...initialParticipants].sort((a, b) => b.initiativeRoll - a.initiativeRoll);

    const handleNextTurn = () => {
        // Find current active index
        const currentIndex = sortedParticipants.findIndex(p => p.activeTurn);
        const nextIndex = (currentIndex + 1) % sortedParticipants.length;
        const nextChar = sortedParticipants[nextIndex];

        if (nextChar) {
            startTransition(async () => {
                await setNextTurn(campaignId, nextChar.id);
            });
        }
    };

    const updateInit = (id: string, val: string) => {
        const num = parseInt(val) || 0;
        startTransition(async () => {
            await updateInitiative(id, num);
        });
    };

    return (
        <div className="flex flex-col h-full">
            <h2 className="text-lg font-semibold mb-4 text-emerald-400 flex justify-between items-center">
                <span>Initiative</span>
                <Button
                    onClick={handleNextTurn}
                    disabled={isPending}
                    variant="success"
                    size="sm"
                    className="text-xs"
                >
                    {isPending ? 'Syncing...' : 'Next Turn'}
                </Button>
            </h2>

            <div className="space-y-2 overflow-y-auto flex-1 pr-1">
                {sortedParticipants.map(p => (
                    <div
                        key={p.id}
                        className={cn(
                            "p-3 rounded flex justify-between items-center border-l-4 transition-all",
                            p.activeTurn
                                ? 'bg-neutral-700 border-amber-500 shadow-lg shadow-black/50 scale-[1.02]'
                                : 'bg-neutral-800 border-transparent opacity-80'
                        )}
                    >
                        <div>
                            <span className={cn(
                                "block font-bold",
                                p.type === 'NPC' ? 'text-red-400' : 'text-white'
                            )}>
                                {p.name}
                            </span>
                            {p.activeTurn && <span className="text-xs text-amber-500 animate-pulse">Taking Turn...</span>}
                        </div>

                        {/* Initiative Edit Field */}
                        <div className="w-16">
                            <Input
                                type="number"
                                className="text-center font-mono h-8 bg-neutral-900 border-neutral-700 focus-visible:ring-amber-500"
                                defaultValue={p.initiativeRoll}
                                onBlur={(e) => updateInit(p.id, e.target.value)}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}