'use client';

import { activateCampaign } from "@/app/actions";
import { useTransition } from "react";
import { cn } from "@/lib/utils";

export default function CampaignSelector({ campaigns, activeId }: { campaigns: { id: string, name: string }[], activeId: string }) {
    const [isPending, startTransition] = useTransition();

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = e.target.value;
        if (id && id !== activeId) {
            startTransition(async () => {
                await activateCampaign(id);
            });
        }
    };

    return (
        <div className="relative">
            <select
                value={activeId}
                onChange={handleChange}
                disabled={isPending}
                className={cn(
                    "h-8 w-[200px] rounded-md border border-neutral-600 bg-neutral-800 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500 disabled:cursor-not-allowed disabled:opacity-50 text-neutral-100 appearance-none cursor-pointer hover:bg-neutral-700",
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
    );
}
