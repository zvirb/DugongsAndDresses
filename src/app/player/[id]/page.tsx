// SCOUT'S JOURNAL - CRITICAL LEARNINGS ONLY
// Format: ## YYYY-MM-DD - [Interaction] Fumble: [Button too small] Path: [Increased padding to p-4]
// ## 2024-05-24 - [ActionForm] Thumb Zone: [Quick Actions too small for thumb] Path: [Increased padding to p-4, text to text-base, added active states]
// ## 2024-05-24 - [HPControls] Legibility: [Numbers hard to read in heat of moment] Path: [Increased to text-4xl/text-3xl]
// ## 2024-05-24 - [DiceRoller] Readability: [Mode toggles squint-inducing] Path: [Bumped to text-sm, increased container padding]
// ## 2025-05-26 - [ActionForm] Thumb Zone: [Inputs and buttons small on mobile] Path: [Increased buttons to h-20, text to text-xl, expanded touch targets]
// ## 2025-05-27 - [Layout] Optimization: [Mobile touch targets and feedback] Path: [Increased padding, gaps, and active states]
// ## 2025-05-29 - [Layout] Viewport: [Bottom content clipped] Path: [Increased padding to pb-40]
// ## 2025-05-30 - [Interaction] Clarity: [Active turn feedback generic] Path: [Changed to ">> YOUR TURN <<"]
// ## 2025-06-05 - [Layout] Hierarchy: [Action form buried below Dice] Path: [Reordered to Status(HP) -> Action -> Dice for combat speed]
// ## 2025-06-09 - [Layout] Thumb Zone: [Critical Actions (Attack/Cast) hard to reach] Path: [Reordered Dice -> ActionForm to fix Critical Actions at viewport bottom]

import { getPlayerDashboard, getCampaignTargets } from "@/lib/queries";
import { notFound } from "next/navigation";
import PlayerHPControls from "@/components/PlayerHPControls";
import PlayerActionForm from "@/components/PlayerActionForm";
import DiceRoller from "@/components/DiceRoller";
import PlayerInitiativeControl from "@/components/PlayerInitiativeControl";
import { Card, CardContent } from "@/components/ui/Card";

export const dynamic = 'force-dynamic';

interface PlayerPageProps {
    params: Promise<{ id: string }>;
}

export default async function PlayerPage({ params }: PlayerPageProps) {
    const { id } = await params;
    const character = await getPlayerDashboard(id);

    if (!character || character.type !== 'PLAYER') {
        notFound();
    }

    // Optimized: Fetch targets separately to allow caching (doesn't change often)
    const allTargets = await getCampaignTargets(character.campaignId);
    const targets = allTargets.filter(t => t.id !== character.id);

    return (
        <main className="flex flex-col p-4 space-y-6 pb-40 min-h-[100dvh] bg-agent-navy relative overflow-x-hidden">
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#2b2bee10_1px,transparent_1px),linear-gradient(to_bottom,#2b2bee10_1px,transparent_1px)] [background-size:20px_20px] opacity-20" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-agent-navy/50 to-agent-navy" />
            </div>

            <div className="relative z-10 h-32 md:h-auto w-full md:aspect-square max-w-sm mx-auto rounded-3xl overflow-hidden border-4 border-white/5 shadow-[0_0_30px_rgba(0,0,0,0.5)] shrink-0 bg-neutral-900 group">
                {character.imageUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={character.imageUrl} alt={character.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500" />
                ) : (
                    <div className="w-full h-full bg-neutral-900 flex items-center justify-center">
                        <svg className="w-20 h-20 text-neutral-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                )}

                {character.activeTurn && (
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute inset-0 border-4 border-agent-blue animate-pulse z-20" />
                        <div className="absolute top-0 left-0 w-full h-1 bg-agent-blue shadow-[0_0_20px_#2b2bee] animate-scan z-20" />
                    </div>
                )}

                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-agent-navy via-agent-navy/90 to-transparent p-6 pt-16 z-10">
                     <div className="flex justify-between items-end">
                        <div>
                            <h2 className="text-3xl font-black italic tracking-tighter uppercase leading-none text-white drop-shadow-md">{character.name}</h2>
                            <p className="text-sm text-agent-blue font-mono font-bold uppercase tracking-widest mt-1">{character.race} // {character.class}</p>
                        </div>
                        <div className="flex gap-4 text-right items-end">
                            <div>
                                <span className="block text-[10px] text-neutral-500 uppercase font-black tracking-widest">Def</span>
                                <span className="text-2xl font-black text-agent-blue drop-shadow-[0_0_10px_rgba(43,43,238,0.5)]">{character.armorClass}</span>
                            </div>
                            <div>
                                <span className="block text-[10px] text-neutral-500 uppercase font-black tracking-widest">Spd</span>
                                <span className="text-2xl font-black text-white">{character.speed}</span>
                            </div>
                            <div>
                                <span className="block text-[10px] text-neutral-500 uppercase font-black tracking-widest">Init</span>
                                <span className="text-2xl font-black text-white">+{character.initiative}</span>
                            </div>
                        </div>
                     </div>
                </div>
            </div>

            <div className="space-y-3 shrink-0 relative z-10">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-neutral-500 flex items-center gap-2 ml-1">
                    <span className="w-1.5 h-1.5 bg-agent-blue rounded-full shadow-[0_0_5px_#2b2bee]" />
                    Tactical Log
                </h3>
                <Card variant="agent" className="bg-black/40 border border-agent-blue/20 overflow-hidden shadow-[0_0_15px_rgba(43,43,238,0.1)] backdrop-blur-sm">
                    <CardContent className="p-0">
                        <div className="max-h-48 overflow-y-auto font-mono text-sm divide-y divide-white/5 scrollbar-thin scrollbar-thumb-agent-blue/20 scrollbar-track-transparent">
                            {character.logs.length > 0 ? (
                                character.logs.map((log) => (
                                    <div key={log.id} className="p-3 flex gap-3 hover:bg-white/5 transition-colors">
                                        <span className="text-agent-blue shrink-0 opacity-70">[{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}]</span>
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

            <div className="shrink-0 relative z-10">
                <PlayerInitiativeControl
                    characterId={character.id}
                    characterName={character.name}
                    initiativeRoll={character.initiativeRoll}
                    initiativeBonus={character.initiative}
                />
            </div>

            <div className="mt-auto space-y-6 relative z-10">
                {character.activeTurn && (
                    <div className="relative overflow-hidden bg-agent-blue p-4 rounded-2xl text-center shadow-[0_0_30px_rgba(43,43,238,0.5)] animate-pulse border border-white/20">
                        <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)] animate-[scan_2s_linear_infinite]" />
                        <span className="relative z-10 text-sm font-black uppercase tracking-[0.3em] text-white drop-shadow-md">
                            &gt;&gt; YOUR TURN &lt;&lt;
                        </span>
                    </div>
                )}

                <Card variant="agent" className="bg-agent-navy/60 border-white/10 backdrop-blur-md shadow-lg">
                    <CardContent className="p-4">
                        <PlayerHPControls characterId={character.id} currentHp={character.hp} maxHp={character.maxHp} />
                    </CardContent>
                </Card>

                <DiceRoller campaignId={character.campaignId} rollerName={character.name} />

                <div className="space-y-4">
                    <PlayerActionForm
                        characterName={character.name}
                        campaignId={character.campaignId}
                        characterId={character.id}
                        targets={targets}
                    />
                </div>
            </div>
        </main>
    );
}
