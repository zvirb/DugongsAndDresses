import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import Link from "next/link";

export default function ExamplesPage() {
  return (
    <div className="min-h-screen bg-agent-navy text-white p-8 font-sans">
      <header className="max-w-6xl mx-auto mb-12 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-agent-blue mb-2">Component Gallery</h1>
          <p className="text-neutral-400">Agent Mesh Design System Examples</p>
        </div>
        <Link href="/" className="text-agent-blue hover:underline">
          Back to Home
        </Link>
      </header>

      <main className="max-w-6xl mx-auto space-y-12">
        {/* Buttons Section */}
        <section>
          <h2 className="text-2xl font-semibold mb-6 border-b border-neutral-800 pb-2">Buttons</h2>
          <div className="flex flex-wrap gap-4 items-center">
            <Button variant="agent">Agent Variant</Button>
            <Button variant="primary">Primary (Amber)</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="success">Success</Button>
            <Button variant="ghost">Ghost</Button>
          </div>
          <div className="mt-4 flex flex-wrap gap-4 items-center">
            <Button variant="agent" size="sm">Small Agent</Button>
            <Button variant="agent" size="md">Medium Agent</Button>
            <Button variant="agent" size="lg">Large Agent</Button>
          </div>
        </section>

        {/* Cards Section */}
        <section>
          <h2 className="text-2xl font-semibold mb-6 border-b border-neutral-800 pb-2">Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card variant="agent">
              <CardHeader>
                <CardTitle>Agent Mesh Card</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-neutral-300">
                  This card uses the Agent Mesh variant with a subtle neon glow and dark navy background.
                </p>
                <Button variant="agent" className="mt-4">Action</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Standard Card</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-neutral-300">
                  This is the standard neutral card used throughout the DM Dashboard.
                </p>
                <Button variant="secondary" className="mt-4">Action</Button>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Badges Section */}
        <section>
          <h2 className="text-2xl font-semibold mb-6 border-b border-neutral-800 pb-2">Badges</h2>
          <div className="flex flex-wrap gap-4">
            <Badge variant="agent">Agent Badge</Badge>
            <Badge variant="player">Player</Badge>
            <Badge variant="npc">NPC</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="secondary">Secondary</Badge>
          </div>
        </section>

        {/* Form Elements Section */}
        <section>
          <h2 className="text-2xl font-semibold mb-6 border-b border-neutral-800 pb-2">Form Elements</h2>
          <div className="max-w-md space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-400">Standard Input</label>
              <Input placeholder="Enter character name..." />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-400">Agent Style Input (Manual Class)</label>
              <Input 
                placeholder="Search campaigns..." 
                className="border-agent-blue/50 focus:border-agent-blue focus:ring-agent-blue/20 bg-agent-navy/50"
              />
            </div>
          </div>
        </section>

        {/* Typography Section */}
        <section>
          <h2 className="text-2xl font-semibold mb-6 border-b border-neutral-800 pb-2">Typography (Space Grotesk)</h2>
          <div className="space-y-4">
            <h1 className="text-5xl font-bold italic text-agent-blue">H1: Bold Italic Title</h1>
            <h2 className="text-4xl font-semibold">H2: Semi-bold Heading</h2>
            <h3 className="text-3xl font-medium text-neutral-300">H3: Medium Sub-heading</h3>
            <p className="text-lg leading-relaxed text-neutral-400">
              The quick brown fox jumps over the lazy dog. This text is rendered in Space Grotesk, 
              providing a modern, technical feel to the GEMINI interface.
            </p>
            <p className="font-mono text-sm text-neutral-500">
              Monospace text for technical details and dice roll logs.
            </p>
          </div>
        </section>

        {/* Player Interface Preview */}
        <section>
          <h2 className="text-2xl font-semibold mb-6 border-b border-neutral-800 pb-2">Mobile Player UI Preview</h2>
          <div className="max-w-sm mx-auto bg-agent-navy rounded-[3rem] p-6 border-8 border-neutral-900 shadow-2xl overflow-hidden aspect-[9/19] flex flex-col">
            <div className="w-16 h-1 bg-neutral-800 rounded-full mx-auto mb-6" />
            
            <div className="flex justify-between items-center mb-6">
                <Badge variant="agent">LVL 5</Badge>
                <div className="w-2 h-2 bg-agent-blue rounded-full animate-pulse" />
            </div>

            <div className="mb-6">
                <h3 className="text-3xl font-black italic tracking-tighter uppercase leading-none">Grom</h3>
                <p className="text-agent-blue text-[10px] font-bold uppercase tracking-widest">Orc // Barbarian</p>
            </div>

            <div className="space-y-2 mb-8">
                <div className="flex justify-between items-baseline">
                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Vitality</span>
                    <span className="text-4xl font-black italic">25 <span className="text-base text-neutral-600 font-medium">/ 25</span></span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full w-full bg-agent-blue" />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-8">
                <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
                    <span className="block text-[8px] text-neutral-500 uppercase font-bold tracking-widest mb-1">Defense</span>
                    <span className="text-xl font-bold">14</span>
                </div>
                <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
                    <span className="block text-[8px] text-neutral-500 uppercase font-bold tracking-widest mb-1">Speed</span>
                    <span className="text-xl font-bold">30 <span className="text-[10px] font-normal text-neutral-600">ft</span></span>
                </div>
            </div>

            <div className="mt-auto flex gap-2">
                <div className="flex-1 h-12 bg-red-900/50 rounded-xl border-b-2 border-red-950" />
                <div className="flex-1 h-12 bg-emerald-900/50 rounded-xl border-b-2 border-emerald-950" />
            </div>
            
            <div className="w-32 h-1 bg-neutral-800 rounded-full mx-auto mt-8 mb-2" />
          </div>
        </section>
      </main>

      <footer className="max-w-6xl mx-auto mt-20 pt-8 border-t border-neutral-800 text-center text-neutral-600 text-sm">
        GEMINI Project &bull; Agent Mesh Design System &bull; 2026
      </footer>
    </div>
  );
}
