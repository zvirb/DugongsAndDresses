import { getCharacterWithLogs } from "@/lib/queries";
import { notFound } from "next/navigation";
import PlayerHPControls from "@/components/PlayerHPControls";
import PlayerActionForm from "@/components/PlayerActionForm";
import DiceRoller from "@/components/DiceRoller";
import { Card, CardContent } from "@/components/ui/Card";

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

            {/* HP Controls & Status */}
            <Card variant="agent" className="bg-agent-navy/40 border-white/5">
                <CardContent className="p-4">
                    <PlayerHPControls characterId={character.id} currentHp={character.hp} maxHp={character.maxHp} />
                </CardContent>
            </Card>

            {/* Dice Roller */}
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
                                character.logs.map((log) => (
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
    );
}
