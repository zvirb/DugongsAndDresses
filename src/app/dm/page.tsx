import Link from "next/link";
import DiceRoller from "@/components/DiceRoller";
import TurnTracker from "@/components/TurnTracker";
import AICopyButton from "@/components/AICopyButton";
import CharacterManager from "@/components/CharacterManager";
import CampaignSelector from "@/components/CampaignSelector";
import CampaignWizard from "@/components/CampaignWizard";
import QuickActions from "@/components/QuickActions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { buttonVariants } from "@/components/ui/Button";
import { getCampaigns, getActiveCampaign } from "@/lib/queries";
import BackupManager from "@/components/BackupManager";

export const dynamic = 'force-dynamic';

export default async function DMPage() {
    const campaignList = await getCampaigns();
    const campaign = await getActiveCampaign();

    if (!campaign) {
        return <CampaignWizard />;
    }

    return (
        <div className="min-h-screen bg-agent-navy text-neutral-100 p-4 font-sans">
            <header className="flex justify-between items-center mb-6 border-b border-agent-blue/20 pb-4">
                <div className="flex items-center gap-6">
                    <h1 className="text-xl font-bold text-agent-blue">DM Control Station</h1>
                    <CampaignSelector campaigns={campaignList} activeId={campaign.id} />
                </div>
                <div className="flex items-center space-x-4">
                    <Link href="/settings" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                        Settings
                    </Link>
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

                    <QuickActions campaignId={campaign.id} characters={campaign.characters} />
                </div>

                {/* Right Column: Characters */}
                <div className="col-span-3 h-full">
                    <Card variant="agent" className="h-full flex flex-col overflow-hidden">
                        <CardHeader className="py-3 px-4 border-b border-agent-blue/20">
                            <CardTitle className="text-agent-blue">Characters</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 p-4 overflow-y-auto">
                            <CharacterManager characters={campaign.characters} campaignId={campaign.id} />
                        </CardContent>
                    </Card>
                </div>
            </div>

            <div className="mt-8 pb-8 max-w-2xl mx-auto">
                <BackupManager />
            </div>
        </div>
    );
}
