import { Badge } from "@/components/ui/Badge";
import AutoRefresh from "@/components/AutoRefresh";
import { getPublicCampaign } from "@/lib/queries";
import { PublicCharacterCard } from "@/components/PublicCharacterCard";

export const dynamic = 'force-dynamic';

export default async function PublicPage() {
    const campaign = await getPublicCampaign();

    if (!campaign) return (
        <div className="min-h-screen bg-agent-navy flex flex-col items-center justify-center p-10 relative overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#2b2bee10_1px,transparent_1px),linear-gradient(to_bottom,#2b2bee10_1px,transparent_1px)] [background-size:20px_20px] opacity-20" />
            <div className="relative z-10 flex flex-col items-center gap-6">
                <div className="w-24 h-24 border-8 border-agent-blue/30 rounded-full border-t-agent-blue animate-spin" />
                <div className="text-agent-blue font-mono tracking-[0.5em] text-6xl animate-pulse font-bold text-center leading-tight">
                    SYSTEM STANDBY // AWAITING INPUT
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-agent-navy text-white font-sans overflow-hidden relative">
            {/* Background elements for technical feel */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#2b2bee20_1px,transparent_1px),linear-gradient(to_bottom,#2b2bee20_1px,transparent_1px)] [background-size:40px_40px] opacity-20" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#101022_100%)] opacity-80" />
            </div>

            <AutoRefresh intervalMs={3000} />

            {/* Content Wrapper with Float Animation */}
            <div className="p-8 pb-60 animate-float h-full overflow-y-auto border-x border-agent-blue/20 max-w-[1920px] mx-auto bg-black/10 backdrop-blur-sm">
                <header className="relative z-10 flex justify-between items-end mb-12 border-b-4 border-agent-blue/30 pb-4">
                    <div>
                        <div className="text-agent-blue font-mono text-sm animate-pulse mb-2 tracking-widest">SYSTEM STATUS: ONLINE // SECURE CONNECTION</div>
                        <h1 className="text-8xl font-black italic tracking-tighter text-white uppercase leading-none">
                            CAMPAIGN <span className="text-agent-blue">VITALIS</span>
                        </h1>
                        <p className="text-agent-blue font-bold tracking-[0.2em] uppercase text-4xl mt-4 truncate max-w-4xl">
                            {campaign.name} {"//"} Active Encounter Data
                        </p>
                    </div>
                    <div className="text-right">
                        <Badge variant="agent" className="text-3xl px-6 py-3 font-black uppercase tracking-widest">
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
            <div className="fixed bottom-0 left-0 w-full bg-agent-navy/95 border-t-4 border-agent-blue p-6 text-center backdrop-blur-2xl z-40 shadow-[0_-10px_40px_rgba(43,43,238,0.2)]">
                {/* Tactical Tab Decoration */}
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-32 h-2 bg-agent-blue shadow-[0_0_15px_rgba(43,43,238,0.6)] [clip-path:polygon(0_0,100%_0,80%_100%,20%_100%)]" />

                {(() => {
                    const activeChar = campaign.characters.find((c) => c.activeTurn);
                    return activeChar ? (
                        <div className="flex items-center justify-center gap-12 overflow-hidden">
                            <div className="h-1 bg-agent-blue/50 flex-1 hidden lg:block shadow-[0_0_10px_#2b2bee]" />
                            <h3 className="text-6xl lg:text-8xl font-black italic tracking-[0.1em] uppercase text-white drop-shadow-[0_0_20px_rgba(43,43,238,0.5)] relative z-10">
                                ACTIVE: <span className="text-agent-blue underline decoration-8 underline-offset-[16px] bg-agent-blue/10 px-4 rounded-lg animate-pulse inline-block">{activeChar.name}</span>
                            </h3>
                            <div className="h-1 bg-agent-blue/50 flex-1 hidden lg:block shadow-[0_0_10px_#2b2bee]" />
                        </div>
                    ) : (
                        <h3 className="text-5xl text-neutral-500 font-bold uppercase tracking-[0.5em] animate-pulse italic">
                            Awaiting Initiative...
                        </h3>
                    );
                })()}
            </div>
        </div>
    );
}
