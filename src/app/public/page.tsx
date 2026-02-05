import { prisma } from "@/lib/prisma";
import AutoRefresh from "@/components/AutoRefresh";
import { CharacterWithState } from "@/types";

export const dynamic = 'force-dynamic';

export default async function PublicPage() {
    const campaigns = await prisma.campaign.findMany({
        where: { active: true },
        include: { characters: { where: { type: 'PLAYER' } } }
    });

    const campaign = campaigns[0];

    if (!campaign) return <div className="p-10">Waiting for DM...</div>;

    return (
        <div className="min-h-screen bg-stone-950 text-stone-100 p-8 font-serif bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
            <AutoRefresh />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {campaign.characters.map((char: CharacterWithState) => (
                    <div
                        key={char.id}
                        className={`
                relative overflow-hidden rounded-xl border-2 transition-all duration-500
                ${char.activeTurn
                                ? 'border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.3)] bg-stone-900 scale-105 z-10'
                                : 'border-stone-800 bg-stone-900/80 grayscale-[0.3]'}
            `}
                    >
                        {/* Active Turn Indicator Overlay */}
                        {char.activeTurn && (
                            <div className="absolute inset-0 border-[3px] border-amber-500/50 rounded-xl animate-pulse pointer-events-none"></div>
                        )}

                        {/* Health Bar Background */}
                        <div
                            className={`absolute bottom-0 left-0 h-1.5 transition-all duration-700 ease-out z-0
                  ${char.hp < char.maxHp * 0.3 ? 'bg-red-600 shadow-[0_0_10px_red]' : 'bg-emerald-600 shadow-[0_0_10px_emerald]'}
              `}
                            style={{ width: `${(char.hp / char.maxHp) * 100}%` }}
                        />

                        <div className="relative z-10 p-6 flex flex-col h-full">
                            <div className="mb-4">
                                <h2 className={`text-3xl font-bold mb-1 leading-none ${char.activeTurn ? 'text-amber-500' : 'text-stone-400'}`}>
                                    {char.name}
                                </h2>
                                <p className="text-stone-500 text-lg italic">{char.race} {char.class} <span className="text-xs bg-stone-800 px-1 rounded ml-2">Lvl {char.level}</span></p>
                            </div>

                            <div className="mt-auto flex justify-between items-end border-t border-stone-800 pt-4">
                                <div className="text-center">
                                    <span className="block text-xs text-stone-600 uppercase tracking-widest mb-1">Health</span>
                                    <span className={`text-5xl font-mono font-bold ${char.hp <= 0 ? 'text-red-500' : 'text-stone-200'}`}>
                                        {char.hp}
                                    </span>
                                    <span className="text-xl text-stone-600">/{char.maxHp}</span>
                                </div>

                                <div className="text-center">
                                    <span className="block text-xs text-stone-600 uppercase tracking-widest mb-1">Defense</span>
                                    <span className="text-4xl font-bold text-blue-400/80 font-mono border-2 border-blue-900/30 rounded-full w-12 h-12 flex items-center justify-center bg-blue-950/20">
                                        {char.armorClass}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Current Turn Indicator (Bottom) */}
            <div className="fixed bottom-0 left-0 w-full bg-stone-950/90 border-t border-stone-800 p-6 text-center backdrop-blur-sm">
                {(() => {
                    const activeChar = campaign.characters.find((c: CharacterWithState) => c.activeTurn);
                    return activeChar ? (
                        <h3 className="text-3xl text-amber-500 font-serif tracking-widest uppercase">
                            Current Turn: <span className="font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">{activeChar.name}</span>
                        </h3>
                    ) : (
                        <h3 className="text-xl text-stone-600 animate-pulse">Waiting for Initiative...</h3>
                    );
                })()}
            </div>
        </div>
    );
}
