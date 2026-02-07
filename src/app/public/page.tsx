import { Badge } from "@/components/ui/Badge";
import AutoRefresh from "@/components/AutoRefresh";
import { getPublicCampaign } from "@/lib/queries";

export const dynamic = 'force-dynamic';

export default async function PublicPage() {
    const campaign = await getPublicCampaign();

    if (!campaign) return (
        <div className="min-h-screen bg-agent-navy text-agent-blue flex items-center justify-center p-10 font-sans italic font-black text-4xl animate-pulse">
            WAITING FOR DM...
        </div>
    );

    return (
        <div className="min-h-screen bg-agent-navy text-white p-8 font-sans overflow-hidden relative animate-float">
            {/* Background elements for technical feel */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#2b2bee_1px,transparent_1px)] [background-size:40px_40px]" />
                <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-agent-blue/10 to-transparent" />
            </div>

            <AutoRefresh />

            <header className="relative z-10 flex justify-between items-end mb-12 border-b-2 border-agent-blue/30 pb-4">
                <div>
                    <h1 className="text-6xl font-black italic tracking-tighter text-white uppercase leading-none">
                        CAMPAIGN <span className="text-agent-blue">VITALIS</span>
                    </h1>
                    <p className="text-agent-blue font-bold tracking-[0.4em] uppercase text-xl mt-2">
                        {campaign.name} {"//"} Active Encounter Data
                    </p>
                </div>
                <div className="text-right">
                    <Badge variant="agent" className="text-lg px-4 py-2 font-black uppercase tracking-widest">
                        System Live
                    </Badge>
                </div>
            </header>

            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {campaign.characters.map((char) => (
                    <div
                        key={char.id}
                        className={`
                relative overflow-hidden rounded-2xl border-2 transition-all duration-700
                ${char.activeTurn
                                ? 'border-agent-blue shadow-[0_0_40px_rgba(43,43,238,0.4)] bg-agent-navy/90 scale-105 z-10'
                                : 'border-white/5 bg-white/5 grayscale-[0.2] hover:grayscale-0 hover:border-white/10'}
            `}
                    >
                        {/* Active Turn Scanner Effect */}
                        {char.activeTurn && (
                            <div className="absolute inset-0 pointer-events-none">
                                <div className="absolute top-0 left-0 w-full h-1 bg-agent-blue shadow-[0_0_15px_#2b2bee] animate-scan" />
                                <div className="absolute inset-0 border-2 border-agent-blue/50 rounded-2xl animate-pulse" />
                            </div>
                        )}

                        <div className="relative z-10 p-6 flex flex-col h-full min-h-[400px]">
                            {/* Portrait Background */}
                            {char.imageUrl && (
                                <div className="absolute inset-0 z-[-1] opacity-40">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={char.imageUrl} alt="" className="w-full h-full object-cover grayscale" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-agent-navy via-agent-navy/40 to-transparent" />
                                </div>
                            )}

                            <div className="mb-auto">
                                <div className="flex justify-between items-start mb-4">
                                    <Badge variant={char.activeTurn ? 'agent' : 'player'} className="font-black italic text-lg">
                                        LVL {char.level}
                                    </Badge>
                                    <div className="text-right">
                                        <span className="block text-xl text-neutral-500 uppercase font-black tracking-widest">Defense</span>
                                        <span className={`text-5xl font-black ${char.activeTurn ? 'text-agent-blue' : 'text-white'}`}>{char.armorClass}</span>
                                    </div>
                                </div>

                                <h2 className={`text-5xl font-black italic tracking-tighter uppercase mb-1 leading-none ${char.activeTurn ? 'text-white' : 'text-neutral-400'}`}>
                                    {char.name}
                                </h2>
                                <p className="text-agent-blue text-2xl font-bold uppercase tracking-widest mb-6">
                                    {char.race} {"//"} {char.class}
                                </p>
                            </div>

                            <div className="mt-8">
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-xl text-neutral-500 uppercase font-black tracking-[0.2em]">Vitality Status</span>
                                    <div className="text-right">
                                        <span className={`text-6xl font-black italic tracking-tighter ${char.hp <= 0 ? 'text-red-500' : 'text-white'}`}>
                                            {char.hp}
                                        </span>
                                        <span className="text-2xl text-neutral-600 font-bold ml-1">/ {char.maxHp}</span>
                                    </div>
                                </div>

                                {/* Health Bar */}
                                <div className="h-3 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/10">
                                    <div
                                        className={`h-full rounded-full transition-all duration-1000 ease-out ${char.hp <= char.maxHp * 0.2 ? 'bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.6)]' : 'bg-agent-blue'
                                            }`}
                                        style={{ width: `${Math.min(100, (char.hp / char.maxHp) * 100)}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Current Turn Indicator (Bottom) */}
            <div className="fixed bottom-0 left-0 w-full bg-agent-navy/90 border-t-2 border-agent-blue/50 p-6 text-center backdrop-blur-xl z-30">
                {(() => {
                    const activeChar = campaign.characters.find((c) => c.activeTurn);
                    return activeChar ? (
                        <div className="flex items-center justify-center gap-8 overflow-hidden">
                            <div className="h-px bg-agent-blue/50 flex-1 hidden md:block" />
                            <h3 className="text-7xl font-black italic tracking-[0.2em] uppercase text-white animate-pulse">
                                ACTIVE: <span className="text-agent-blue underline decoration-4 underline-offset-8">{activeChar.name}</span>
                            </h3>
                            <div className="h-px bg-agent-blue/50 flex-1 hidden md:block" />
                        </div>
                    ) : (
                        <h3 className="text-4xl text-neutral-600 font-bold uppercase tracking-[0.5em] animate-pulse italic">
                            Awaiting Initiative...
                        </h3>
                    );
                })()}
            </div>
        </div >
    );
}
