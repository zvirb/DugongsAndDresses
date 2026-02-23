'use client';

import { activateCampaign, createCampaign, deleteCampaign, updateCampaign } from "@/app/actions";
import { useTransition, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";

export default function CampaignSelector({ campaigns, activeId }: { campaigns: { id: string, name: string }[], activeId: string }) {
    const [isPending, startTransition] = useTransition();
    const [isCreating, setIsCreating] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = e.target.value;
        if (id && id !== activeId) {
            startTransition(async () => {
                await activateCampaign(id);
            });
        }
    };

    if (isCreating) {
        return (
            <form action={async (formData) => {
                startTransition(async () => {
                    await createCampaign(formData);
                    setIsCreating(false);
                });
            }} className="flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                <Input
                    name="name"
                    placeholder="New Operation..."
                    className="h-8 w-[180px] text-xs bg-black/50 border-agent-blue/50 text-agent-blue placeholder:text-agent-blue/40 font-mono focus:bg-black/80 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]"
                    autoFocus
                    required
                />
                <Button type="submit" size="sm" variant="agent" disabled={isPending} className="h-8 shadow-[0_0_10px_rgba(43,43,238,0.3)]">
                    {isPending ? "..." : "INIT"}
                </Button>
                <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setIsCreating(false)}
                    className="h-8 w-8 p-0 text-agent-blue/60 hover:text-red-400 hover:bg-red-900/20 rounded-full"
                >
                    ×
                </Button>
            </form>
        );
    }

    if (isEditing) {
        const currentName = campaigns.find(c => c.id === activeId)?.name || "";
        return (
            <form action={async (formData) => {
                const name = formData.get('name') as string;
                if (name && name !== currentName) {
                    startTransition(async () => {
                        await updateCampaign(activeId, name);
                        setIsEditing(false);
                    });
                } else {
                    setIsEditing(false);
                }
            }} className="flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                <Input
                    name="name"
                    defaultValue={currentName}
                    className="h-8 w-[180px] text-xs bg-black/50 border-agent-blue/50 text-agent-blue placeholder:text-agent-blue/40 font-mono focus:bg-black/80 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]"
                    autoFocus
                    required
                />
                <Button type="submit" size="sm" variant="agent" disabled={isPending} className="h-8 shadow-[0_0_10px_rgba(43,43,238,0.3)]">
                    {isPending ? "..." : "SAVE"}
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(false)}
                    className="h-8 w-8 p-0 text-agent-blue/60 hover:text-red-400 hover:bg-red-900/20 rounded-full"
                >
                    ×
                </Button>
            </form>
        );
    }

    return (
        <div className="flex items-center gap-2">
            <div className="relative group">
                <select
                    value={activeId}
                    onChange={handleChange}
                    disabled={isPending}
                    className={cn(
                        "h-8 w-[200px] rounded-md border border-agent-blue/30 bg-black/50 px-3 py-1 text-sm shadow-sm transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-agent-blue disabled:cursor-not-allowed disabled:opacity-50 text-agent-blue appearance-none cursor-pointer hover:bg-agent-blue/10 hover:border-agent-blue/60 font-bold uppercase tracking-wider backdrop-blur-sm",
                        isPending && "opacity-50"
                    )}
                >
                    {campaigns.map(c => (
                        <option key={c.id} value={c.id} className="bg-agent-navy text-agent-blue font-bold">
                            {c.name}
                        </option>
                    ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-agent-blue/50 group-hover:text-agent-blue transition-colors">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>
            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-agent-blue/60 hover:text-white hover:bg-agent-blue/10 transition-all"
                onClick={() => setIsEditing(true)}
                disabled={isPending || !activeId}
                title="Rename Campaign"
            >
               <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
            </Button>
            <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8 border-agent-blue/30 text-agent-blue hover:bg-agent-blue/10 hover:text-white hover:border-agent-blue transition-all shadow-[0_0_10px_rgba(43,43,238,0.1)] hover:shadow-[0_0_15px_rgba(43,43,238,0.3)]"
                onClick={() => setIsCreating(true)}
                title="New Campaign"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </Button>
            <Button
                variant="destructive"
                size="icon"
                className="h-8 w-8 text-red-400 border-red-500/30 hover:bg-red-900/20 hover:text-white hover:border-red-500 transition-all"
                onClick={async () => {
                    if (confirm("Are you sure you want to delete this campaign? This cannot be undone.")) {
                         startTransition(async () => {
                            await deleteCampaign(activeId);
                        });
                    }
                }}
                disabled={isPending || !activeId}
                title="Delete Campaign"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
            </Button>
        </div>
    );
}
