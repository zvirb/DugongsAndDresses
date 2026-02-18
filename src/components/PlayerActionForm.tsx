'use client';

// SCOUT'S JOURNAL - CRITICAL LEARNINGS ONLY
// Format: ## YYYY-MM-DD - [Interaction] Fumble: [Button too small] Path: [Increased padding to p-4]
// ## 2025-05-29 - [ActionForm] Thumb Zone: [Result section cramped] Path: [Stacked inputs vertically for full width targets]

import { logAction } from "@/app/actions";
import { useTransition, useState } from "react";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { secureRoll } from "@/lib/dice";

const QUICK_ACTIONS = ["Attack", "Cast", "Dodge", "Dash"];

function sanitizeInput(input: string): string {
    if (!input) return "";
    let sanitized = input.replace(/[\r\n]+/g, " ").trim();
    if (sanitized.length > 100) {
        sanitized = sanitized.substring(0, 100);
    }
    return sanitized;
}

export default function PlayerActionForm({ characterName, campaignId }: { characterName: string, campaignId: string }) {
    const [isPending, startTransition] = useTransition();
    const [intent, setIntent] = useState("");
    const [roll, setRoll] = useState("");

    const handleRoll = () => {
        setRoll(secureRoll(20).toString());
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const cleanIntent = sanitizeInput(intent);
        let cleanRoll = sanitizeInput(roll);

        if (!cleanIntent) return;

        const content = cleanRoll
            ? `**${characterName}** attempts: **${cleanIntent}** (Roll: **${cleanRoll}**).`
            : `**${characterName}** attempts: **${cleanIntent}**.`;

        startTransition(async () => {
            try {
                const result = await logAction(campaignId, content, "PlayerAction");
                if (result.success) {
                    setIntent("");
                    setRoll("");
                } else {
                    console.error("Failed to log action:", result.error);
                }
            } catch (error) {
                console.error("Unexpected error logging action:", error);
            }
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8 bg-black/40 p-6 rounded-2xl border border-white/5 shadow-lg backdrop-blur-md">
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
                            onClick={() => setIntent(action)}
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
                            onClick={handleRoll}
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
