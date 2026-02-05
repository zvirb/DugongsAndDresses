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
      </main>

      <footer className="max-w-6xl mx-auto mt-20 pt-8 border-t border-neutral-800 text-center text-neutral-600 text-sm">
        GEMINI Project &bull; Agent Mesh Design System &bull; 2026
      </footer>
    </div>
  );
}
