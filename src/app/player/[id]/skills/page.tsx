import { getPlayerSkills } from "@/lib/queries";
import { notFound } from "next/navigation";
import { parseAttributes } from "@/lib/safe-json";
import PlayerSkillsList from "@/components/PlayerSkillsList";

export const dynamic = 'force-dynamic';

interface SkillsPageProps {
    params: Promise<{ id: string }>;
}

export default async function SkillsPage({ params }: SkillsPageProps) {
    const { id } = await params;
    const character = await getPlayerSkills(id);

    if (!character || character.type !== 'PLAYER') {
        notFound();
    }

    const attrs = parseAttributes(character.attributes);

    return (
        <main className="flex-1 p-4 space-y-6 pb-32">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-agent-blue rounded-full" />
                Ability Scores
            </h2>

            <PlayerSkillsList characterId={character.id} attributes={attrs} />

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
