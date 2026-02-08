import Link from "next/link";
import AutoRefresh from "@/components/AutoRefresh";
import { getCharacterWithLogs } from "@/lib/queries";
import { notFound } from "next/navigation";
import PlayerBottomNav from "./PlayerBottomNav";

interface LayoutProps {
    children: React.ReactNode;
    params: Promise<{ id: string }>;
}

export default async function PlayerLayout({ children, params }: LayoutProps) {
    const { id } = await params;
    // const character = await getCharacterWithLogs(id);
    const character = {
        name: 'Valerius',
        race: 'Human',
        class: 'Paladin',
        level: 3,
        activeTurn: true,
        type: 'PLAYER'
    };

    if (!character || character.type !== 'PLAYER') {
        notFound();
    }

    return (
        <div className="min-h-[100dvh] bg-agent-navy text-white font-sans flex flex-col">
            <AutoRefresh intervalMs={2000} />

            {/* Header */}
            <header className="p-4 flex items-center justify-between border-b border-white/10 bg-agent-navy/50 backdrop-blur-md sticky top-0 z-20">
                <Link href="/player" className="p-4 -ml-4 text-neutral-400 hover:text-white transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                </Link>
                <div className="text-center flex-1">
                    <h1 className="text-xl font-bold tracking-tight truncate px-4">{character.name}</h1>
                    <p className="text-[10px] text-neutral-500 uppercase tracking-[0.2em] leading-none mt-1">
                        {character.race} {character.class} &bull; LVL {character.level}
                    </p>
                </div>
                <div className="w-10 flex justify-end">
                    {character.activeTurn && (
                        <div className="w-3 h-3 bg-agent-blue rounded-full animate-pulse shadow-[0_0_8px_#2b2bee]" />
                    )}
                </div>
            </header>

            {children}

            {/* Bottom Navigation */}
            <PlayerBottomNav id={id} />
        </div>
    );
}
