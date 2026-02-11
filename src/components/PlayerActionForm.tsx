'use client';

import { logAction } from "@/app/actions";
import { useTransition, useState } from "react";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const cleanIntent = sanitizeInput(intent);
        const cleanRoll = sanitizeInput(roll);

        if (!cleanIntent) return;

        const content = cleanRoll
            ? `**${characterName}** attempts to **${cleanIntent}** (Roll: **${cleanRoll}**).`
            : `**${characterName}** attempts to **${cleanIntent}**.`;

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
                <div className="grid grid-cols-4 gap-2 mb-2">
                    {QUICK_ACTIONS.map((action) => (
                        <Button
                            key={action}
                            type="button"
                            variant="ghost"
                            onClick={() => setIntent(action)}
                            className="h-14 p-2 text-xs font-bold uppercase tracking-wider bg-black/20 border border-white/5 hover:bg-agent-blue/20 hover:border-agent-blue/50 touch-manipulation"
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

            <div className="flex flex-col gap-4">
                <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-[0.2em] text-neutral-500 ml-1">Result (Optional)</label>
                    <Input
                        type="number"
                        placeholder="Dice Roll"
                        value={roll}
                        onChange={(e) => setRoll(e.target.value)}
                        disabled={isPending}
                        className="bg-black/20 border-white/10 focus:border-agent-blue focus:ring-agent-blue/20 h-16 text-lg rounded-xl touch-manipulation"
                    />
                </div>
                <Button
                    type="submit"
                    variant="agent"
                    disabled={isPending || !intent}
                    className="h-16 p-4 w-full rounded-xl uppercase text-lg font-black tracking-widest shadow-[0_0_20px_rgba(43,43,238,0.2)] active:scale-[0.98] transition-transform touch-manipulation"
                >
                    {isPending ? "Transmitting..." : "Execute"}
                </Button>
            </div>
        </form>
    );
}
