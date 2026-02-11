'use client';

import { advanceTurn, updateInitiative, saveEncounter, endEncounter, listEncounters, loadEncounter } from "@/app/actions";
import { useTransition, useState, useMemo } from "react";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { cn } from "@/lib/utils";
import { Character } from "@/types";

export default function TurnTracker({ initialParticipants, campaignId }: { initialParticipants: Character[], campaignId: string }) {
    const [isPending, startTransition] = useTransition();
    const [saving, setSaving] = useState(false);
    const [showLoadModal, setShowLoadModal] = useState(false);
    const [encounters, setEncounters] = useState<{ id: string, name: string, createdAt: Date }[]>([]);
    const [loadingEncounters, setLoadingEncounters] = useState(false);

    // Sort by initiative desc, then ID asc (stable sort matching server)
    const sortedParticipants = useMemo(() => {
        return [...initialParticipants].sort((a, b) => {
            if (b.initiativeRoll !== a.initiativeRoll) {
                return b.initiativeRoll - a.initiativeRoll;
            }
            return a.id.localeCompare(b.id);
        });
    }, [initialParticipants]);

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
            const participantsToSave = sortedParticipants.map(p => ({
                characterId: p.id,
                initiative: p.initiativeRoll,
            }));
            await saveEncounter(campaignId, participantsToSave);
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    const handleEndEncounter = async () => {
        if (!confirm("Are you sure you want to end the encounter? This will clear initiative rolls.")) return;
        startTransition(async () => {
            await endEncounter(campaignId);
        });
    };

    const openLoadModal = async () => {
        setShowLoadModal(true);
        setLoadingEncounters(true);
        try {
            const result = await listEncounters(campaignId);
            if (result.success && Array.isArray(result.data)) {
                setEncounters(result.data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingEncounters(false);
        }
    };

    const handleLoadEncounter = async (id: string) => {
        if (!confirm("Load this encounter? Current initiative rolls will be overwritten.")) return;
        startTransition(async () => {
            await loadEncounter(id);
            setShowLoadModal(false);
        });
    };

    return (
        <div className="flex flex-col h-full relative">
            <div className="flex justify-between items-center mb-4 border-b border-agent-blue/20 pb-2">
                <h2 className="text-sm font-bold text-agent-blue uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-agent-blue rounded-full animate-pulse shadow-[0_0_5px_#2b2bee]" />
                    Initiative
                </h2>
                <div className="flex gap-2">
                    <Button
                        onClick={openLoadModal}
                        disabled={isPending}
                        variant="outline"
                        size="sm"
                        className="text-[10px] h-7 px-3 border-agent-blue/30 text-agent-blue hover:bg-agent-blue/10 hover:text-white hover:border-agent-blue/60 transition-all font-bold tracking-wider uppercase"
                        title="Load saved encounter"
                    >
                        Load
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={saving || isPending}
                        variant="outline"
                        size="sm"
                        className="text-[10px] h-7 px-3 border-agent-blue/30 text-agent-blue hover:bg-agent-blue/10 hover:text-white hover:border-agent-blue/60 transition-all font-bold tracking-wider uppercase"
                        title="Save current state as an Encounter"
                    >
                        {saving ? '...' : 'Save'}
                    </Button>
                    <Button
                        onClick={handleEndEncounter}
                        disabled={isPending}
                        variant="destructive"
                        size="sm"
                        className="text-[10px] h-7 px-3 font-bold tracking-wider uppercase shadow-[0_0_10px_rgba(220,38,38,0.3)] hover:shadow-[0_0_20px_rgba(220,38,38,0.6)]"
                        title="End Combat"
                    >
                        End
                    </Button>
                    <Button
                        onClick={handleNextTurn}
                        disabled={isPending}
                        variant="agent"
                        size="sm"
                        className="text-[10px] h-7 px-4 font-black tracking-widest uppercase shadow-[0_0_15px_rgba(43,43,238,0.4)] hover:shadow-[0_0_25px_rgba(43,43,238,0.7)] hover:scale-105 transition-all"
                    >
                        {isPending ? '...' : 'NEXT'}
                    </Button>
                </div>
            </div>

            {/* Load Modal Overlay */}
            {showLoadModal && (
                <div className="absolute inset-0 z-50 bg-black/95 flex items-center justify-center p-2 rounded-lg backdrop-blur-sm">
                    <div className="bg-agent-navy/90 border border-agent-blue/30 rounded-lg w-full h-full flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="p-3 border-b border-white/10 flex justify-between items-center shrink-0">
                            <h3 className="text-xs font-bold text-agent-blue uppercase tracking-widest">Load Encounter</h3>
                            <button onClick={() => setShowLoadModal(false)} className="text-neutral-400 hover:text-white px-2">✕</button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-2">
                            {loadingEncounters ? (
                                <p className="text-xs text-neutral-500 text-center p-4 animate-pulse">Scanning archives...</p>
                            ) : encounters.length === 0 ? (
                                <p className="text-xs text-neutral-500 text-center p-4">No saved encounters found.</p>
                            ) : (
                                encounters.map(enc => (
                                    <button
                                        key={enc.id}
                                        onClick={() => handleLoadEncounter(enc.id)}
                                        className="w-full text-left p-3 rounded bg-white/5 hover:bg-agent-blue/20 hover:border-agent-blue border border-transparent transition-all group"
                                    >
                                        <div className="text-sm font-bold text-white group-hover:text-agent-blue">{enc.name}</div>
                                        <div className="text-[10px] text-neutral-500 font-mono">
                                            {new Date(enc.createdAt).toLocaleString()}
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-2 overflow-y-auto flex-1 pr-1 scrollbar-thin scrollbar-thumb-agent-blue/30 scrollbar-track-transparent">
                {sortedParticipants.map((p, index) => (
                    <div
                        key={p.id}
                        className={cn(
                            "p-3 rounded-lg flex justify-between items-center border-l-4 transition-all duration-300 relative overflow-hidden",
                            p.activeTurn
                                ? 'bg-agent-navy border-agent-blue shadow-[0_0_20px_rgba(43,43,238,0.6)] scale-[1.02] ring-1 ring-agent-blue/50 z-10'
                                : 'bg-black/20 border-white/10 hover:bg-white/5 hover:border-white/30'
                        )}
                    >
                        {/* Active Indicator Scanline */}
                        {p.activeTurn && (
                            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
                                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-agent-blue/10 to-transparent animate-[pulse_2s_infinite]" />
                            </div>
                        )}

                        <div className="relative z-10 flex items-center gap-3">
                            <span className="font-mono text-xs text-neutral-500 w-4">#{index + 1}</span>
                            <div>
                                <span className={cn(
                                    "block font-bold uppercase tracking-wide text-sm",
                                    p.type === 'NPC' ? 'text-red-400 drop-shadow-sm' : 'text-white drop-shadow-sm',
                                    p.activeTurn && "text-agent-blue drop-shadow-[0_0_5px_rgba(43,43,238,0.8)]"
                                )}>
                                    {p.name}
                                </span>
                                {p.activeTurn && <span className="text-[10px] text-agent-blue font-bold animate-pulse uppercase tracking-wider block mt-0.5">&gt;&gt; Active Unit</span>}
                            </div>
                        </div>

                        {/* Initiative Edit Field */}
                        <div className="w-16 relative z-10">
                            <Input
                                type="number"
                                className={cn(
                                    "text-center font-mono h-8 border-transparent focus-visible:ring-agent-blue transition-all",
                                    p.activeTurn
                                        ? "bg-black/60 text-white shadow-inner border-agent-blue/30"
                                        : "bg-black/30 text-neutral-400 hover:text-white hover:bg-black/50"
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
