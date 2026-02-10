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
        <div className="min-h-screen bg-agent-navy text-neutral-100 p-4 font-sans relative overflow-hidden">
            {/* Background elements for technical feel */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#2b2bee10_1px,transparent_1px),linear-gradient(to_bottom,#2b2bee10_1px,transparent_1px)] [background-size:20px_20px] opacity-10" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#101022_90%)] opacity-80" />
            </div>

            <div className="relative z-10">
                <header className="flex justify-between items-center mb-6 border-b border-agent-blue/20 pb-4">
                    <div className="flex flex-col">
                        <div className="text-agent-blue font-mono text-[10px] animate-pulse tracking-widest uppercase mb-1">
                            SYSTEM STATUS: ONLINE // SECURE CONNECTION
                        </div>
                        <div className="flex items-center gap-6">
                            <h1 className="text-xl font-black italic tracking-tighter text-white uppercase leading-none drop-shadow-[0_0_10px_rgba(43,43,238,0.5)]">
                                DM Control Station
                            </h1>
                            <CampaignSelector campaigns={campaignList} activeId={campaign.id} />
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <Link
                            href="/settings"
                            className={buttonVariants({ variant: "ghost", size: "sm", className: "text-neutral-400 hover:text-white" })}
                        >
                            Settings
                        </Link>
                        <Link
                            href="/public"
                            target="_blank"
                            className={buttonVariants({ variant: "outline", size: "sm", className: "border-agent-blue/50 text-agent-blue hover:bg-agent-blue/10 hover:text-white hover:border-agent-blue transition-all shadow-[0_0_10px_rgba(43,43,238,0.1)] hover:shadow-[0_0_20px_rgba(43,43,238,0.4)]" })}
                        >
                            Open Public View
                        </Link>
                    </div>
                </header>

                <div className="grid grid-cols-12 gap-4 h-[calc(100vh-100px)]">
                    {/* Left Column: Initiative / Turn Tracker + Dice */}
                    <div className="col-span-3 flex flex-col gap-4">
                        <Card variant="agent" className="flex-1 overflow-hidden flex flex-col">
                            <CardContent className="h-full p-4">
                                <TurnTracker initialParticipants={campaign.characters} campaignId={campaign.id} />
                            </CardContent>
                        </Card>
                        <DiceRoller campaignId={campaign.id} />
                    </div>

                    {/* Center Column: Log & Actions */}
                    <div className="col-span-6 flex flex-col gap-4 h-full">
                        <Card variant="agent" className="flex-1 flex flex-col overflow-hidden relative group">
                            <div className="absolute inset-0 bg-agent-blue/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-0" />
                            <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b border-agent-blue/20 z-10 bg-agent-navy/50 backdrop-blur-sm">
                                <CardTitle className="text-agent-blue uppercase tracking-widest text-sm font-bold flex items-center gap-2">
                                    <span className="w-2 h-2 bg-agent-blue rounded-full animate-pulse shadow-[0_0_10px_#2b2bee]" />
                                    Game Log
                                </CardTitle>
                                <AICopyButton
                                    logs={campaign.logs}
                                    characters={campaign.characters}
                                    turnOrder={campaign.characters
                                        .sort((a, b) => b.initiativeRoll - a.initiativeRoll)
                                        .map((c) => ({ name: c.name, init: c.initiativeRoll, current: c.activeTurn }))
                                    }
                                />
                            </CardHeader>
                            <CardContent className="flex-1 p-0 overflow-hidden relative z-10">
                                <div className="absolute inset-0 p-4 overflow-y-auto space-y-2 font-mono text-xs text-blue-100 scrollbar-thin scrollbar-thumb-agent-blue/30 scrollbar-track-transparent">
                                    {campaign.logs.map((log) => (
                                        <div key={log.id} className="border-b border-agent-blue/10 pb-2 last:border-0 hover:bg-white/5 transition-colors px-2 -mx-2 rounded">
                                            <span className="text-agent-blue/60 mr-2 opacity-70">
                                                [{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}]
                                            </span>
                                            <span className="text-white/90 drop-shadow-sm">{log.content}</span>
                                        </div>
                                    ))}
                                    <div className="animate-pulse text-agent-blue font-bold mt-2">_</div>
                                </div>
                            </CardContent>
                        </Card>

                        <QuickActions campaignId={campaign.id} characters={campaign.characters} />
                    </div>

                    {/* Right Column: Characters */}
                    <div className="col-span-3 h-full">
                        <Card variant="agent" className="h-full flex flex-col overflow-hidden">
                            <CardHeader className="py-3 px-4 border-b border-agent-blue/20 bg-agent-navy/50 backdrop-blur-sm">
                                <CardTitle className="text-agent-blue uppercase tracking-widest text-sm font-bold">Characters</CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-agent-blue/30 scrollbar-track-transparent">
                                <CharacterManager characters={campaign.characters} campaignId={campaign.id} />
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <div className="mt-8 pb-8 max-w-2xl mx-auto opacity-50 hover:opacity-100 transition-opacity">
                    <BackupManager />
                </div>
            </div>
        </div>
    );
}
