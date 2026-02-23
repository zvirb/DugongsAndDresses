'use client';

// SENTRY'S JOURNAL - CRITICAL LEARNINGS ONLY:
// Format: ## YYYY-MM-DD - [Logic] Break: [Turn skipped index 0] Fix: [Corrected modulo arithmetic]
// ## 2024-05-23 - [UI] Break: [Active status hidden] Fix: [Changed "Active Unit" to "ACTIVE TURN"]
// ## 2025-05-24 - [Logic] Break: [Empty list race condition] Fix: [Guard clause for 0 participants]
// ## 2025-05-24 - [UI] Fortify: [Active Turn Visibility] Fix: [Updated drop-shadow style to #2b2bee]
// ## 2025-05-25 - [Logic] Fortify: [Turn Loop Integrity] Fix: [Verified loop safety and race condition logging]
// ## 2025-05-26 - [Logic] Fortify: [Client Recovery] Fix: [Verified sync behavior when backend detects race condition]
// ## 2025-05-27 - [Logic] Fortify: [Race Condition Safety] Fix: [Added try/catch for "Combatant Vanished" edge case and improved loop logging]
// ## 2025-05-31 - [UI] Fortify: [Active Turn Audit] Fix: [Verified exclusive highlighting relies on single activeTurn flag from DB]
// ## 2025-06-05 - [Logic] Fortify: [Combatant Vanished Retry] Fix: [Implemented recursive retry in advanceTurn to auto-recover when next char is deleted]
// ## 2025-06-05 - [UI] Fortify: [Error Handling] Fix: [Replaced alert() with inline error banner for better UX]
// ## 2025-06-06 - [Logic] Fortify: [Error Handling] Fix: [Added try/catch blocks to async handlers]
// ## 2025-06-06 - [UI] Fortify: [Visual Alert] Fix: [Added prominent 'YOUR TURN' badge for active character]
// ## 2025-06-09 - [UI] Fortify: [Active Turn Visibility] Fix: [Enhanced 'YOUR TURN' glow]

