import { Badge } from "@/components/ui/Badge";
import AutoRefresh from "@/components/AutoRefresh";
import { getPublicCampaign } from "@/lib/queries";
import { PublicCharacterCard } from "@/components/PublicCharacterCard";

/**
 * CRIER'S JOURNAL - CRITICAL LEARNINGS ONLY
 *
 * ## 2025-05-24 - [View] Blur: [Text too small on TV] Shout: [Bumped font size to 9xl and 7xl]
 */

export const dynamic = 'force-dynamic';

export default async function PublicPage() {
    const campaign = await getPublicCampaign();

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
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#2b2bee10_1px,transparent_1px),linear-gradient(to_bottom,#2b2bee10_1px,transparent_1px)] [background-size:40px_40px] opacity-20 animate-[pulse_4s_infinite]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#101022_90%)] opacity-80" />
                <div className="absolute top-0 left-0 w-full h-1 bg-agent-blue shadow-[0_0_20px_#2b2bee] animate-scan" />
            </div>

            <AutoRefresh intervalMs={3000} />

            {/* Content Wrapper with subtle movement */}
            <div className="p-8 pb-60 h-full overflow-y-auto border-x border-agent-blue/10 max-w-[1920px] mx-auto bg-black/20 backdrop-blur-sm relative shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                <header className="relative z-10 flex justify-between items-end mb-12 border-b-4 border-agent-blue/30 pb-4 backdrop-blur-md bg-agent-navy/30 -mx-4 px-4 pt-4 rounded-t-xl">
                    <div>
                        <div className="text-agent-blue font-mono text-sm animate-pulse mb-2 tracking-widest uppercase flex items-center gap-2">
                            <span className="w-2 h-2 bg-agent-blue rounded-full shadow-[0_0_5px_#2b2bee]"></span>
                            SYSTEM STATUS: ONLINE // SECURE CONNECTION
                        </div>
                        <h1 className="text-9xl font-black italic tracking-tighter text-white uppercase leading-none drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                            CAMPAIGN <span className="text-agent-blue drop-shadow-[0_0_20px_rgba(43,43,238,0.5)]">VITALIS</span>
                        </h1>
                        <p className="text-agent-blue font-mono font-bold tracking-[0.2em] uppercase text-6xl mt-4 truncate max-w-4xl opacity-80">
                            {campaign.name} {"//"} ACTIVE ENCOUNTER DATA
                        </p>
                    </div>
                    <div className="text-right">
                        <Badge variant="agent" className="text-3xl px-8 py-4 font-black uppercase tracking-widest shadow-[0_0_25px_rgba(43,43,238,0.6)] border border-white/10 animate-pulse">
                            System Live
                        </Badge>
                    </div>
                </header>

                <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {campaign.characters.map((char) => (
                        <PublicCharacterCard key={char.id} character={char} />
                    ))}
                </div>
            </div>

            {/* Current Turn Indicator (Bottom) - Outside floating container */}
            <div className="fixed bottom-0 left-0 w-full bg-agent-navy/95 border-t-4 border-agent-blue p-6 text-center backdrop-blur-2xl z-40 shadow-[0_-20px_60px_rgba(43,43,238,0.3)]">
                {/* Tactical Tab Decoration */}
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-48 h-2 bg-agent-blue shadow-[0_0_20px_rgba(43,43,238,0.8)] [clip-path:polygon(0_0,100%_0,85%_100%,15%_100%)] animate-pulse" />

                {(() => {
                    const activeChar = campaign.characters.find((c) => c.activeTurn);
                    return activeChar ? (
                        <div className="flex items-center justify-center gap-12 overflow-hidden">
                            <div className="h-px bg-gradient-to-r from-transparent via-agent-blue to-transparent flex-1 hidden lg:block opacity-50" />
                            <div className="relative group cursor-default">
                                <div className="absolute inset-0 bg-agent-blue/20 blur-xl animate-pulse rounded-full opacity-50" />
                                <h3 className="text-7xl lg:text-9xl font-black italic tracking-[0.1em] uppercase text-white drop-shadow-[0_0_30px_rgba(43,43,238,0.8)] relative z-10 flex items-center gap-6">
                                    <span className="text-4xl text-neutral-500 font-mono tracking-widest self-center opacity-70">CURRENT TURN</span>
                                    <span className="text-agent-blue bg-black/40 px-8 py-2 rounded-xl border-2 border-agent-blue/50 shadow-[0_0_30px_rgba(43,43,238,0.4)] backdrop-blur-md">
                                        {activeChar.name}
                                    </span>
                                </h3>
                            </div>
                            <div className="h-px bg-gradient-to-r from-transparent via-agent-blue to-transparent flex-1 hidden lg:block opacity-50" />
                        </div>
                    ) : (
                        <h3 className="text-7xl text-neutral-500 font-bold uppercase tracking-[0.5em] animate-pulse italic drop-shadow-md">
                            AWAITING INITIATIVE
                        </h3>
                    );
                })()}
            </div>
        </div>
    );
}
