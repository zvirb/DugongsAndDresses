import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { createCampaign } from "../actions";
import DiceRoller from "@/components/DiceRoller";
import TurnTracker from "@/components/TurnTracker";
import AICopyButton from "@/components/AICopyButton";
import HPControls from "@/components/HPControls";
import { LogEntry, CharacterWithState } from "@/types";

export const dynamic = 'force-dynamic';

export default async function DMPage() {
    const campaigns = await prisma.campaign.findMany({
        where: { active: true },
        include: { characters: true, logs: { take: 10, orderBy: { timestamp: 'desc' } } }
    });

    const campaign = campaigns[0]; // Just take first active campaign for now

    if (!campaign) {
        <div className="p-10 text-center flex flex-col items-center justify-center min-h-screen">
            <h1 className="text-3xl font-bold mb-4 text-amber-500">Welcome, Dungeon Master</h1>
            <p className="mb-6 text-neutral-400">No active campaign found. Start your adventure below.</p>

            <form action={createCampaign} className="flex gap-2">
                <input
                    type="text"
                    name="name"
                    placeholder="Campaign Name (e.g. The Lost Mine)"
                    className="px-4 py-2 rounded bg-neutral-800 border border-neutral-600 focus:border-amber-500 outline-none"
                    defaultValue="New Adventure"
                />
                <button type="submit" className="bg-amber-600 hover:bg-amber-500 text-black font-bold px-6 py-2 rounded">
                    Begin Campaign
                </button>
            </form>
        </div>
    }

    return (
        <div className="min-h-screen bg-neutral-900 text-neutral-100 p-4 font-sans">
            <header className="flex justify-between items-center mb-6 border-b border-neutral-700 pb-4">
                <h1 className="text-xl font-bold text-amber-500">DM Control Station</h1>
                <div className="space-x-4">
                    <Link href="/public" target="_blank" className="text-blue-400 hover:underline">Open Public View</Link>
                    <span className="text-neutral-500">Campaign: {campaign.name}</span>
                </div>
            </header>

            <div className="grid grid-cols-12 gap-4 h-[calc(100vh-100px)]">
                {/* Left Column: Initiative / Turn Tracker + Dice */}
                <div className="col-span-3 flex flex-col gap-4">
                    <div className="bg-neutral-800 rounded-lg p-4 flex-1 border border-neutral-700 overflow-hidden">
                        <TurnTracker initialParticipants={campaign.characters} campaignId={campaign.id} />
                    </div>
                    <DiceRoller campaignId={campaign.id} />
                </div>

                {/* Center Column: Log & Actions */}
                <div className="col-span-6 bg-neutral-800 rounded-lg p-4 flex flex-col border border-neutral-700">
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="text-lg font-semibold text-blue-400">Game Log</h2>
                        <AICopyButton
                            logs={campaign.logs}
                            characters={campaign.characters}
                            turnOrder={campaign.characters
                                .sort((a: CharacterWithState, b: CharacterWithState) => b.initiativeRoll - a.initiativeRoll)
                                .map((c: CharacterWithState) => ({ name: c.name, init: c.initiativeRoll, current: c.activeTurn }))
                            }
                        />
                    </div>
                    <div className="flex-1 bg-neutral-900 rounded p-4 mb-4 overflow-y-auto font-mono text-sm space-y-2 border border-neutral-700">
                        {campaign.logs.map((log: LogEntry) => (
                            <div key={log.id} className="border-b border-neutral-800 pb-1">
                                <span className="text-neutral-500 text-xs">[{new Date(log.timestamp).toLocaleTimeString()}]</span> {log.content}
                            </div>
                        ))}
                    </div>

                    <div className="mt-auto">
                        <h3 className="text-sm font-semibold mb-2 text-neutral-400">Quick Actions</h3>
                        <div className="grid grid-cols-4 gap-2">
                            <button className="bg-red-900 hover:bg-red-800 text-red-100 p-2 rounded text-sm">Attack</button>
                            <button className="bg-blue-900 hover:bg-blue-800 text-blue-100 p-2 rounded text-sm">Skill Check</button>
                            <button className="bg-purple-900 hover:bg-purple-800 text-purple-100 p-2 rounded text-sm">Cast Spell</button>
                            <button className="bg-neutral-600 hover:bg-neutral-500 text-white p-2 rounded text-sm">Log Note</button>
                        </div>
                    </div>
                </div>

                {/* Right Column: Stat Blocks */}
                <div className="col-span-3 bg-neutral-800 rounded-lg p-4 overflow-y-auto border border-neutral-700">
                    <h2 className="text-lg font-semibold mb-4 text-amber-400">Characters</h2>
                    <div className="space-y-4">
                        {campaign.characters.map((char: CharacterWithState) => (
                            <div key={char.id} className="bg-neutral-700 p-3 rounded border border-neutral-600">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-bold">{char.name}</span>
                                    <span className="text-xs bg-neutral-900 px-2 py-0.5 rounded text-neutral-400">{char.type}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm text-neutral-300">
                                    <div>
                                        HP: <span className="text-white">{char.hp}/{char.maxHp}</span>
                                        <HPControls characterId={char.id} currentHp={char.hp} />
                                    </div>
                                    <div>AC: <span className="text-white">{char.armorClass}</span></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
