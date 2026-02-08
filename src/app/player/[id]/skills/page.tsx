import { getPlayerSkills } from "@/lib/queries";
import { notFound } from "next/navigation";
import { parseAttributes } from "@/lib/safe-json";
import { Card, CardContent } from "@/components/ui/Card";

export const dynamic = 'force-dynamic';

interface SkillsPageProps {
    params: Promise<{ id: string }>;
}

const ABILITY_NAMES: Record<string, string> = {
    str: 'Strength',
    dex: 'Dexterity',
    con: 'Constitution',
    int: 'Intelligence',
    wis: 'Wisdom',
    cha: 'Charisma',
};

function calcModifier(score: number): string {
    const mod = Math.floor((score - 10) / 2);
    return mod >= 0 ? `+${mod}` : `${mod}`;
}

export default async function SkillsPage({ params }: SkillsPageProps) {
    const { id } = await params;
    const character = await getPlayerSkills(id);

    if (!character || character.type !== 'PLAYER') {
        notFound();
    }

    const attrs = parseAttributes(character.attributes);
    const abilityOrder = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

    return (
        <main className="flex-1 p-4 space-y-6 pb-32">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-agent-blue rounded-full" />
                Ability Scores
            </h2>

            <div className="grid grid-cols-2 gap-4">
                {abilityOrder.map(key => {
                    const score = attrs[key] ?? 10;
                    const mod = calcModifier(score);
                    const name = ABILITY_NAMES[key] || key.toUpperCase();

                    return (
                        <Card key={key} variant="agent" className="bg-agent-navy/40 border-white/5 overflow-hidden">
                            <CardContent className="p-4 text-center">
                                <span className="block text-[10px] text-neutral-500 uppercase font-bold tracking-widest mb-2">{name}</span>
                                <span className="block text-4xl font-black text-white">{score}</span>
                                <span className={`block text-lg font-bold mt-1 ${mod.startsWith('+') ? 'text-agent-blue' : 'text-red-400'}`}>
                                    {mod}
                                </span>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Proficiency and other derived stats */}
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
        </main>
    );
}
