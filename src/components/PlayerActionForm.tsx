'use client';

import { logAction } from "@/app/actions";
import { useTransition, useState } from "react";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { secureRoll } from "@/lib/dice";

const QUICK_ACTIONS = ["Attack", "Cast", "Dodge", "Dash"];

function sanitizeInput(input: string): string {
    if (!input) return "";
    // Remove newlines and trim to prevent log formatting issues
    let sanitized = input.replace(/[\r\n]+/g, " ").trim();
    // Limit length to prevent excessive log entries
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

        // Ensure roll is strictly numeric if provided
        if (cleanRoll && isNaN(Number(cleanRoll))) {
            cleanRoll = "";
        }

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
                    // Keep inputs so user can retry
                }
            } catch (error) {
                console.error("Unexpected error logging action:", error);
            }
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-[0.2em] text-neutral-500 ml-1">Declare Intent</label>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                    {QUICK_ACTIONS.map((action) => (
                        <Button
                            key={action}
                            type="button"
                            variant="ghost"
                            onClick={() => setIntent(action)}
                            className="h-20 p-4 text-lg font-bold uppercase tracking-wider bg-black/20 border border-white/5 hover:bg-agent-blue/20 hover:border-agent-blue/50 active:bg-agent-blue/40 active:scale-[0.96] transition-all touch-manipulation"
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
                    className="bg-black/20 border-white/10 focus:border-agent-blue focus:ring-agent-blue/20 h-16 text-lg rounded-xl touch-manipulation"
                />
            </div>

            <div className="flex flex-col gap-6">
                <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-[0.2em] text-neutral-500 ml-1">Result (Optional)</label>
                    <div className="flex gap-3">
                        <Input
                            type="number"
                            placeholder="Dice Roll"
                            value={roll}
                            onChange={(e) => setRoll(e.target.value)}
                            disabled={isPending}
                            className="bg-black/20 border-white/10 focus:border-agent-blue focus:ring-agent-blue/20 h-20 text-xl rounded-xl touch-manipulation flex-1"
                        />
                        <Button
                            type="button"
                            onClick={handleRoll}
                            disabled={isPending}
                            className="h-20 flex-1 bg-agent-blue/20 border border-agent-blue/50 text-agent-blue text-lg font-black rounded-xl uppercase tracking-widest hover:bg-agent-blue/40 active:scale-[0.96] transition-transform"
                        >
                            Roll D20
                        </Button>
                    </div>
                </div>
                <Button
                    type="submit"
                    variant="agent"
                    disabled={isPending || !intent}
                    className="h-20 p-4 w-full rounded-xl uppercase text-2xl font-black tracking-widest shadow-[0_0_20px_rgba(43,43,238,0.2)] active:scale-[0.96] transition-transform touch-manipulation"
                >
                    {isPending ? "Transmitting..." : "Execute"}
                </Button>
            </div>
        </form>
    );
}
