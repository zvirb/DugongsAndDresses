import { getPlayerInventory } from "@/lib/queries";
import { notFound } from "next/navigation";
import { parseInventory } from "@/lib/safe-json";
import { Card, CardContent } from "@/components/ui/Card";

export const dynamic = 'force-dynamic';

interface InventoryPageProps {
    params: Promise<{ id: string }>;
}

export default async function InventoryPage({ params }: InventoryPageProps) {
    const { id } = await params;
    const character = await getPlayerInventory(id);

    if (!character || character.type !== 'PLAYER') {
        notFound();
    }

    const inventory = parseInventory(character.inventory);

    return (
        <main className="flex-1 p-4 space-y-6 pb-32">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-agent-blue rounded-full" />
                Inventory
            </h2>

            {inventory.length === 0 ? (
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
            ) : (
                <div className="space-y-2">
                    {inventory.map((item, i) => (
                        <Card key={i} variant="agent" className="bg-agent-navy/40 border-white/5">
                            <CardContent className="p-4 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-agent-blue">
                                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                                    </svg>
                                </div>
                                <span className="text-white font-medium">{item}</span>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </main>
    );
}
