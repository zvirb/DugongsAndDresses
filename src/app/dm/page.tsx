import Link from "next/link";
import { createCampaign } from "../actions";
import DiceRoller from "@/components/DiceRoller";
import TurnTracker from "@/components/TurnTracker";
import AICopyButton from "@/components/AICopyButton";
import HPControls from "@/components/HPControls";
import CampaignSelector from "@/components/CampaignSelector";
import AvatarSelector from "@/components/AvatarSelector";
import { LogEntry } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button, buttonVariants } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { getCampaigns, getActiveCampaign } from "@/lib/queries";

export const dynamic = 'force-dynamic';

export default async function DMPage() {
    const campaignList = await getCampaigns();
    const campaign = await getActiveCampaign();


    if (!campaign) {
        return (
            <div className="p-10 text-center flex flex-col items-center justify-center min-h-screen bg-agent-navy text-white">
                <Card variant="agent" className="max-w-md w-full">
                    <CardHeader>
                        <CardTitle className="text-3xl font-bold text-agent-blue mb-2">Welcome, Dungeon Master</CardTitle>
                        <p className="text-neutral-400">No active campaign found. Start your adventure below.</p>
                    </CardHeader>
                    <CardContent>
                        <form action={async (formData) => {
                            "use server"
                            await createCampaign(formData)
                        }} className="flex flex-col gap-4">
                            <Input
                                type="text"
                                name="name"
                                placeholder="Campaign Name (e.g. The Lost Mine)"
                                defaultValue="New Adventure"
                                className="bg-neutral-900 border-neutral-600"
                            />
                            <Button type="submit" size="lg" className="w-full">
                                Begin Campaign
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-agent-navy text-neutral-100 p-4 font-sans">
            <header className="flex justify-between items-center mb-6 border-b border-agent-blue/20 pb-4">
                <div className="flex items-center gap-6">
                    <h1 className="text-xl font-bold text-agent-blue">DM Control Station</h1>
                    <CampaignSelector campaigns={campaignList} activeId={campaign.id} />
                </div>
                <div className="flex items-center space-x-4">
                    <Link href="/public" target="_blank" className={buttonVariants({ variant: "outline", size: "sm" })}>
                        Open Public View
                    </Link>
                </div>
            </header>

            <div className="grid grid-cols-12 gap-4 h-[calc(100vh-100px)]">
                {/* Left Column: Initiative / Turn Tracker + Dice */}
                <div className="col-span-3 flex flex-col gap-4">
                    <Card variant="agent" className="flex-1 overflow-hidden">
                        <CardContent className="h-full p-4">
                            <TurnTracker initialParticipants={campaign.characters} campaignId={campaign.id} />
                        </CardContent>
                    </Card>
                    <DiceRoller campaignId={campaign.id} />
                </div>

                {/* Center Column: Log & Actions */}
                <div className="col-span-6 flex flex-col gap-4 h-full">
                    <Card variant="agent" className="flex-1 flex flex-col overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b border-agent-blue/20">
                            <CardTitle className="text-agent-blue">Game Log</CardTitle>
                            <AICopyButton
                                logs={campaign.logs}
                                characters={campaign.characters}
                                turnOrder={campaign.characters
                                    .sort((a, b) => b.initiativeRoll - a.initiativeRoll)
                                    .map((c) => ({ name: c.name, init: c.initiativeRoll, current: c.activeTurn }))
                                }
                            />
                        </CardHeader>
                        <CardContent className="flex-1 p-0 overflow-hidden relative">
                            <div className="absolute inset-0 p-4 overflow-y-auto space-y-2 font-mono text-sm text-neutral-300">
                                {campaign.logs.map((log) => (
                                    <div key={log.id} className="border-b border-agent-blue/10 pb-1 last:border-0">
                                        <span className="text-neutral-500 text-xs">[{new Date(log.timestamp).toLocaleTimeString()}]</span> {log.content}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card variant="agent">
                        <CardHeader className="py-2 px-4">
                            <CardTitle className="text-sm text-neutral-400">Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="grid grid-cols-4 gap-2">
                                <Button variant="destructive" size="sm" className="w-full">Attack</Button>
                                <Button variant="secondary" size="sm" className="w-full text-blue-300 border-blue-900/50 hover:bg-blue-900/30">Skill Check</Button>
                                <Button variant="secondary" size="sm" className="w-full text-purple-300 border-purple-900/50 hover:bg-purple-900/30">Cast Spell</Button>
                                <Button variant="ghost" size="sm" className="w-full border border-neutral-600">Log Note</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Stat Blocks */}
                <div className="col-span-3 h-full">
                    <Card variant="agent" className="h-full flex flex-col overflow-hidden">
                        <CardHeader className="py-3 px-4 border-b border-agent-blue/20">
                            <CardTitle className="text-agent-blue">Characters</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 p-4 overflow-y-auto space-y-4">
                            {campaign.characters.map((char) => (
                                <Card key={char.id} className="bg-agent-navy/50 border-agent-blue/20">
                                    <CardContent className="p-3">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-bold text-white">{char.name}</span>
                                            <Badge variant={char.type === 'NPC' ? 'npc' : 'player'}>{char.type}</Badge>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-sm text-neutral-300">
                                            <div>
                                                <div className="flex justify-between items-center">
                                                    <span>HP</span>
                                                    <span className="text-white font-mono">{char.hp}/{char.maxHp}</span>
                                                </div>
                                                <HPControls characterId={char.id} currentHp={char.hp} />
                                            </div>
                                            <div>
                                                <div className="flex justify-between">
                                                    <span>AC</span>
                                                    <span className="text-white font-bold">{char.armorClass}</span>
                                                </div>
                                                <AvatarSelector characterId={char.id} currentUrl={char.imageUrl} />
                                                <div className="text-xs text-neutral-400 mt-1 truncate">
                                                    {char.conditions !== '[]' ? char.conditions : 'Normal'}
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
