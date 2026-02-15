'use client';

import { useTransition, useState } from 'react';
import { removeInventoryItem, logAction } from '@/app/actions';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface PlayerInventoryListProps {
    characterId: string;
    characterName: string;
    campaignId: string;
    inventory: string[];
}

export default function PlayerInventoryList({ characterId, characterName, campaignId, inventory }: PlayerInventoryListProps) {
    const [isPending, startTransition] = useTransition();
    const [processingItem, setProcessingItem] = useState<string | null>(null);

    const handleUse = (item: string) => {
        if (isPending) return;

        // ARTIFICER: Added consumption logic
        const shouldConsume = confirm(`Consume ${item}? (Cancel to use without removing)`);

        setProcessingItem(item);
        startTransition(async () => {
            try {
                if (shouldConsume) {
                    await removeInventoryItem(characterId, item);
                    await logAction(campaignId, `**${characterName}** consumes **${item}**.`, "PlayerAction");
                } else {
                    await logAction(campaignId, `**${characterName}** employs **${item}**.`, "PlayerAction");
                }
            } catch (e) {
                console.error("Failed to use item:", e);
            } finally {
                setProcessingItem(null);
            }
        });
    };

    const handleDrop = (item: string) => {
        if (!confirm(`Drop ${item}?`) || isPending) return;
        setProcessingItem(item);
        startTransition(async () => {
            try {
                await removeInventoryItem(characterId, item);
            } catch (e) {
                console.error("Failed to drop item:", e);
            } finally {
                setProcessingItem(null);
            }
        });
    };

    if (inventory.length === 0) {
        return (
            <Card variant="agent" className="bg-agent-navy/40 border-white/5">
                <CardContent className="p-8 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-neutral-700 mb-4">
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                        <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                        <line x1="12" y1="22.08" x2="12" y2="12"/>
                    </svg>
                    <p className="text-neutral-500 italic uppercase tracking-widest text-xs">Your pack is empty</p>
                    <p className="text-neutral-600 text-xs mt-2">Items will appear here when the DM adds them.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-2">
            {inventory.map((item, i) => (
                <Card key={i} variant="agent" className="bg-agent-navy/40 border-white/5">
                    <CardContent className="p-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-agent-blue">
                                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                                </svg>
                            </div>
                            <span className="text-white font-medium">{item}</span>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                variant="agent"
                                disabled={isPending}
                                onClick={() => handleUse(item)}
                                className="h-8 px-3 text-xs"
                            >
                                {processingItem === item ? '...' : 'Use'}
                            </Button>
                            <Button
                                size="sm"
                                variant="destructive"
                                disabled={isPending}
                                onClick={() => handleDrop(item)}
                                className="h-8 px-3 text-xs"
                            >
                                Drop
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
