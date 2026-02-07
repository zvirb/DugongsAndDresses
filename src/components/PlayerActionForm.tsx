'use client';

import { logAction } from "@/app/actions";
import { useTransition, useState } from "react";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";

export default function PlayerActionForm({ characterName, campaignId }: { characterName: string, campaignId: string }) {
    const [isPending, startTransition] = useTransition();
    const [intent, setIntent] = useState("");
    const [roll, setRoll] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!intent) return;

        const content = `**${characterName}** attempts: ${intent}${roll ? ` (Roll: **${roll}**)` : ""}`;
        
        startTransition(async () => {
            await logAction(campaignId, content, "PlayerAction");
            setIntent("");
            setRoll("");
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 ml-1">Declare Intent</label>
                <Input
                    placeholder="I swing my axe..."
                    value={intent}
                    onChange={(e) => setIntent(e.target.value)}
                    disabled={isPending}
                    className="bg-black/20 border-white/10 focus:border-agent-blue focus:ring-agent-blue/20 h-12 text-sm"
                />
            </div>
            
            <div className="flex gap-4">
                <div className="flex-1 space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 ml-1">Result (Optional)</label>
                    <Input
                        type="number"
                        placeholder="Dice Roll"
                        value={roll}
                        onChange={(e) => setRoll(e.target.value)}
                        disabled={isPending}
                        className="bg-black/20 border-white/10 focus:border-agent-blue focus:ring-agent-blue/20 h-12 text-sm"
                    />
                </div>
                <div className="flex items-end">
                    <Button 
                        type="submit" 
                        variant="agent" 
                        disabled={isPending || !intent}
                        className="h-12 px-6 rounded-xl uppercase text-xs font-black tracking-widest shadow-[0_0_20px_rgba(43,43,238,0.2)]"
                    >
                        {isPending ? "Transmitting..." : "Execute"}
                    </Button>
                </div>
            </div>
        </form>
    );
}