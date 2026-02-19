'use client';

// SCOUT'S JOURNAL - CRITICAL LEARNINGS ONLY
// Format: ## YYYY-MM-DD - [Interaction] Fumble: [Button too small] Path: [Increased padding to p-4]
// ## 2025-05-29 - [ActionForm] Thumb Zone: [Result section cramped] Path: [Stacked inputs vertically for full width targets]
// ## 2025-05-30 - [ActionForm] Workflow: [Added specific sub-forms] Path: [Implemented Action Mode state machine]
// ## 2025-06-01 - [ActionForm] Thumb Zone: [Inputs and buttons small] Path: [Increased inputs to h-20, Submit to h-24, text-2xl]

import { logAction, performAttack, castSpell, updateConditions } from "@/app/actions";
import { useTransition, useState } from "react";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { secureRoll } from "@/lib/dice";

const QUICK_ACTIONS = ["Attack", "Cast", "Dodge", "Dash"];

type ActionMode = 'INTENT' | 'ATTACK' | 'CAST';

function sanitizeInput(input: string): string {
    if (!input) return "";
    let sanitized = input.replace(/[\r\n]+/g, " ").trim();
    if (sanitized.length > 100) {
        sanitized = sanitized.substring(0, 100);
    }
    return sanitized;
}

