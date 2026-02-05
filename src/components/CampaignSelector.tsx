'use client';

import { activateCampaign, createCampaign } from "@/app/actions";
import { useTransition, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";

export default function CampaignSelector({ campaigns, activeId }: { campaigns: { id: string, name: string }[], activeId: string }) {
    const [isPending, startTransition] = useTransition();
    const [isCreating, setIsCreating] = useState(false);

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
            }} className="flex items-center gap-2">
                <Input
                    name="name"
                    placeholder="Campaign Name"
                    className="h-8 w-[150px] text-xs bg-agent-navy border-agent-blue/50"
                    autoFocus
                    required
                />
                <Button type="submit" size="sm" variant="agent" disabled={isPending} className="h-8">
                    {isPending ? "..." : "Create"}
                </Button>
                <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setIsCreating(false)}
                    className="h-8 px-2 text-neutral-500"
                >
                    ×
                </Button>
            </form>
        );
    }

    return (
        <div className="flex items-center gap-2">
            <div className="relative">
                <select
                    value={activeId}
                    onChange={handleChange}
                    disabled={isPending}
                    className={cn(
                        "h-8 w-[200px] rounded-md border border-agent-blue/30 bg-agent-navy px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-agent-blue disabled:cursor-not-allowed disabled:opacity-50 text-neutral-100 appearance-none cursor-pointer hover:bg-neutral-800",
                        isPending && "opacity-50"
                    )}
                >
                    {campaigns.map(c => (
                        <option key={c.id} value={c.id}>
                            {c.name}
                        </option>
                    ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-neutral-400">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>
            <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8 border-agent-blue/30 text-agent-blue hover:bg-agent-blue/10"
                onClick={() => setIsCreating(true)}
                title="New Campaign"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </Button>
        </div>
    );
}
