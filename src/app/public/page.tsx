import { Badge } from "@/components/ui/Badge";
import AutoRefresh from "@/components/AutoRefresh";
import { getPublicCampaign } from "@/lib/queries";

export const dynamic = 'force-dynamic';

export default async function PublicPage() {
    const campaign = await getPublicCampaign();

    if (!campaign) return (
        <div className="min-h-screen bg-agent-navy text-agent-blue flex items-center justify-center p-10 font-sans italic font-black text-6xl animate-pulse">
            WAITING FOR DM...
        </div>
    );

    return (
        <div className="min-h-screen bg-agent-navy text-white font-sans overflow-hidden relative">
            {/* Background elements for technical feel */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#2b2bee_1px,transparent_1px)] [background-size:60px_60px]" />
                <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-agent-blue/10 to-transparent" />
            </div>

            <AutoRefresh intervalMs={2000} />

            {/* Content Wrapper with Float Animation */}
            <div className="p-8 pb-60 animate-float h-full overflow-y-auto">
                <header className="relative z-10 flex justify-between items-end mb-12 border-b-4 border-agent-blue/30 pb-4">
                    <div>
                        <h1 className="text-8xl font-black italic tracking-tighter text-white uppercase leading-none">
                            CAMPAIGN <span className="text-agent-blue">VITALIS</span>
                        </h1>
                        <p className="text-agent-blue font-bold tracking-[0.2em] uppercase text-3xl mt-4 truncate max-w-4xl">
                            {campaign.name} {"//"} Active Encounter Data
                        </p>
                    </div>
                    <div className="text-right">
                        <Badge variant="agent" className="text-2xl px-6 py-3 font-black uppercase tracking-widest">
                            System Live
                        </Badge>
                    </div>
                </header>

                <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {campaign.characters.map((char) => (
                        <div
                            key={char.id}
                            className={`
                    relative overflow-hidden rounded-3xl border-4 transition-all duration-700
                    ${char.activeTurn
                                    ? 'border-agent-blue shadow-[0_0_60px_rgba(43,43,238,0.6)] bg-agent-navy/90 scale-105 z-20 ring-4 ring-agent-blue/50'
                                    : 'border-white/5 bg-white/5 grayscale-[0.2] hover:grayscale-0 hover:border-white/10'}
                `}
                        >
                            {/* Active Turn Scanner Effect */}
                            {char.activeTurn && (
                                <div className="absolute inset-0 pointer-events-none">
                                    <div className="absolute top-0 left-0 w-full h-2 bg-agent-blue shadow-[0_0_25px_#2b2bee] animate-scan" />
                                    <div className="absolute inset-0 border-4 border-agent-blue/50 rounded-3xl animate-pulse" />
                                </div>
                            )}

                            <div className="relative z-10 p-6 flex flex-col h-full min-h-[450px]">
                                {/* Portrait Background */}
                                {char.imageUrl && (
                                    <div className="absolute inset-0 z-[-1] opacity-40">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={char.imageUrl} alt="" className="w-full h-full object-cover grayscale" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-agent-navy via-agent-navy/50 to-transparent" />
                                    </div>
                                )}

                                <div className="mb-auto">
                                    <div className="flex justify-between items-start mb-4">
                                        <Badge variant={char.activeTurn ? 'agent' : 'player'} className="font-black italic text-2xl px-3 py-1">
                                            LVL {char.level}
                                        </Badge>
                                        <div className="text-right">
                                            <span className="block text-xl text-neutral-400 uppercase font-black tracking-widest mb-1">Defense</span>
                                            <span className={`text-6xl font-black leading-none ${char.activeTurn ? 'text-agent-blue' : 'text-white'}`}>{char.armorClass}</span>
                                        </div>
                                    </div>

                                    <h2 className={`text-4xl font-black italic tracking-tighter uppercase mb-2 leading-none break-words ${char.activeTurn ? 'text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'text-neutral-300'}`}>
                                        {char.name}
                                    </h2>
                                    <p className="text-agent-blue text-2xl font-bold uppercase tracking-widest mb-8">
                                        {char.race} {"//"} {char.class}
                                    </p>
                                </div>

                                <div className="mt-8">
                                    <div className="flex justify-between items-end mb-4">
                                        <span className="text-xl text-neutral-400 uppercase font-black tracking-[0.2em]">Vitality</span>
                                        <div className="text-right flex items-baseline justify-end">
                                            <span className={`text-7xl font-black italic tracking-tighter leading-none ${char.hp <= 0 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                                                {char.hp}
                                            </span>
                                            <span className="text-3xl text-neutral-500 font-bold ml-2">/ {char.maxHp}</span>
                                        </div>
                                    </div>

                                    {/* Health Bar */}
                                    <div className="h-6 bg-white/5 rounded-full overflow-hidden p-1 border-2 border-white/10 shadow-inner">
                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden ${char.hp <= char.maxHp * 0.2 ? 'bg-red-600 shadow-[0_0_20px_rgba(220,38,38,0.8)]' : 'bg-agent-blue shadow-[0_0_20px_rgba(43,43,238,0.4)]'
                                                }`}
                                            style={{ width: `${Math.min(100, (char.hp / char.maxHp) * 100)}%` }}
                                        >
                                            <div className="absolute inset-0 bg-white/20 animate-[pulse_2s_infinite]" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Current Turn Indicator (Bottom) - Outside floating container */}
            <div className="fixed bottom-0 left-0 w-full bg-agent-navy/95 border-t-4 border-agent-blue p-6 text-center backdrop-blur-2xl z-40 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
                {(() => {
                    const activeChar = campaign.characters.find((c) => c.activeTurn);
                    return activeChar ? (
                        <div className="flex items-center justify-center gap-12 overflow-hidden">
                            <div className="h-1 bg-agent-blue/50 flex-1 hidden lg:block shadow-[0_0_10px_#2b2bee]" />
                            <h3 className="text-6xl lg:text-8xl font-black italic tracking-[0.1em] uppercase text-white animate-pulse drop-shadow-[0_0_20px_rgba(43,43,238,0.5)]">
                                ACTIVE: <span className="text-agent-blue underline decoration-8 underline-offset-[16px]">{activeChar.name}</span>
                            </h3>
                            <div className="h-1 bg-agent-blue/50 flex-1 hidden lg:block shadow-[0_0_10px_#2b2bee]" />
                        </div>
                    ) : (
                        <h3 className="text-4xl text-neutral-500 font-bold uppercase tracking-[0.5em] animate-pulse italic">
                            Awaiting Initiative...
                        </h3>
                    );
                })()}
            </div>
        </div >
    );
}
