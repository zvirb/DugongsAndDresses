import Link from "next/link";
import { getPublicCampaign } from "@/lib/queries";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export const dynamic = 'force-dynamic';

export default async function PlayerSelectionPage() {
    const campaign = await getPublicCampaign();

    if (!campaign) {
        return (
            <div className="min-h-screen bg-agent-navy text-white flex items-center justify-center p-8">
                <Card variant="agent" className="max-w-md w-full text-center">
                    <CardHeader>
                        <CardTitle className="text-2xl text-agent-blue">No Active Campaign</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-neutral-400 mb-6">Waiting for the DM to start a campaign...</p>
                        <Link href="/" className="text-agent-blue hover:underline">Return Home</Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-agent-navy text-white p-6 font-sans">
            <header className="mb-10 text-center">
                <h1 className="text-4xl font-bold text-agent-blue italic mb-2 tracking-tighter">SELECT HERO</h1>
                <p className="text-neutral-500 uppercase tracking-widest text-xs">{campaign.name}</p>
            </header>

            <div className="grid grid-cols-1 gap-6 max-w-2xl mx-auto">
                {campaign.characters.map((char) => (
                    <Link key={char.id} href={`/player/${char.id}`}>
                        <Card variant="agent" className="hover:border-agent-blue transition-all group overflow-hidden relative">
                            {char.imageUrl && (
                                <div className="absolute inset-0 z-0 opacity-10 group-hover:opacity-20 transition-opacity">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={char.imageUrl} alt="" className="w-full h-full object-cover" />
                                </div>
                            )}
                            <CardContent className="p-6 relative z-10 flex items-center gap-6">
                                {char.imageUrl && (
                                    <div className="w-20 h-20 rounded-full border-2 border-agent-blue/30 overflow-hidden shrink-0 shadow-[0_0_15px_rgba(43,43,238,0.2)]">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={char.imageUrl} alt={char.name} className="w-full h-full object-cover" />
                                    </div>
                                )}
                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-1">
                                        <h2 className="text-2xl font-bold group-hover:text-agent-blue transition-colors">
                                            {char.name}
                                        </h2>
                                        <Badge variant="player">LVL {char.level}</Badge>
                                    </div>
                                    <p className="text-neutral-400 italic">
                                        {char.race} {char.class}
                                    </p>
                                </div>
                                <div className="text-agent-blue">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
            
            <footer className="mt-12 text-center">
                <Link href="/" className="text-xs text-neutral-600 hover:text-neutral-400 transition-colors uppercase tracking-widest">
                    Back to Terminal
                </Link>
            </footer>
        </div>
    );
}