import { advanceTurn, updateInitiative, saveEncounter, endEncounter, listEncounters, loadEncounter, deleteEncounter } from "@/app/actions";
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
    const [error, setError] = useState<string | null>(null);

    // Sort by initiative desc, then ID asc (stable sort matching server)
    const sortedParticipants = useMemo(() => {
        // SENTRY: Defensive coding - filter out corrupt data (missing ID)
        const validParticipants = initialParticipants.filter(p => {
            if (!p.id) {
                console.error("[SENTRY] TurnTracker received participant with missing ID:", p);
                return false;
            }
            return true;
        });

        return [...validParticipants].sort((a, b) => {
            if (b.initiativeRoll !== a.initiativeRoll) {
                return b.initiativeRoll - a.initiativeRoll;
            }
            return (a.id || "").localeCompare(b.id || "");
        });
    }, [initialParticipants]);

    const handleNextTurn = () => {
        if (sortedParticipants.length === 0) return;
        setError(null);

        // Find current active participant ID for optimistic concurrency check
        const currentActive = sortedParticipants.find(p => p.activeTurn);

        // SENTRY: Defensive check
        if (currentActive && !currentActive.id) {
            console.error("[SENTRY] Active participant has no ID. Cannot advance.");
            return;
        }

        startTransition(async () => {
            const result = await advanceTurn(campaignId, currentActive?.id);
            if (!result.success) {
                console.error("[SENTRY] Turn advancement failed:", result.error);
                setError(result.error || "Failed to advance turn");
            }
        });
    };

    const updateInit = (id: string, val: string) => {
        const num = parseInt(val) || 0;
        startTransition(async () => {
            try {
                await updateInitiative(id, num);
            } catch (e: any) {
                console.error("[SENTRY] Init update failed:", e);
                setError(e.message || "Failed to update initiative");
            }
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
            try {
                await endEncounter(campaignId);
            } catch (e: any) {
                console.error("[SENTRY] End encounter failed:", e);
                setError(e.message || "Failed to end encounter");
            }
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
            try {
                await loadEncounter(id);
                setShowLoadModal(false);
            } catch (e: any) {
                console.error("[SENTRY] Load encounter failed:", e);
                setError(e.message || "Failed to load encounter");
            }
        });
    };

    const handleDeleteEncounter = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this encounter?")) return;
        setLoadingEncounters(true); // Re-use loading state to show activity
        try {
            await deleteEncounter(id);
            // Refresh list
            const result = await listEncounters(campaignId);
            if (result.success && Array.isArray(result.data)) {
                setEncounters(result.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingEncounters(false);
        }
    };

    return (
        <div className="flex flex-col h-full relative">
            {error && (
                <div className="absolute top-0 left-0 right-0 z-50 bg-red-900/20 border border-red-500/50 p-2 text-xs text-red-100 flex justify-between items-center animate-in slide-in-from-top-2 rounded mb-2 shadow-[0_0_20px_rgba(239,68,68,0.4)] backdrop-blur-sm">
                    <span className="font-bold flex items-center gap-2">
                        <span className="text-red-500 animate-pulse">⚠️</span>
                        {error}
                    </span>
                    <button onClick={() => setError(null)} className="text-red-300 hover:text-white font-bold px-2">✕</button>
                </div>
            )}
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
                        disabled={isPending || sortedParticipants.length === 0}
                        variant="agent"
                        size="sm"
                        className="text-[10px] h-7 px-4 font-black tracking-widest uppercase shadow-[0_0_20px_rgba(43,43,238,0.6)] hover:shadow-[0_0_30px_rgba(43,43,238,0.8)] hover:scale-105 transition-all animate-pulse hover:animate-none"
                    >
                        {isPending ? '...' : 'NEXT'}
                    </Button>
                </div>
            </div>

            {/* Load Modal Overlay */}
            {showLoadModal && (
                <div className="absolute inset-0 z-50 bg-agent-navy/80 flex items-center justify-center p-2 rounded-lg backdrop-blur-sm">
                    <div className="bg-agent-navy/95 backdrop-blur-xl border border-agent-blue shadow-[0_0_50px_rgba(43,43,238,0.3)] rounded-lg w-full h-full flex flex-col animate-in fade-in zoom-in duration-200 relative overflow-hidden ring-1 ring-agent-blue/50">
                        {/* Scanline Overlay */}
                        <div className="absolute inset-0 pointer-events-none z-0 bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] opacity-20" />

                        <div className="p-3 border-b border-agent-blue/30 flex justify-between items-center shrink-0 relative z-10 bg-agent-navy">
                            <h3 className="text-xs font-bold text-agent-blue uppercase tracking-widest flex items-center gap-2">
                                <span className="w-2 h-2 bg-agent-blue rounded-full animate-pulse" />
                                Load Encounter
                            </h3>
                            <button onClick={() => setShowLoadModal(false)} className="text-agent-blue hover:text-white px-2 hover:bg-agent-blue/10 rounded transition-colors">✕</button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-2 relative z-10">
                            {loadingEncounters ? (
                                <p className="text-xs text-agent-blue/60 text-center p-4 animate-pulse">Scanning archives...</p>
                            ) : encounters.length === 0 ? (
                                <p className="text-xs text-agent-blue/40 text-center p-4">No saved encounters found.</p>
                            ) : (
                                encounters.map(enc => (
                                    <div
                                        key={enc.id}
                                        className="w-full flex justify-between items-center gap-2 p-1 rounded hover:bg-agent-blue/10 transition-colors group"
                                    >
                                        <button
                                            onClick={() => handleLoadEncounter(enc.id)}
                                            className="flex-1 text-left p-2 rounded hover:bg-agent-blue/20 hover:text-agent-blue transition-colors focus:outline-none focus:ring-2 focus:ring-agent-blue"
                                        >
                                            <div className="text-sm font-bold text-white">{enc.name}</div>
                                            <div className="text-[10px] text-agent-blue/60 font-mono">
                                                {new Date(enc.createdAt).toLocaleString()}
                                            </div>
                                        </button>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={(e) => handleDeleteEncounter(e, enc.id)}
                                            className="h-7 px-2 text-[10px] opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                                            title="Delete Encounter"
                                        >
                                            Delete
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-2 overflow-y-auto flex-1 pr-1 scrollbar-thin scrollbar-thumb-agent-blue/30 scrollbar-track-transparent">
                {sortedParticipants.length === 0 && (
                    <div className="p-8 text-center border-2 border-dashed border-agent-blue/30 bg-agent-blue/5 rounded-lg animate-pulse">
                        <p className="text-agent-blue/50 text-xs font-bold font-mono uppercase tracking-[0.2em]">NO ACTIVE COMBATANTS</p>
                    </div>
                )}
                {sortedParticipants.map((p, index) => (
                    <div
                        key={p.id}
                        className={cn(
                            "p-3 rounded-lg flex justify-between items-center border-l-4 transition-all duration-300 relative overflow-hidden group",
                            p.activeTurn
                                ? 'bg-agent-navy/80 border-agent-blue shadow-[0_0_30px_rgba(43,43,238,0.5)] scale-[1.05] ring-2 ring-agent-blue z-20 my-2'
                                : 'bg-agent-navy/20 border-t border-b border-r border-white/5 hover:bg-agent-blue/5 hover:border-agent-blue/30 border-l-transparent'
                        )}
                    >
                        {/* Active Indicator Scanline */}
                        {p.activeTurn && (
                            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
                                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-agent-blue/20 to-transparent animate-[pulse_2s_infinite]" />
                                <div className="absolute inset-0 bg-agent-blue/5 animate-pulse" />
                            </div>
                        )}

                        <div className="relative z-10 flex items-center gap-3">
                            <span className="font-mono text-xs text-agent-blue/40 w-4">#{index + 1}</span>
                            <div>
                                <span className={cn(
                                    "block font-bold uppercase tracking-wide text-sm",
                                    p.type === 'NPC' ? 'text-red-400 drop-shadow-sm' : 'text-white drop-shadow-sm',
                                    p.activeTurn && "text-agent-blue drop-shadow-[0_0_5px_#2b2bee] text-lg"
                                )}>
                                    {p.name}
                                </span>
                                {p.activeTurn && (
                                    <div className="flex flex-col gap-0.5 mt-1">
                                        <span className="text-xs text-agent-blue font-black animate-pulse uppercase tracking-[0.2em] block drop-shadow-[0_0_5px_#2b2bee]">&gt;&gt; ACTIVE TURN &lt;&lt;</span>
                                        <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest block bg-emerald-900/30 px-1 py-0.5 rounded border border-emerald-500/30 w-fit shadow-[0_0_15px_rgba(52,211,153,0.5)] animate-pulse">YOUR TURN</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Initiative Edit Field */}
                        <div className="w-16 relative z-10">
                            <Input
                                type="number"
                                className={cn(
                                    "text-center font-mono h-8 border-transparent focus-visible:ring-agent-blue transition-all",
                                    p.activeTurn
                                        ? "bg-agent-navy/60 text-white shadow-inner border-agent-blue/30"
                                        : "bg-agent-navy/30 text-agent-blue/50 hover:text-white hover:bg-agent-navy/50"
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
