import { getPlayerInventory } from "@/lib/queries";
import { notFound } from "next/navigation";
import { parseInventory } from "@/lib/safe-json";
import PlayerInventoryList from "@/components/PlayerInventoryList";

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

            <PlayerInventoryList
                characterId={character.id}
                characterName={character.name}
                campaignId={character.campaignId}
                inventory={inventory}
            />
        </main>
    );
}
