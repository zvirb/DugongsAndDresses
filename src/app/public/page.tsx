import { Badge } from "@/components/ui/Badge";
import AutoRefresh from "@/components/AutoRefresh";
import { getSpectatorCampaign } from "@/lib/queries";
import { PublicCharacterCard } from "@/components/PublicCharacterCard";
import { SystemClock } from "@/components/SystemClock";

/**
 * CRIER'S JOURNAL - CRITICAL LEARNINGS ONLY
 *
 * ## 2025-05-24 - [View] Blur: [Text too small on TV] Shout: [Bumped font size to 9xl and 7xl]
 * ## 2025-05-25 - [Logic] Secret: [NPCs were hidden but active turn was broken] Shout: [Added 'OPPONENT TURN' indicator using getSpectatorCampaign]
 * ## 2026-02-15 - [View] Blur: [Labels too small] Shout: [Bumped labels to 4xl, Current Turn to 5xl]
 * ## 2025-05-27 - [View] Blur: [Race/Class and Status text too small] Shout: [Bumped to 4xl/5xl, Centered Grid]
 * ## 2025-05-28 - [View] Blur: [Max HP too small, Health Bar too thin] Shout: [Bumped Max HP to 4xl, Bar to h-16, Added Unconscious Overlay]
 * ## 2025-05-29 - [View] Blur: [Updates too slow, turn indicator could be bigger] Shout: [Bumped refresh to 2s, Active Name to 8xl]
 * ## 2025-06-01 - [View] Blur: [Max HP contrast low, Badges small] Shout: [Bumped Max HP to neutral-400, Forced Badge sizes, Enhanced Active Turn Shadow]
 * ## 2025-06-05 - [View] Blur: [Active Turn needs more pop, Unconscious too static] Shout: [Added Shimmer/Heartbeat animations, Bumped Condition Badges to 5xl, Added System Clock]
 * ## 2025-06-08 - [View] Blur: [Clock/Status text too small] Shout: [Bumped to 4xl/neutral-300, Dynamic Turn Glow]
 * ## 2025-06-15 - [View] Blur: [Active Turn needs a face] Shout: [Added Active Portrait to bottom bar]
 */

export const dynamic = 'force-dynamic';