export default function PlayerActionForm({ characterName, campaignId, characterId }: { characterName: string, campaignId: string, characterId: string }) {
    const [isPending, startTransition] = useTransition();
    const [mode, setMode] = useState<ActionMode>('INTENT');
    const [intent, setIntent] = useState("");
    const [roll, setRoll] = useState("");

    // Attack State
    const [weapon, setWeapon] = useState("");
    const [attackRoll, setAttackRoll] = useState("");

    // Cast State
    const [spell, setSpell] = useState("");

    const handleRoll = (setter: (val: string) => void) => {
        setter(secureRoll(20).toString());
    };

    const handleActionClick = (action: string) => {
        if (action === "Attack") {
            setMode('ATTACK');
        } else if (action === "Cast") {
            setMode('CAST');
        } else if (action === "Dodge") {
            if (!confirm("Take the Dodge action? (Disadvantage on attacks against you)")) return;
            startTransition(async () => {
                await logAction(campaignId, `**${characterName}** takes a defensive stance, ready to dodge incoming attacks.`, "PlayerAction");
                // Note: We don't blindly update conditions here to avoid overwriting existing ones without a fetch first.
                // The log is the primary feedback for now.
            });
        } else if (action === "Dash") {
             startTransition(async () => {
                await logAction(campaignId, `**${characterName}** dashes with a burst of speed!`, "PlayerAction");
            });
        } else {
            setIntent(action);
        }
    };

    const handleSubmitAttack = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!weapon) return;

        startTransition(async () => {
            const rollVal = parseInt(attackRoll) || undefined;
            // performAttack(attackerId, targetId, damage, attackRoll)
            // Passing damage 0 for now as we don't have damage input yet (keeping it simple as per plan)
            try {
                await performAttack(characterId, undefined, undefined, rollVal);
            } catch (e) {
                console.error(e);
            }
            setMode('INTENT');
            setWeapon("");
            setAttackRoll("");
        });
    };

    const handleSubmitCast = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!spell) return;

        startTransition(async () => {
            try {
                await castSpell(characterId, undefined, spell);
            } catch (e) {
                console.error(e);
            }
            setMode('INTENT');
            setSpell("");
        });
    };

    // ... Legacy Intent Form ...
    const handleSubmitIntent = async (e: React.FormEvent) => {
        e.preventDefault();
        const cleanIntent = sanitizeInput(intent);
        let cleanRoll = sanitizeInput(roll);
        if (!cleanIntent) return;

        const content = cleanRoll
            ? `**${characterName}** attempts: **${cleanIntent}** (Roll: **${cleanRoll}**).`
            : `**${characterName}** attempts: **${cleanIntent}**.`;

        startTransition(async () => {
            await logAction(campaignId, content, "PlayerAction");
            setIntent("");
            setRoll("");
        });
    };

    if (mode === 'ATTACK') {
        return (
             <form onSubmit={handleSubmitAttack} className="space-y-6 bg-black/40 p-6 rounded-2xl border border-agent-blue/30 shadow-lg backdrop-blur-md animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-agent-blue flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-agent-blue rounded-full animate-pulse" />
                        Combat Engagement
                    </h3>
                    <Button type="button" variant="ghost" onClick={() => setMode('INTENT')} className="h-14 px-6 text-xs uppercase tracking-wider text-neutral-500 hover:text-white border border-white/5 bg-white/5">Cancel</Button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-[10px] uppercase tracking-wider font-bold text-neutral-500 mb-1">Weapon / Method</label>
                        <Input
                            autoFocus
                            placeholder="e.g. Greataxe"
                            value={weapon}
                            onChange={e => setWeapon(e.target.value)}
                            className="bg-black/40 border-white/10 focus:border-agent-blue focus:ring-agent-blue/20 h-20 text-2xl font-mono"
                        />
                    </div>
                     <div className="flex gap-2">
                        <div className="flex-1">
                             <label className="block text-[10px] uppercase tracking-wider font-bold text-neutral-500 mb-1">Attack Roll</label>
                             <Input
                                type="number"
                                placeholder="d20"
                                value={attackRoll}
                                onChange={e => setAttackRoll(e.target.value)}
                                className="bg-black/40 border-white/10 focus:border-agent-blue focus:ring-agent-blue/20 h-20 text-2xl font-mono text-center"
                            />
                        </div>
                        <div className="flex items-end">
                            <Button type="button" onClick={() => handleRoll(setAttackRoll)} className="h-20 w-24 bg-white/5 border border-white/10 hover:bg-agent-blue/20 hover:border-agent-blue text-agent-blue font-black uppercase tracking-wider">
                                Roll
                            </Button>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        variant="agent"
                        disabled={!weapon || isPending}
                        className="w-full h-24 text-2xl font-black uppercase tracking-widest shadow-[0_0_20px_rgba(43,43,238,0.3)]"
                    >
                        {isPending ? 'Engaging...' : 'ATTACK'}
                    </Button>
                </div>
             </form>
        );
    }

    if (mode === 'CAST') {
        return (
             <form onSubmit={handleSubmitCast} className="space-y-6 bg-black/40 p-6 rounded-2xl border border-agent-blue/30 shadow-lg backdrop-blur-md animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-purple-400 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse" />
                        Spellcasting
                    </h3>
                    <Button type="button" variant="ghost" onClick={() => setMode('INTENT')} className="h-14 px-6 text-xs uppercase tracking-wider text-neutral-500 hover:text-white border border-white/5 bg-white/5">Cancel</Button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-[10px] uppercase tracking-wider font-bold text-neutral-500 mb-1">Spell Name</label>
                        <Input
                            autoFocus
                            placeholder="e.g. Fireball"
                            value={spell}
                            onChange={e => setSpell(e.target.value)}
                            className="bg-black/40 border-white/10 focus:border-purple-500/50 focus:ring-purple-500/20 h-20 text-2xl font-mono"
                        />
                    </div>

                    <Button
                        type="submit"
                        variant="agent"
                        disabled={!spell || isPending}
                        className="w-full h-24 text-2xl font-black uppercase tracking-widest shadow-[0_0_20px_rgba(168,85,247,0.3)] border-purple-500/50 text-purple-200 hover:bg-purple-900/50"
                    >
                        {isPending ? 'Channeling...' : 'CAST'}
                    </Button>
                </div>
             </form>
        );
    }

    return (
        <form onSubmit={handleSubmitIntent} className="space-y-8 bg-black/40 p-6 rounded-2xl border border-white/5 shadow-lg backdrop-blur-md">
            <div className="space-y-3">
                <label className="text-sm font-black uppercase tracking-[0.2em] text-agent-blue ml-1 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-agent-blue rounded-full shadow-[0_0_5px_#2b2bee]" />
                    Declare Intent
                </label>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                    {QUICK_ACTIONS.map((action) => (
                        <Button
                            key={action}
                            type="button"
                            variant="ghost"
                            disabled={isPending}
                            onClick={() => handleActionClick(action)}
                            className="h-24 p-4 text-lg font-mono font-bold uppercase tracking-wider bg-agent-navy/50 border border-white/5 hover:bg-agent-blue/20 hover:border-agent-blue/50 active:bg-agent-blue/40 active:scale-95 active:brightness-90 transition-all touch-manipulation shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]"
                        >
                            {action}
                        </Button>
                    ))}
                </div>

                <Input
                    placeholder="I swing my axe..."
                    value={intent}
                    onChange={(e) => setIntent(e.target.value)}
                    disabled={isPending}
                    className="bg-black/40 border-white/10 focus:border-agent-blue focus:ring-agent-blue/20 h-20 text-xl rounded-xl touch-manipulation placeholder:text-neutral-600 font-mono shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]"
                />
            </div>
            {/* ... Result Section ... */}
            <div className="flex flex-col gap-6">
                <div className="space-y-3">
                    <label className="text-sm font-black uppercase tracking-[0.2em] text-neutral-500 ml-1">Result (Optional)</label>
                    <div className="flex gap-3">
                        <Input
                            type="text"
                            placeholder="Dice Roll"
                            value={roll}
                            onChange={(e) => setRoll(e.target.value)}
                            disabled={isPending}
                            className="bg-black/40 border-white/10 focus:border-agent-blue focus:ring-agent-blue/20 h-20 text-xl rounded-xl touch-manipulation flex-1 font-mono shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] active:scale-[0.98]"
                        />
                        <Button
                            type="button"
                            onClick={() => handleRoll(setRoll)}
                            disabled={isPending}
                            className="h-20 w-24 bg-agent-blue/10 border border-agent-blue/30 text-agent-blue text-lg font-black rounded-xl uppercase tracking-widest hover:bg-agent-blue/30 hover:border-agent-blue/60 active:scale-95 active:brightness-90 transition-all shadow-[0_0_15px_rgba(43,43,238,0.1)] hover:shadow-[0_0_20px_rgba(43,43,238,0.3)]"
                        >
                            Roll
                        </Button>
                    </div>
                </div>
                <Button
                    type="submit"
                    variant="agent"
                    disabled={isPending || !intent}
                    className="h-24 p-4 w-full rounded-xl uppercase text-3xl font-black tracking-widest shadow-[0_0_25px_rgba(43,43,238,0.4)] active:scale-95 active:brightness-90 transition-transform touch-manipulation border-t-4 border-agent-blue/50"
                >
                    {isPending ? "TRANSMITTING..." : "EXECUTE"}
                </Button>
            </div>
        </form>
    );
}
