import { getCharacterWithLogs } from "@/lib/queries";
import { notFound } from "next/navigation";
import AutoRefresh from "@/components/AutoRefresh";
import PlayerHPControls from "@/components/PlayerHPControls";
import PlayerActionForm from "@/components/PlayerActionForm";
import DiceRoller from "@/components/DiceRoller";
import { Card, CardContent } from "@/components/ui/Card";
import Link from "next/link";
import { LogEntry } from "@/types";

export const dynamic = 'force-dynamic';

interface PlayerPageProps {
    params: Promise<{ id: string }>;
}

export default async function PlayerPage({ params }: PlayerPageProps) {
    const { id } = await params;
    const character = await getCharacterWithLogs(id);

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

            <main className="flex-1 p-4 space-y-6 pb-32">
                {/* Visual Section */}
                <div className="relative aspect-square w-full max-w-sm mx-auto rounded-3xl overflow-hidden border-2 border-white/5 shadow-2xl">
                    {character.imageUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={character.imageUrl} alt={character.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-neutral-900 flex items-center justify-center">
                            <svg className="w-20 h-20 text-neutral-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                    )}
                    
                    {/* Active Turn Overlay */}
                    {character.activeTurn && (
                        <div className="absolute inset-0 border-4 border-agent-blue animate-pulse pointer-events-none" />
                    )}
                    
                    {/* Character Name/Class Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 pt-12">
                         <div className="flex justify-between items-end">
                            <div>
                                <h2 className="text-3xl font-black italic tracking-tighter uppercase leading-none">{character.name}</h2>
                                <p className="text-sm text-neutral-400 font-medium mt-1">{character.race} {character.class}</p>
                            </div>
                            <div className="text-right">
                                <span className="block text-[10px] text-neutral-500 uppercase font-bold tracking-widest">Defense</span>
                                <span className="text-3xl font-black text-agent-blue">{character.armorClass}</span>
                            </div>
                         </div>
                    </div>
                </div>

                {/* HP Controls & Status (Combined) */}
                <Card variant="agent" className="bg-agent-navy/40 border-white/5">
                    <CardContent className="p-4">
                        <PlayerHPControls characterId={character.id} currentHp={character.hp} maxHp={character.maxHp} />
                    </CardContent>
                </Card>

                {/* Dice Roller - Moved to prominent position */}
                <DiceRoller campaignId={character.campaignId} rollerName={character.name} />

                {/* Player Actions */}
                <div className="space-y-4">
                    <PlayerActionForm characterName={character.name} campaignId={character.campaignId} />
                </div>

                {/* Attributes Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                        <span className="block text-[10px] text-neutral-500 uppercase font-bold tracking-widest mb-1">Speed</span>
                        <span className="text-2xl font-bold">{character.speed} <span className="text-sm font-normal text-neutral-600">ft</span></span>
                    </div>
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                        <span className="block text-[10px] text-neutral-500 uppercase font-bold tracking-widest mb-1">Initiative</span>
                        <span className="text-2xl font-bold">+{character.initiative}</span>
                    </div>
                </div>

                {/* Recent Events Log */}
                <div className="space-y-3">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-agent-blue rounded-full" />
                        Tactical Log
                    </h3>
                    <Card variant="agent" className="bg-black/40 border-white/5 overflow-hidden">
                        <CardContent className="p-0">
                            <div className="max-h-48 overflow-y-auto font-mono text-[10px] divide-y divide-white/5">
                                {character.logs.length > 0 ? (
                                    character.logs.map((log: LogEntry) => (
                                        <div key={log.id} className="p-3 flex gap-3">
                                            <span className="text-agent-blue shrink-0">[{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}]</span>
                                            <span className="text-neutral-300">{log.content}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-4 text-center text-neutral-600 italic uppercase tracking-widest">
                                        No recent logs
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Active Turn Banner */}
                {character.activeTurn && (
                    <div className="bg-agent-blue p-4 rounded-2xl text-center shadow-[0_0_20px_rgba(43,43,238,0.4)] animate-bounce">
                        <span className="text-sm font-black uppercase tracking-[0.2em]">Your Turn!</span>
                    </div>
                )}
            </main>

            {/* Bottom Navigation / Actions */}
            <nav className="fixed bottom-0 left-0 right-0 p-4 bg-agent-navy/90 backdrop-blur-xl border-t border-white/10 z-30 flex justify-around">
                <Link href={`/player/${id}`} className="flex flex-col items-center gap-1 text-agent-blue group">
                    <div className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl group-active:scale-95 transition-transform">
                        <div className="w-6 h-6 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        </div>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-tighter">Status</span>
                </Link>
                <div className="flex flex-col items-center gap-1 text-neutral-500 opacity-60 group">
                    <div className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl group-active:scale-95 transition-transform">
                        <div className="w-6 h-6 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                        </div>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-tighter">Skills</span>
                </div>
                <div className="flex flex-col items-center gap-1 text-neutral-500 opacity-60 group">
                    <div className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl group-active:scale-95 transition-transform">
                        <div className="w-6 h-6 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                        </div>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-tighter">Inventory</span>
                </div>
            </nav>
        </div>
    );
}
