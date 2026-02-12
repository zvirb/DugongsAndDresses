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
import { getCampaigns, getCampaignDetails } from "@/lib/queries";
import BackupManager from "@/components/BackupManager";

export const dynamic = 'force-dynamic';

export default async function DMPage() {
    const campaignList = await getCampaigns();

    // Optimize: Reuse campaignList to identify the active campaign ID instead of fetching again
    const activeCampaignInfo = campaignList.find(c => c.active) || campaignList[0];
    const campaign = activeCampaignInfo ? await getCampaignDetails(activeCampaignInfo.id) : null;

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
                <header className="flex justify-between items-center mb-6 border-b border-agent-blue/20 pb-4 bg-agent-navy/50 backdrop-blur-sm -mx-4 px-4 pt-4">
                    <div className="flex flex-col">
                        <div className="text-agent-blue font-mono text-[10px] animate-pulse tracking-widest uppercase mb-1 flex items-center gap-2">
                             <span className="w-1.5 h-1.5 bg-agent-blue rounded-full shadow-[0_0_5px_#2b2bee]" />
                            SYSTEM STATUS: ONLINE // SECURE CONNECTION
                        </div>
                        <div className="flex items-center gap-6">
                            <h1 className="text-2xl font-black italic tracking-tighter text-white uppercase leading-none drop-shadow-[0_0_15px_rgba(43,43,238,0.5)]">
                                DM Control Station
                            </h1>
                            <div className="h-6 w-px bg-agent-blue/30 mx-2" />
                            <CampaignSelector campaigns={campaignList} activeId={campaign.id} />
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <Link
                            href="/settings"
                            className={buttonVariants({ variant: "ghost", size: "sm", className: "text-neutral-400 hover:text-white uppercase tracking-wider text-xs font-bold" })}
                        >
                            Settings
                        </Link>
                        <Link
                            href="/public"
                            target="_blank"
                            className={buttonVariants({ variant: "outline", size: "sm", className: "border-agent-blue/50 text-agent-blue hover:bg-agent-blue/10 hover:text-white hover:border-agent-blue transition-all shadow-[0_0_10px_rgba(43,43,238,0.1)] hover:shadow-[0_0_20px_rgba(43,43,238,0.4)] uppercase tracking-wider text-xs font-bold" })}
                        >
                            Open Public View
                        </Link>
                    </div>
                </header>

                <div className="grid grid-cols-12 gap-4 h-[calc(100vh-100px)]">
                    {/* Left Column: Initiative / Turn Tracker + Dice */}
                    <div className="col-span-3 flex flex-col gap-4">
                        <Card variant="agent" className="flex-1 overflow-hidden flex flex-col shadow-[0_0_20px_rgba(0,0,0,0.3)]">
                            <CardHeader className="py-3 px-4 border-b border-agent-blue/20 bg-agent-navy/80 backdrop-blur-md">
                                <CardTitle className="text-agent-blue uppercase tracking-widest text-xs font-bold flex items-center gap-2">
                                    Turn Order
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="h-full p-4 bg-black/20">
                                <TurnTracker initialParticipants={campaign.characters} campaignId={campaign.id} />
                            </CardContent>
                        </Card>
                        <DiceRoller campaignId={campaign.id} />
                    </div>

                    {/* Center Column: Log & Actions */}
                    <div className="col-span-6 flex flex-col gap-4 h-full">
                        <Card variant="agent" className="flex-1 flex flex-col overflow-hidden relative group shadow-[0_0_30px_rgba(43,43,238,0.1)] border-agent-blue/40">
                            <div className="absolute inset-0 bg-agent-blue/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-0" />
                            <CardHeader className="flex flex-row items-center justify-between py-2 px-4 border-b border-agent-blue/20 z-10 bg-agent-navy/90 backdrop-blur-md">
                                <CardTitle className="text-agent-blue uppercase tracking-widest text-xs font-bold flex items-center gap-2">
                                    <span className="w-2 h-2 bg-agent-blue rounded-full animate-pulse shadow-[0_0_10px_#2b2bee]" />
                                    Terminal Log
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
                            <CardContent className="flex-1 p-0 overflow-hidden relative z-10 bg-black/95 font-mono text-xs text-agent-blue font-bold border-l-4 border-agent-blue/20">
                                <div className="absolute inset-0 p-4 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-agent-blue/30 scrollbar-track-transparent">
                                    {campaign.logs.map((log) => (
                                        <div key={log.id} className="border-b border-white/5 pb-1 last:border-0 hover:bg-white/5 transition-colors px-2 -mx-2 rounded flex gap-2">
                                            <span className="text-agent-blue/40 whitespace-nowrap text-[10px] mt-0.5">
                                                [{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}]
                                            </span>
                                            <span className="text-agent-blue/90 drop-shadow-sm leading-relaxed">{log.content}</span>
                                        </div>
                                    ))}
                                    <div className="mt-2 text-agent-blue flex items-center gap-2 opacity-50">
                                        <span className="animate-pulse inline-block w-2 h-4 bg-agent-blue/50"></span>
                                        <span className="text-[10px] tracking-widest uppercase">Awaiting Input...</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <QuickActions campaignId={campaign.id} characters={campaign.characters} />
                    </div>

                    {/* Right Column: Characters */}
                    <div className="col-span-3 h-full">
                        <Card variant="agent" className="h-full flex flex-col overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.3)]">
                            <CardHeader className="py-3 px-4 border-b border-agent-blue/20 bg-agent-navy/80 backdrop-blur-md">
                                <CardTitle className="text-agent-blue uppercase tracking-widest text-xs font-bold">Characters</CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-agent-blue/30 scrollbar-track-transparent bg-black/20">
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
