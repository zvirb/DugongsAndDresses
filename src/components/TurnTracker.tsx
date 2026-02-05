'use client';

import { setNextTurn, updateInitiative } from "@/app/actions";
import { useTransition, useState } from "react";

type Participant = {
    id: string;
    name: string;
    initiativeRoll: number;
    type: string;
    activeTurn: boolean;
};

export default function TurnTracker({ initialParticipants, campaignId }: { initialParticipants: Participant[], campaignId: string }) {
    const [isPending, startTransition] = useTransition();
    const [editingId, setEditingId] = useState<string | null>(null);

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
                <button
                    onClick={handleNextTurn}
                    disabled={isPending}
                    className="text-xs bg-emerald-900 hover:bg-emerald-800 text-emerald-100 px-2 py-1 rounded disabled:opacity-50"
                >
                    {isPending ? 'Syncing...' : 'Next Turn'}
                </button>
            </h2>

            <div className="space-y-2 overflow-y-auto flex-1">
                {sortedParticipants.map(p => (
                    <div
                        key={p.id}
                        className={`p-3 rounded flex justify-between items-center border-l-4 transition-all ${p.activeTurn
                                ? 'bg-neutral-700 border-amber-500 shadow-lg shadow-black/50 scale-102'
                                : 'bg-neutral-800 border-transparent opacity-80'
                            }`}
                    >
                        <div>
                            <span className={`block font-bold ${p.type === 'NPC' ? 'text-red-400' : 'text-white'}`}>
                                {p.name}
                            </span>
                            {p.activeTurn && <span className="text-xs text-amber-500 animate-pulse">Taking Turn...</span>}
                        </div>

                        {/* Initiative Edit Field */}
                        <div className="w-12">
                            <input
                                type="number"
                                className="w-full bg-neutral-900 text-center font-mono text-sm rounded border border-neutral-700 focus:border-amber-500 outline-none"
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