export default async function PublicPage() {
    const campaign = await getSpectatorCampaign();

    if (!campaign) return (
        <div className="min-h-screen bg-agent-navy flex flex-col items-center justify-center p-10 relative overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#2b2bee10_1px,transparent_1px),linear-gradient(to_bottom,#2b2bee10_1px,transparent_1px)] [background-size:20px_20px] opacity-20" />
            <div className="relative z-10 flex flex-col items-center gap-6">
                <div className="w-24 h-24 border-8 border-agent-blue/30 rounded-full border-t-agent-blue animate-spin" />
                <div className="text-agent-blue font-mono tracking-[0.5em] text-7xl animate-pulse font-bold text-center leading-tight">
                    SYSTEM STANDBY // AWAITING INPUT
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-agent-navy text-white font-sans overflow-hidden relative selection:bg-agent-blue/30 selection:text-white">
            {/* Background elements for technical feel */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute inset-0 bg-[repeating-linear-gradient(transparent_0%,transparent_50%,rgba(0,0,0,0.2)_50%,rgba(0,0,0,0.2)_100%)] bg-[length:100%_4px] opacity-40 mix-blend-overlay" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#2b2bee10_1px,transparent_1px),linear-gradient(to_bottom,#2b2bee10_1px,transparent_1px)] [background-size:40px_40px] opacity-10 animate-[pulse_4s_infinite]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#101022_90%)] opacity-90" />
                <div className="absolute top-0 left-0 w-full h-1 bg-agent-blue shadow-[0_0_20px_#2b2bee] animate-scan" />
            </div>

            <AutoRefresh intervalMs={2000} />

            {/* Content Wrapper with subtle movement */}
            <div className="p-8 pb-60 h-full overflow-y-auto border-x border-agent-blue/10 max-w-[1920px] mx-auto bg-black/20 backdrop-blur-sm relative shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                <header className="relative z-10 flex justify-between items-end mb-12 border-b-4 border-agent-blue/30 shadow-[0_0_15px_rgba(43,43,238,0.3)] pb-4 backdrop-blur-md bg-agent-navy/30 -mx-4 px-4 pt-4 rounded-t-xl">
                    <div>
                        <div className="text-agent-blue font-mono text-4xl animate-pulse mb-2 tracking-widest uppercase flex items-center gap-4">
                            <span className="w-4 h-4 bg-agent-blue rounded-full shadow-[0_0_10px_#2b2bee]"></span>
                            SYSTEM STATUS: ONLINE // SECURE CONNECTION
                        </div>
                        <h1 className="text-9xl font-black italic tracking-tighter text-white uppercase leading-none drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                            CAMPAIGN <span className="text-agent-blue drop-shadow-[0_0_20px_rgba(43,43,238,0.5)]">VITALIS</span>
                        </h1>
                        <p className="text-agent-blue font-mono font-bold tracking-[0.2em] uppercase text-6xl mt-4 truncate max-w-4xl opacity-80">
                            {campaign.name} {"//"} ACTIVE ENCOUNTER DATA
                        </p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-2">
                        <Badge variant="agent" className="text-5xl px-8 py-4 font-black uppercase tracking-widest shadow-[0_0_25px_rgba(43,43,238,0.6)] border border-white/10 animate-pulse">
                            System Live
                        </Badge>
                        <div className="text-agent-blue font-mono text-4xl tracking-widest uppercase opacity-80 font-bold drop-shadow-[0_0_5px_rgba(43,43,238,0.5)]">
                            TS: <SystemClock />
                        </div>
                    </div>
                </header>

                <div className="relative z-10 flex flex-wrap justify-center gap-8">
                    {campaign.characters.map((char) => (
                        <div key={char.id} className="w-full md:w-[calc(50%-1rem)] lg:w-[calc(25%-1.5rem)] min-w-[300px]">
                            <PublicCharacterCard character={char} />
                        </div>
                    ))}
                </div>
            </div>

            {/* Current Turn Indicator (Bottom) - Outside floating container */}
            <div className="fixed bottom-0 left-0 w-full bg-agent-navy/95 border-t-4 border-agent-blue p-6 text-center backdrop-blur-2xl z-40 shadow-[0_-20px_60px_rgba(43,43,238,0.3)]">
                {/* Tactical Tab Decoration */}
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-48 h-2 bg-agent-blue shadow-[0_0_20px_rgba(43,43,238,0.8)] [clip-path:polygon(0_0,100%_0,85%_100%,15%_100%)] animate-pulse" />

                {(() => {
                    const activeContestant = campaign.activeContestant;
                    return activeContestant ? (
                        <div className="flex items-center justify-center gap-12 overflow-hidden">
                            <div className="h-px bg-gradient-to-r from-transparent via-agent-blue to-transparent flex-1 hidden lg:block opacity-50" />
                            <div className="relative group cursor-default">
                                <div className={`absolute inset-0 ${activeContestant.type === 'PLAYER' ? 'bg-agent-blue/20' : 'bg-red-500/20'} blur-xl animate-pulse rounded-full opacity-50`} />
                                <div className={`text-7xl lg:text-9xl font-black italic tracking-[0.1em] uppercase text-white ${activeContestant.type === 'PLAYER' ? 'drop-shadow-[0_0_30px_rgba(43,43,238,0.8)]' : 'drop-shadow-[0_0_30px_rgba(220,38,38,0.8)]'} relative z-10 flex items-center gap-6`}>
                                    <span className={`text-6xl font-mono tracking-widest self-center opacity-100 whitespace-nowrap ${activeContestant.type === 'PLAYER' ? 'text-agent-blue drop-shadow-[0_0_10px_rgba(43,43,238,0.5)]' : 'text-red-500 drop-shadow-[0_0_10px_rgba(220,38,38,0.5)]'}`}>CURRENT TURN</span>

                                    {/* Active Portrait */}
                                    {activeContestant.imageUrl && (
                                        <div className={`relative w-28 h-28 lg:w-36 lg:h-36 rounded-full border-4 overflow-hidden shrink-0 shadow-[0_0_30px_rgba(43,43,238,0.6)] ${activeContestant.type === 'PLAYER' ? 'border-agent-blue' : 'border-red-500'}`}>
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={activeContestant.imageUrl} alt="" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                                        </div>
                                    )}

                                    <span className={`bg-black/40 px-8 py-2 rounded-xl border-2 backdrop-blur-md animate-pulse text-7xl lg:text-9xl ${activeContestant.type === 'PLAYER' ? 'text-agent-blue border-agent-blue/50 shadow-[0_0_30px_rgba(43,43,238,0.4)]' : 'text-red-500 border-red-500/50 shadow-[0_0_30px_rgba(220,38,38,0.4)]'} flex items-center gap-4`}>
                                        <span className={`${activeContestant.type === 'PLAYER' ? 'text-agent-blue/50' : 'text-red-500/50'} animate-pulse`}>[</span>
                                        {activeContestant.type === 'PLAYER' ? activeContestant.name : 'OPPONENT TURN'}
                                        <span className={`${activeContestant.type === 'PLAYER' ? 'text-agent-blue/50' : 'text-red-500/50'} animate-pulse`}>]</span>
                                    </span>
                                </div>
                            </div>
                            <div className="h-px bg-gradient-to-r from-transparent via-agent-blue to-transparent flex-1 hidden lg:block opacity-50" />
                        </div>
                    ) : (
                        <h3 className="text-7xl text-neutral-300 font-bold uppercase tracking-[0.5em] animate-pulse italic drop-shadow-md">
                            AWAITING INITIATIVE
                        </h3>
                    );
                })()}
            </div>
        </div>
    );
}
