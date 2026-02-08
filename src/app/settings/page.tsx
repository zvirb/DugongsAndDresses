
import { getSettings, updateSettings } from "@/app/actions";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
    const response = await getSettings();
    const settings = response.success && response.data ? response.data : {
        ollamaModel: "llama3",
        enableStoryGen: false,
        autoBackup: true,
        backupCount: 10
    };

    async function handleSave(formData: FormData) {
        "use server";
        await updateSettings(formData);
    }

    return (
        <div className="min-h-screen bg-agent-navy text-white p-8 font-sans flex flex-col items-center">
            <header className="w-full max-w-2xl mb-8 flex justify-between items-center border-b border-agent-blue/20 pb-4">
                <h1 className="text-3xl font-bold text-agent-blue uppercase tracking-tighter italic">System Configuration</h1>
                <Link href="/dm" className="text-neutral-400 hover:text-white text-xs uppercase tracking-widest font-bold">
                    Exit to DM Console
                </Link>
            </header>

            <Card variant="agent" className="w-full max-w-2xl shadow-2xl shadow-black/50">
                <CardHeader className="bg-neutral-900/50 border-b border-white/5">
                    <CardTitle className="text-lg font-mono text-neutral-300 uppercase tracking-widest">Global Settings</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <form action={handleSave} className="space-y-6">

                        <div className="space-y-2">
                            <label className="text-xs font-black text-agent-blue uppercase tracking-widest ml-1">Ollama Model</label>
                            <Input
                                name="ollamaModel"
                                defaultValue={settings.ollamaModel}
                                placeholder="e.g. llama3, mistral"
                                className="bg-neutral-950 border-neutral-800 text-neutral-300 font-mono"
                            />
                            <p className="text-[10px] text-neutral-500 ml-1 uppercase tracking-wide">The LLM model used for AI generation.</p>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-neutral-950 rounded-xl border border-neutral-800 group hover:border-agent-blue/30 transition-colors">
                            <div>
                                <label className="text-sm font-bold text-white uppercase tracking-wide block mb-1">Enable Story Generation</label>
                                <p className="text-xs text-neutral-500 group-hover:text-neutral-400">Allow AI to auto-generate narrative logs.</p>
                            </div>
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    name="enableStoryGen"
                                    defaultChecked={settings.enableStoryGen}
                                    className="w-5 h-5 accent-agent-blue bg-neutral-900 border-neutral-600 rounded cursor-pointer"
                                />
                            </div>
                        </div>

                         <div className="flex items-center justify-between p-4 bg-neutral-950 rounded-xl border border-neutral-800 group hover:border-agent-blue/30 transition-colors">
                            <div>
                                <label className="text-sm font-bold text-white uppercase tracking-wide block mb-1">Auto Backup</label>
                                <p className="text-xs text-neutral-500 group-hover:text-neutral-400">Automatically backup database daily.</p>
                            </div>
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    name="autoBackup"
                                    defaultChecked={settings.autoBackup}
                                    className="w-5 h-5 accent-agent-blue bg-neutral-900 border-neutral-600 rounded cursor-pointer"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-agent-blue uppercase tracking-widest ml-1">Backup Retention Count</label>
                            <Input
                                type="number"
                                name="backupCount"
                                defaultValue={settings.backupCount}
                                className="bg-neutral-950 border-neutral-800 text-neutral-300 font-mono"
                            />
                             <p className="text-[10px] text-neutral-500 ml-1 uppercase tracking-wide">Number of backups to keep before rotating.</p>
                        </div>

                        <div className="pt-4 flex justify-end border-t border-white/5 mt-6">
                            <Button type="submit" variant="agent" className="px-8 font-black tracking-widest uppercase">
                                Save Configuration
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
