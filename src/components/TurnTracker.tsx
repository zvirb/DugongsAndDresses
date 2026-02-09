'use client';

import { advanceTurn, updateInitiative, saveEncounter } from "@/app/actions";
import { useTransition, useState } from "react";
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
    const [saving, setSaving] = useState(false);

    // Sort by initiative desc, then ID asc (stable sort matching server)
    const sortedParticipants = [...initialParticipants].sort((a, b) => {
        if (b.initiativeRoll !== a.initiativeRoll) {
            return b.initiativeRoll - a.initiativeRoll;
        }
        return a.id.localeCompare(b.id);
    });

    const handleNextTurn = () => {
        // Find current active participant ID for optimistic concurrency check
        const currentActive = sortedParticipants.find(p => p.activeTurn);

        startTransition(async () => {
            await advanceTurn(campaignId, currentActive?.id);
        });
    };

    const updateInit = (id: string, val: string) => {
        const num = parseInt(val) || 0;
        startTransition(async () => {
            await updateInitiative(id, num);
        });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await saveEncounter(campaignId, sortedParticipants);
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-4 border-b border-agent-blue/20 pb-2">
                <h2 className="text-lg font-semibold text-agent-blue uppercase tracking-widest">
                    Initiative
                </h2>
                <div className="flex gap-2">
                    <Button
                        onClick={handleSave}
                        disabled={saving || isPending}
                        variant="outline"
                        size="sm"
                        className="text-[10px] h-7 px-2 border-agent-blue/30 text-agent-blue hover:bg-agent-blue/10"
                        title="Save current state as an Encounter"
                    >
                        {saving ? '...' : 'Save'}
                    </Button>
                    <Button
                        onClick={handleNextTurn}
                        disabled={isPending}
                        variant="agent"
                        size="sm"
                        className="text-[10px] h-7 px-2"
                    >
                        {isPending ? '...' : 'Next'}
                    </Button>
                </div>
            </div>

            <div className="space-y-2 overflow-y-auto flex-1 pr-1">
                {sortedParticipants.map(p => (
                    <div
                        key={p.id}
                        className={cn(
                            "p-3 rounded flex justify-between items-center border-l-4 transition-all",
                            p.activeTurn
                                ? 'bg-agent-blue/10 border-agent-blue shadow-[0_0_20px_rgba(43,43,238,0.5)] scale-[1.02] ring-1 ring-agent-blue/50 animate-[pulse_4s_infinite]'
                                : 'bg-white/5 border-transparent opacity-60 hover:opacity-100'
                        )}
                    >
                        <div>
                            <span className={cn(
                                "block font-bold uppercase tracking-wide",
                                p.type === 'NPC' ? 'text-red-400' : 'text-white'
                            )}>
                                {p.name}
                            </span>
                            {p.activeTurn && <span className="text-xs text-agent-blue font-bold animate-pulse uppercase tracking-wider">Taking Turn...</span>}
                        </div>

                        {/* Initiative Edit Field */}
                        <div className="w-16">
                            <Input
                                type="number"
                                className={cn(
                                    "text-center font-mono h-8 border-transparent focus-visible:ring-agent-blue",
                                    p.activeTurn ? "bg-black/40 text-white" : "bg-black/20 text-neutral-400"
                                )}
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